import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Customer, CashBook, ActivityLog } from "@/lib/models";

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

    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Deduct from pending Baqaya
    customer.totalPending = Math.max(0, customer.totalPending - paidVal);
    customer.totalPaid += paidVal;
    await customer.save();

    // Record Income in CashBook (Roznamcha)
    await CashBook.create({
      type: "income",
      category: "sale_payment",
      amount: paidVal,
      paymentMethod: paymentMethod || "cash",
      description: `Baqaya (Udhaar recovery) from ${customer.name}${notes ? ` - ${notes}` : ""}`,
      referenceId: customer._id.toString(),
      date: date ? new Date(date) : new Date(),
    });

    await ActivityLog.create({
      action: "RECEIVE_BAQAYA_PAYMENT",
      entity: "Customer",
      details: `Received Rs ${paidVal.toLocaleString()} Baqaya from ${customer.name}. New remaining balance: Rs ${customer.totalPending.toLocaleString()}`,
    });

    return NextResponse.json({
      success: true,
      message: `Received Rs ${paidVal.toLocaleString()} successfully!`,
      customer,
    });
  } catch (error: unknown) {
    console.error("Receive payment error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
