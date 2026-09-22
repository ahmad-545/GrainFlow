import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Purchase, Product, Supplier, ActivityLog } from "@/lib/models";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { purchaseId, returnQuantity, returnAmount, reason } = body;
    const returnQty = Number(returnQuantity);
    const returnVal = Number(returnAmount);

    if (!purchaseId || returnQty <= 0) {
      return NextResponse.json(
        { error: "Purchase ID and return quantity are required" },
        { status: 400 }
      );
    }

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    if (returnQty > purchase.quantity) {
      return NextResponse.json(
        { error: `Return quantity cannot exceed purchased quantity (${purchase.quantity})` },
        { status: 400 }
      );
    }

    // 1. Deduct stock from inventory
    const product = await Product.findById(purchase.productId);
    if (product) {
      product.currentStock = Math.max(0, product.currentStock - returnQty);
      await product.save();
    }

    // 2. Reduce supplier payable or adjust
    const supplier = await Supplier.findById(purchase.supplierId);
    if (supplier) {
      supplier.totalPayable = Math.max(0, supplier.totalPayable - returnVal);
      await supplier.save();
    }

    // 3. Mark return details on purchase
    purchase.returnDetails = {
      isReturned: true,
      returnQuantity: returnQty,
      returnAmount: returnVal,
      returnDate: new Date(),
      reason: reason || "Goods returned to supplier",
    };
    await purchase.save();

    await ActivityLog.create({
      action: "PURCHASE_RETURN",
      entity: "Purchase",
      details: `Returned ${returnQty} ${purchase.unit} of ${purchase.productName} to ${purchase.supplierName} (Refund: Rs ${returnVal})`,
    });

    return NextResponse.json({ success: true, purchase });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
