import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { CashBook, Customer, Supplier, ActivityLog } from "@/lib/models";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'income' | 'expense'
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const query: any = {};
    if (type) query.type = type;
    if (category) query.category = category;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const entries = await CashBook.find(query).sort({ date: -1, createdAt: -1 }).lean();

    // Summary calculations
    const incomeAgg = await CashBook.aggregate([
      { $match: { type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const expenseAgg = await CashBook.aggregate([
      { $match: { type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalIncome = incomeAgg[0]?.total || 0;
    const totalExpense = expenseAgg[0]?.total || 0;
    const cashInHand = totalIncome - totalExpense;

    // Expenses breakdown by category
    const categoryBreakdown = await CashBook.aggregate([
      { $match: { type: "expense" } },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    // Receivable vs Payable
    const custPending = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPending" } } },
    ]);
    const suppPayable = await Supplier.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPayable" } } },
    ]);

    return NextResponse.json({
      entries,
      summary: {
        totalIncome,
        totalExpense,
        cashInHand,
        totalReceivable: custPending[0]?.total || 0,
        totalPayable: suppPayable[0]?.total || 0,
        categoryBreakdown,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { type, category, amount, paymentMethod, description, referenceId, date } = body;
    const amountVal = Number(amount);

    if (!type || !category || !amountVal || amountVal <= 0) {
      return NextResponse.json(
        { error: "Type, category, and valid positive amount are required" },
        { status: 400 }
      );
    }

    const entry = await CashBook.create({
      type,
      category,
      amount: amountVal,
      paymentMethod: paymentMethod || "cash",
      description: description || "",
      referenceId: referenceId || "",
      date: date ? new Date(date) : new Date(),
    });

    await ActivityLog.create({
      action: "CASH_ENTRY",
      entity: "CashBook",
      details: `Recorded ${type} of Rs ${amountVal} (${category}) - ${description}`,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
