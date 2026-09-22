import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Sale, Product, Customer, CashBook, ActivityLog } from "@/lib/models";
import { convertQuantity } from "@/lib/units";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const customerType = searchParams.get("customerType");
    const customerId = searchParams.get("customerId");

    const query: any = {};
    if (customerType) query.customerType = customerType;
    if (customerId) query.customerId = customerId;

    const sales = await Sale.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(sales);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      customerType, // 'local' | 'regular'
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      items, // [{ productId, productName, grade, quantity, unit, rate, discount, total }]
      paidAmount,
      paymentMethod,
      date,
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one grain item is required" }, { status: 400 });
    }

    if (!customerName) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    // Calculate totals
    let totalAmount = 0;
    let discountAmount = 0;
    let netAmount = 0;

    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Grain ${item.productName || item.productId} not found` },
          { status: 404 }
        );
      }

      const qty = Number(item.quantity);
      if (qty <= 0) {
        return NextResponse.json({ error: "Quantity must be greater than zero" }, { status: 400 });
      }

      const itemUnit = (item.unit || product.unit || "maund").toLowerCase();
      const productUnit = (product.unit || "maund").toLowerCase();
      const qtyInProdUnit = convertQuantity(
        qty,
        itemUnit,
        productUnit,
        product.bagStock?.bagCapacityKg || 50
      );

      if (product.currentStock < qtyInProdUnit) {
        const stockKg = productUnit === "maund" ? product.currentStock * 40 : product.currentStock;
        const availableText =
          productUnit === "maund"
            ? `${product.currentStock} maund (${stockKg.toLocaleString()} kg)`
            : `${product.currentStock} ${productUnit}`;

        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${availableText}`,
          },
          { status: 400 }
        );
      }

      const rateVal = Number(item.rate);
      const discountVal = Number(item.discount) || 0;
      const subtotal = qty * rateVal;
      const itemDiscountTotal = qty * discountVal;
      const itemFinalTotal = subtotal - itemDiscountTotal;

      totalAmount += subtotal;
      discountAmount += itemDiscountTotal;
      netAmount += itemFinalTotal;

      validatedItems.push({
        productId: product._id,
        productName: product.name,
        grade: item.grade || "Standard",
        quantity: qty,
        unit: itemUnit,
        rate: rateVal,
        discount: discountVal,
        total: itemFinalTotal,
      });

      // 1. AUTO-UPDATE: Deduct stock from inventory in base unit
      product.currentStock = Math.max(
        0,
        Number((product.currentStock - qtyInProdUnit).toFixed(3))
      );
      if (product.bagStock && product.bagStock.filledBags > 0) {
        const bagsDeducted = Math.round(
          convertQuantity(qty, itemUnit, "bag", product.bagStock.bagCapacityKg || 50)
        );
        product.bagStock.filledBags = Math.max(0, product.bagStock.filledBags - bagsDeducted);
      }
      await product.save();
    }

    const paidVal = Number(paidAmount) || 0;
    const dueVal = Math.max(0, netAmount - paidVal);

    // Generate Unique Invoice Number safely
    const year = new Date().getFullYear();
    let invoiceNumber = "";
    let isUnique = false;
    let seq = (await Sale.countDocuments()) + 1;
    while (!isUnique) {
      invoiceNumber = `GF-${year}-${String(seq).padStart(4, "0")}`;
      const existing = await Sale.findOne({ invoiceNumber }).select("_id").lean();
      if (!existing) {
        isUnique = true;
      } else {
        seq++;
      }
    }

    // 2. Create Sale Record
    const sale = await Sale.create({
      invoiceNumber,
      customerType: customerType || "local",
      customerId: customerId || undefined,
      customerName,
      customerPhone: customerPhone || "",
      customerAddress: customerAddress || "",
      items: validatedItems,
      totalAmount,
      discountAmount,
      netAmount,
      paidAmount: paidVal,
      dueAmount: dueVal,
      paymentMethod: paymentMethod || "cash",
      date: date ? new Date(date) : new Date(),
      notes: notes || "",
    });

    // 3. If Regular Customer, update ledger
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        customer.totalPaid += paidVal;
        customer.totalPending += dueVal;
        if (paymentMethod === "advance" && customer.advanceBalance > 0) {
          const usedAdvance = Math.min(customer.advanceBalance, paidVal);
          customer.advanceBalance -= usedAdvance;
        }
        await customer.save();
      }
    }

    // 4. Record CashBook Income if payment was made
    if (paidVal > 0 && paymentMethod !== "advance") {
      await CashBook.create({
        type: "income",
        category: "sale_payment",
        amount: paidVal,
        paymentMethod: paymentMethod || "cash",
        description: `Sale slip #${invoiceNumber} for ${customerName} (${customerType})`,
        referenceId: invoiceNumber,
        date: sale.date,
      });
    }

    await ActivityLog.create({
      action: "CREATE_SALE",
      entity: "Sale",
      details: `Generated sale slip ${invoiceNumber} for ${customerName} (Net: Rs ${netAmount}, Paid: Rs ${paidVal})`,
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error: unknown) {
    console.error("Sale creation error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
