import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Product, DailyRate, Purchase, Sale, ActivityLog } from "@/lib/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get rate history (last 15 entries)
    const rateHistory = await DailyRate.find({ productId: id })
      .sort({ date: -1 })
      .limit(15)
      .lean();

    // Get recent purchases for this grain
    const recentPurchases = await Purchase.find({ productId: id })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    // Get recent sales for this grain
    const recentSales = await Sale.find({ "items.productId": id })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      product,
      rateHistory,
      recentPurchases,
      recentSales,
    });
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

    const updateFields: any = {
      name: body.name,
      nameUrdu: body.nameUrdu,
      unit: body.unit,
      currentStock: Number(body.currentStock),
      minStockAlert: Number(body.minStockAlert),
      grades: body.grades,
      bagStock: body.bagStock,
      notes: body.notes,
    };
    if (body.initialRate !== undefined) {
      updateFields.initialRate = Number(body.initialRate);
    }
    if (body.openingStock !== undefined) {
      updateFields.openingStock = Number(body.openingStock);
    }
    if (body.openingStockValue !== undefined) {
      updateFields.openingStockValue = Number(body.openingStockValue);
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await ActivityLog.create({
      action: "UPDATE_PRODUCT",
      entity: "Product",
      details: `Updated grain details: ${updated.name}`,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
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

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await ActivityLog.create({
      action: "DELETE_PRODUCT",
      entity: "Product",
      details: `Deleted grain: ${product.name}`,
    });

    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
