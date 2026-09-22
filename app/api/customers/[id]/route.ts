import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Customer, Sale, ActivityLog } from "@/lib/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const customer = await Customer.findById(id).lean();
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Get all sales for this customer
    const sales = await Sale.find({ customerId: id })
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ customer, sales });
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

    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (body.name !== undefined && body.name.trim() !== "") customer.name = body.name.trim();
    if (body.phone !== undefined) customer.phone = body.phone;
    if (body.address !== undefined) customer.address = body.address;
    if (body.discountRate !== undefined && !isNaN(Number(body.discountRate))) {
      customer.discountRate = Number(body.discountRate);
    }
    if (body.totalPaid !== undefined && !isNaN(Number(body.totalPaid))) {
      customer.totalPaid = Number(body.totalPaid);
    }
    if (body.totalPending !== undefined && !isNaN(Number(body.totalPending))) {
      customer.totalPending = Number(body.totalPending);
    }
    if (body.advanceBalance !== undefined && !isNaN(Number(body.advanceBalance))) {
      customer.advanceBalance = Number(body.advanceBalance);
    }
    if (body.ranking !== undefined) customer.ranking = body.ranking;
    if (body.notes !== undefined) customer.notes = body.notes;

    await customer.save();

    await ActivityLog.create({
      action: "UPDATE_CUSTOMER",
      entity: "Customer",
      details: `Updated customer profile: ${customer.name}`,
    });

    return NextResponse.json(customer);
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

    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Preserve historical sales by unlinking customerId while retaining customerName
    await Sale.updateMany(
      { customerId: id },
      { $unset: { customerId: "" }, $set: { customerType: "local" } }
    );

    await ActivityLog.create({
      action: "DELETE_CUSTOMER",
      entity: "Customer",
      details: `Deleted customer account: ${customer.name}`,
    });

    return NextResponse.json({
      success: true,
      message: `Customer ${customer.name} deleted successfully`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
