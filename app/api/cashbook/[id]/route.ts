import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { CashBook, ActivityLog } from "@/lib/models";

/**
 * PUT /api/cashbook/[id]
 * Edit an existing cashbook entry
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const entry = await CashBook.findById(id);
    if (!entry) {
      return NextResponse.json({ error: "Cash entry not found" }, { status: 404 });
    }

    const oldAmount = entry.amount;
    const oldType = entry.type;
    const oldDesc = entry.description;

    // Update fields
    if (body.type) entry.type = body.type;
    if (body.category) entry.category = body.category;
    if (body.amount !== undefined) entry.amount = Number(body.amount);
    if (body.paymentMethod) entry.paymentMethod = body.paymentMethod;
    if (body.description !== undefined) entry.description = body.description;
    if (body.date) entry.date = new Date(body.date);

    await entry.save();

    await ActivityLog.create({
      action: "EDIT_CASH_ENTRY",
      entity: "CashBook",
      details: `Edited ${oldType} entry: Rs ${oldAmount.toLocaleString()} → Rs ${entry.amount.toLocaleString()} (${oldDesc || entry.description})`,
    });

    return NextResponse.json(entry);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/cashbook/[id]
 * Delete a cashbook entry
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const entry = await CashBook.findById(id);
    if (!entry) {
      return NextResponse.json({ error: "Cash entry not found" }, { status: 404 });
    }

    const deletedType = entry.type;
    const deletedAmount = entry.amount;
    const deletedDesc = entry.description;

    await CashBook.findByIdAndDelete(id);

    await ActivityLog.create({
      action: "DELETE_CASH_ENTRY",
      entity: "CashBook",
      details: `Deleted ${deletedType} entry: Rs ${deletedAmount.toLocaleString()} (${deletedDesc})`,
    });

    return NextResponse.json({
      success: true,
      message: `Cash entry deleted: ${deletedType} Rs ${deletedAmount.toLocaleString()}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
