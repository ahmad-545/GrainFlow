import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Supplier, CashBook, ActivityLog } from "@/lib/models";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const body = await request.json();
    const { amount, paymentMethod, notes, date } = body;
    const paidVal = Number(amount);

    if (!paidVal || paidVal <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid positive payment amount" },
        { status: 400 }
      );
    }

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    // Deduct from pending payable
    supplier.totalPayable = Math.max(0, supplier.totalPayable - paidVal);
    supplier.totalPaid += paidVal;
    await supplier.save();

    // Record Expense in CashBook (Roznamcha)
    await CashBook.create({
      type: "expense",
      category: "supplier_payment",
      amount: paidVal,
      paymentMethod: paymentMethod || "cash",
      description: `Payment to supplier ${supplier.name}${notes ? ` - ${notes}` : ""}`,
      referenceId: supplier._id.toString(),
      date: date ? new Date(date) : new Date(),
    });

    await ActivityLog.create({
      action: "SUPPLIER_PAYMENT",
      entity: "Supplier",
      details: `Paid Rs ${paidVal.toLocaleString()} to supplier ${supplier.name}. Remaining payable: Rs ${supplier.totalPayable.toLocaleString()}`,
    });

    return NextResponse.json({
      success: true,
      message: `Paid Rs ${paidVal.toLocaleString()} to ${supplier.name} successfully!`,
      supplier,
    });
  } catch (error: unknown) {
    console.error("Supplier payment error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
