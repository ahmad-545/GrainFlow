import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Customer, ActivityLog } from "@/lib/models";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const isRegular = searchParams.get("isRegular");
    const search = searchParams.get("search");

    const query: any = {};
    if (isRegular !== null && isRegular !== undefined) {
      query.isRegular = isRegular === "true";
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(query).sort({ totalPaid: -1, name: 1 }).lean();
    return NextResponse.json(customers);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { name, phone, address, isRegular, discountRate, initialPending, advanceBalance, ranking, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const customer = await Customer.create({
      name,
      phone: phone || "",
      address: address || "",
      isRegular: isRegular !== undefined ? Boolean(isRegular) : true,
      discountRate: Number(discountRate) || 0,
      totalPaid: 0,
      totalPending: Number(initialPending) || 0,
      advanceBalance: Number(advanceBalance) || 0,
      ranking: ranking || "Bronze",
      notes: notes || "",
    });

    await ActivityLog.create({
      action: "CREATE_CUSTOMER",
      entity: "Customer",
      details: `Created regular customer profile: ${customer.name}`,
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
