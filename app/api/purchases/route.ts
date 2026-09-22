import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Purchase, Product, Supplier, CashBook, ActivityLog } from "@/lib/models";
import { convertQuantity } from "@/lib/units";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");
    const productId = searchParams.get("productId");

    const query: any = {};
    if (supplierId) query.supplierId = supplierId;
    if (productId) query.productId = productId;

    const purchases = await Purchase.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(purchases);
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
      supplierId,
      productId,
      grade,
      quantity,
      unit,
      rate,
      totalAmount,
      paidAmount,
      paymentMethod,
      date,
      notes,
    } = body;

    const qty = Number(quantity);
    const rateVal = Number(rate);
    const totalVal = Number(totalAmount) || qty * rateVal;
    const paidVal = Number(paidAmount) || 0;
    const dueVal = Math.max(0, totalVal - paidVal);

    if (!supplierId || !productId || !qty || qty <= 0) {
      return NextResponse.json(
        { error: "Supplier, grain type, and valid quantity are required" },
        { status: 400 }
      );
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Grain product not found" }, { status: 404 });
    }

    // 1. Create Purchase record
    const purchase = await Purchase.create({
      supplierId,
      supplierName: supplier.name,
      productId,
      productName: product.name,
      grade: grade || "Standard",
      quantity: qty,
      unit: unit || product.unit,
      rate: rateVal,
      totalAmount: totalVal,
      paidAmount: paidVal,
      dueAmount: dueVal,
      date: date ? new Date(date) : new Date(),
      notes: notes || "",
    });

    // 2. AUTO-UPDATE: Increase product current stock using unit conversion
    const targetUnit = unit || product.unit || "maund";
    const qtyInProdUnit = convertQuantity(
      qty,
      targetUnit,
      product.unit || "maund",
      product.bagStock?.bagCapacityKg || 50
    );
    product.currentStock = Number((product.currentStock + qtyInProdUnit).toFixed(3));
    if (product.bagStock) {
      const bags = Math.round(
        convertQuantity(qty, targetUnit, "bag", product.bagStock.bagCapacityKg || 50)
      );
      product.bagStock.filledBags += bags;
    }
    await product.save();

    // 3. Update Supplier ledger
    supplier.totalPaid += paidVal;
    supplier.totalPayable += dueVal;
    await supplier.save();

    // 4. Log CashBook expense if paid
    if (paidVal > 0) {
      await CashBook.create({
        type: "expense",
        category: "supplier_payment",
        amount: paidVal,
        paymentMethod: paymentMethod || "cash",
        description: `Payment to ${supplier.name} for ${qty} ${product.unit} ${product.name}`,
        referenceId: purchase._id.toString(),
        date: purchase.date,
      });
    }

    await ActivityLog.create({
      action: "CREATE_PURCHASE",
      entity: "Purchase",
      details: `Purchased ${qty} ${product.unit} ${product.name} from ${supplier.name} for Rs ${totalVal}`,
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error: unknown) {
    console.error("Purchase creation error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
