import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Sale, Product, Customer, CashBook, ActivityLog } from "@/lib/models";
import { convertQuantity } from "@/lib/units";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const sale = await Sale.findById(id).lean();
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerAddress,
      items,
      paidAmount,
      paymentMethod,
      date,
      notes,
    } = body;

    const sale = await Sale.findById(id);
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    // 1. Revert old stock deduction
    for (const oldItem of sale.items) {
      const product = await Product.findById(oldItem.productId);
      if (product) {
        const oldItemUnit = (oldItem.unit || product.unit || "maund").toLowerCase();
        const productUnit = (product.unit || "maund").toLowerCase();
        const oldQtyInBase = convertQuantity(
          oldItem.quantity,
          oldItemUnit,
          productUnit,
          product.bagStock?.bagCapacityKg || 50
        );
        product.currentStock = Number((product.currentStock + oldQtyInBase).toFixed(3));
        if (product.bagStock && product.bagStock.filledBags !== undefined) {
          const bagsRestored = Math.round(
            convertQuantity(oldItem.quantity, oldItemUnit, "bag", product.bagStock.bagCapacityKg || 50)
          );
          product.bagStock.filledBags += bagsRestored;
        }
        await product.save();
      }
    }

    // 2. Validate and apply new stock deduction
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
      const qtyInBase = convertQuantity(
        qty,
        itemUnit,
        productUnit,
        product.bagStock?.bagCapacityKg || 50
      );

      if (product.currentStock < qtyInBase) {
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

      // Deduct new quantity in base unit
      product.currentStock = Math.max(0, Number((product.currentStock - qtyInBase).toFixed(3)));
      if (product.bagStock && product.bagStock.filledBags > 0) {
        const bagsDeducted = Math.round(
          convertQuantity(qty, itemUnit, "bag", product.bagStock.bagCapacityKg || 50)
        );
        product.bagStock.filledBags = Math.max(0, product.bagStock.filledBags - bagsDeducted);
      }
      await product.save();
    }

    const newPaidVal = Number(paidAmount) || 0;
    const newDueVal = Math.max(0, netAmount - newPaidVal);

    // 3. Adjust customer ledger if customer was/is regular
    if (sale.customerId) {
      const oldCustomer = await Customer.findById(sale.customerId);
      if (oldCustomer) {
        oldCustomer.totalPaid = Math.max(0, oldCustomer.totalPaid - sale.paidAmount);
        oldCustomer.totalPending = Math.max(0, oldCustomer.totalPending - sale.dueAmount);
        await oldCustomer.save();
      }
    }

    const targetCustomerId = body.customerId || sale.customerId;
    if (targetCustomerId) {
      const newCustomer = await Customer.findById(targetCustomerId);
      if (newCustomer) {
        newCustomer.totalPaid += newPaidVal;
        newCustomer.totalPending += newDueVal;
        await newCustomer.save();
      }
    }

    // 4. Adjust CashBook
    const cashEntry = await CashBook.findOne({ referenceId: sale.invoiceNumber });
    if (cashEntry) {
      if (newPaidVal > 0) {
        cashEntry.amount = newPaidVal;
        cashEntry.paymentMethod = paymentMethod || "cash";
        cashEntry.description = `Sale slip #${sale.invoiceNumber} for ${customerName || sale.customerName}`;
        await cashEntry.save();
      } else {
        await CashBook.findByIdAndDelete(cashEntry._id);
      }
    } else if (newPaidVal > 0) {
      await CashBook.create({
        type: "income",
        category: "sale_payment",
        amount: newPaidVal,
        paymentMethod: paymentMethod || "cash",
        description: `Sale slip #${sale.invoiceNumber} for ${customerName || sale.customerName}`,
        referenceId: sale.invoiceNumber,
        date: date ? new Date(date) : sale.date,
      });
    }

    // 5. Update Sale record
    sale.customerName = customerName || sale.customerName;
    sale.customerPhone = customerPhone !== undefined ? customerPhone : sale.customerPhone;
    sale.customerAddress = customerAddress !== undefined ? customerAddress : sale.customerAddress;
    sale.items = validatedItems as any;
    sale.totalAmount = totalAmount;
    sale.discountAmount = discountAmount;
    sale.netAmount = netAmount;
    sale.paidAmount = newPaidVal;
    sale.dueAmount = newDueVal;
    sale.paymentMethod = paymentMethod || sale.paymentMethod;
    if (date) sale.date = new Date(date);
    if (notes !== undefined) sale.notes = notes;
    await sale.save();

    await ActivityLog.create({
      action: "UPDATE_SALE",
      entity: "Sale",
      details: `Updated sale #${sale.invoiceNumber} for ${sale.customerName} (New Net: Rs ${netAmount}, Paid: Rs ${newPaidVal})`,
    });

    return NextResponse.json(sale);
  } catch (error: unknown) {
    console.error("Sale update error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const sale = await Sale.findById(id);
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // 1. Restore stock in inventory
    for (const item of sale.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const itemUnit = (item.unit || product.unit || "maund").toLowerCase();
        const productUnit = (product.unit || "maund").toLowerCase();
        const qtyInBase = convertQuantity(
          item.quantity,
          itemUnit,
          productUnit,
          product.bagStock?.bagCapacityKg || 50
        );
        product.currentStock = Number((product.currentStock + qtyInBase).toFixed(3));
        if (product.bagStock && product.bagStock.filledBags !== undefined) {
          const bagsRestored = Math.round(
            convertQuantity(item.quantity, itemUnit, "bag", product.bagStock.bagCapacityKg || 50)
          );
          product.bagStock.filledBags += bagsRestored;
        }
        await product.save();
      }
    }

    // 2. Revert customer ledger
    if (sale.customerId) {
      const customer = await Customer.findById(sale.customerId);
      if (customer) {
        customer.totalPaid = Math.max(0, customer.totalPaid - sale.paidAmount);
        customer.totalPending = Math.max(0, customer.totalPending - sale.dueAmount);
        await customer.save();
      }
    }

    // 3. Remove CashBook entry
    await CashBook.deleteMany({ referenceId: sale.invoiceNumber });

    // 4. Delete sale
    await Sale.findByIdAndDelete(id);

    await ActivityLog.create({
      action: "DELETE_SALE",
      entity: "Sale",
      details: `Deleted sale #${sale.invoiceNumber} for ${sale.customerName} and restored inventory stock.`,
    });

    return NextResponse.json({
      success: true,
      message: `Sale #${sale.invoiceNumber} deleted and stock restored successfully!`,
    });
  } catch (error: unknown) {
    console.error("Sale deletion error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
