import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Product, ActivityLog } from "@/lib/models";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const body = await request.json();

    const { quantity, reason, notes, date } = body;
    const lossQty = Number(quantity);

    if (!lossQty || lossQty <= 0) {
      return NextResponse.json({ error: "Invalid wastage quantity" }, { status: 400 });
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.currentStock < lossQty) {
      return NextResponse.json(
        { error: `Insufficient stock. Current stock is ${product.currentStock} ${product.unit}` },
        { status: 400 }
      );
    }

    // Deduct stock and push record
    product.currentStock = Math.max(0, product.currentStock - lossQty);
    product.wastageRecords.push({
      date: date ? new Date(date) : new Date(),
      quantity: lossQty,
      reason: reason || "damage",
      notes: notes || "",
    });

    await product.save();

    await ActivityLog.create({
      action: "STOCK_WASTAGE",
      entity: "Product",
      details: `Recorded wastage of ${lossQty} ${product.unit} on ${product.name} (Reason: ${reason})`,
    });

    return NextResponse.json({
      success: true,
      currentStock: product.currentStock,
      wastageRecords: product.wastageRecords,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
