import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import {
  Product,
  Purchase,
  Sale,
  Customer,
  Supplier,
  CashBook,
  DailyRate,
} from "@/lib/models";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Total Investment = Purchases + Initial Opening Stock Valuation
    const purchaseTotals = await Purchase.aggregate([
      {
        $group: {
          _id: null,
          purchasesInvestment: { $sum: "$totalAmount" },
          totalPurchasesCount: { $sum: 1 },
        },
      },
    ]);
    const purchasesInvestment = purchaseTotals[0]?.purchasesInvestment || 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const todayRates = await DailyRate.find({ date: todayStr }).lean();
    const rateMap = new Map();
    todayRates.forEach((r) => rateMap.set(r.productId.toString(), r));

    // Fetch all products to calculate opening stock investment & stock overview
    const products = await Product.find({}).sort({ name: 1 });
    let openingStockInvestment = 0;
    for (const p of products) {
      if (p.openingStockValue && p.openingStockValue > 0) {
        openingStockInvestment += p.openingStockValue;
      } else {
        // Fallback for existing products created before openingStockValue was explicitly stored
        const rateVal = p.initialRate || rateMap.get(p._id.toString())?.rate || 0;
        const initialQty = p.openingStock !== undefined && p.openingStock > 0 ? p.openingStock : (p.currentStock || 0);
        openingStockInvestment += Number((initialQty * rateVal).toFixed(2));
      }
    }
    openingStockInvestment = Number(openingStockInvestment.toFixed(2));
    const totalInvestment = Number((purchasesInvestment + openingStockInvestment).toFixed(2));

    // 2. Total Sales
    const saleTotals = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$netAmount" },
          totalSalesCount: { $sum: 1 },
        },
      },
    ]);
    const totalSaleAmount = saleTotals[0]?.totalSales || 0;

    // 3. Receivables & Payables
    const customerReceivables = await Customer.aggregate([
      { $group: { _id: null, totalReceivable: { $sum: "$totalPending" } } },
    ]);
    const totalReceivable = customerReceivables[0]?.totalReceivable || 0;

    const supplierPayables = await Supplier.aggregate([
      { $group: { _id: null, totalPayable: { $sum: "$totalPayable" } } },
    ]);
    const totalPayable = supplierPayables[0]?.totalPayable || 0;

    // 4. Cash in Hand from CashBook
    const cashIncome = await CashBook.aggregate([
      { $match: { type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const cashExpense = await CashBook.aggregate([
      { $match: { type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const cashInHand = (cashIncome[0]?.total || 0) - (cashExpense[0]?.total || 0);

    // 5. Current Stock overview & Low Stock alerts
    const lowStockAlerts = products.filter((p) => p.currentStock <= p.minStockAlert);

    // 6. Recent Sales (last 5)
    const recentSales = await Sale.find({})
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .lean();

    // 7. Recent Purchases (last 5)
    const recentPurchases = await Purchase.find({})
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      totalInvestment,
      purchasesInvestment,
      openingStockInvestment,
      totalSaleAmount,
      totalReceivable,
      totalPayable,
      cashInHand,
      stockOverview: products.map((p) => ({
        id: p._id,
        name: p.name,
        nameUrdu: p.nameUrdu,
        unit: p.unit,
        currentStock: p.currentStock,
        minStockAlert: p.minStockAlert,
        isLowStock: p.currentStock <= p.minStockAlert,
        bagStock: p.bagStock,
      })),
      lowStockAlerts: lowStockAlerts.map((p) => ({
        id: p._id,
        name: p.name,
        nameUrdu: p.nameUrdu,
        currentStock: p.currentStock,
        minStockAlert: p.minStockAlert,
        unit: p.unit,
      })),
      recentSales,
      recentPurchases,
      todayRates,
    });
  } catch (error: unknown) {
    console.error("Dashboard stats error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
