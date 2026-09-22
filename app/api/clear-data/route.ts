import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  Product,
  DailyRate,
  Supplier,
  Purchase,
  Customer,
  Sale,
  CashBook,
  ActivityLog,
} from "@/lib/models";

/**
 * POST /api/clear-data
 * Clears ALL transactional data (products, sales, purchases, customers,
 * suppliers, cashbook, daily rates, activity logs) but PRESERVES:
 * - ShopSettings (shop name, address, phone etc.)
 * - Admin user credentials
 * Requires authenticated Admin session.
 */
export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin authentication required" }, { status: 403 });
    }

    await connectToDatabase();

    await Product.deleteMany({});
    await DailyRate.deleteMany({});
    await Supplier.deleteMany({});
    await Purchase.deleteMany({});
    await Customer.deleteMany({});
    await Sale.deleteMany({});
    await CashBook.deleteMany({});
    await ActivityLog.deleteMany({});

    await ActivityLog.create({
      action: "CLEAR_ALL_DATA",
      entity: "System",
      details: "All demo/sample data cleared by admin. Shop settings & admin credentials preserved.",
    });

    return NextResponse.json({
      success: true,
      message: "All data cleared successfully! Settings and admin login preserved.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
