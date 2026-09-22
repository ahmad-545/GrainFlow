import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Supplier, Purchase, ActivityLog } from "@/lib/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const supplier = await Supplier.findById(id).lean();
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const purchases = await Purchase.find({ supplierId: id })
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ supplier, purchases });
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

    const updated = await Supplier.findByIdAndUpdate(
      id,
      {
        $set: {
          name: body.name,
          phone: body.phone,
          address: body.address,
          totalPaid: Number(body.totalPaid),
          totalPayable: Number(body.totalPayable),
          notes: body.notes,
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    await ActivityLog.create({
      action: "UPDATE_SUPPLIER",
      entity: "Supplier",
      details: `Updated supplier profile: ${updated.name}`,
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

    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Supplier deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
