import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Supplier, ActivityLog } from "@/lib/models";

export async function GET() {
  try {
    await connectToDatabase();
    const suppliers = await Supplier.find({}).sort({ name: 1 }).lean();
    return NextResponse.json(suppliers);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { name, phone, address, notes, initialPayable } = body;

    if (!name) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
    }

    const supplier = await Supplier.create({
      name,
      phone: phone || "",
      address: address || "",
      totalPaid: 0,
      totalPayable: Number(initialPayable) || 0,
      notes: notes || "",
    });

    await ActivityLog.create({
      action: "CREATE_SUPPLIER",
      entity: "Supplier",
      details: `Added new supplier: ${supplier.name}`,
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
