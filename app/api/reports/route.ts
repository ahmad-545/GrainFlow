import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Sale, Purchase, Product, Customer, DailyRate } from "@/lib/models";
import { convertQuantity } from "@/lib/units";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30days"; // '7days', '30days', 'month', 'year', 'all'

    let startDate: Date;
    const now = new Date();

    if (range === "7days") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30days") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(0); // all time
    }

    // 1. Sales within range
    const sales = await Sale.find({ date: { $gte: startDate } }).sort({ date: 1 }).lean();

    // 2. Purchases within range
    const purchases = await Purchase.find({ date: { $gte: startDate } }).sort({ date: 1 }).lean();

    // 3. Grain-wise Profit / Loss calculation
    const products = await Product.find({}).lean();
    const grainProfitLoss = products.map((prod) => {
      const prodPurchases = purchases.filter(
        (p) => p.productId.toString() === prod._id.toString()
      );
      const prodSales: any[] = [];
      sales.forEach((s) => {
        s.items.forEach((item) => {
          if (item.productId.toString() === prod._id.toString()) {
            prodSales.push(item);
          }
        });
      });

      const totalPurchaseQty = prodPurchases.reduce(
        (acc, p) =>
          acc +
          convertQuantity(p.quantity, p.unit || "maund", prod.unit || "maund"),
        0
      );
      const totalPurchaseCost = prodPurchases.reduce((acc, p) => acc + p.totalAmount, 0);

      const openingQty = prod.openingStock || 0;
      const openingCost = prod.openingStockValue || (openingQty * (prod.initialRate || 0));
      const combinedProcuredQty = totalPurchaseQty + openingQty;
      const combinedProcuredCost = totalPurchaseCost + openingCost;
      const avgPurchaseRate = combinedProcuredQty > 0 ? combinedProcuredCost / combinedProcuredQty : 0;

      const totalSaleQty = prodSales.reduce(
        (acc, s) =>
          acc +
          convertQuantity(s.quantity, s.unit || "maund", prod.unit || "maund"),
        0
      );
      const totalSaleRevenue = prodSales.reduce((acc, s) => acc + s.total, 0);
      const avgSaleRate = totalSaleQty > 0 ? totalSaleRevenue / totalSaleQty : 0;

      // Estimated Gross Profit on sold quantity: (avgSaleRate - avgPurchaseRate) * soldQty
      const estimatedProfit =
        avgPurchaseRate > 0 ? (avgSaleRate - avgPurchaseRate) * totalSaleQty : 0;

      return {
        productId: prod._id,
        grainName: prod.name,
        nameUrdu: prod.nameUrdu,
        unit: prod.unit,
        purchasedQty: combinedProcuredQty,
        purchaseCost: combinedProcuredCost,
        avgPurchaseRate: Math.round(avgPurchaseRate),
        soldQty: totalSaleQty,
        saleRevenue: totalSaleRevenue,
        avgSaleRate: Math.round(avgSaleRate),
        marginPerUnit: Math.round(avgSaleRate - avgPurchaseRate),
        estimatedProfit: Math.round(estimatedProfit),
      };
    });

    // 4. Customer-wise Udhaar (Credit) Report
    const customersWithUdhaar = await Customer.find({ totalPending: { $gt: 0 } })
      .sort({ totalPending: -1 })
      .lean();

    // 5. Rate trend graphs (last 14 days)
    const rateHistory = await DailyRate.find({})
      .sort({ date: 1 })
      .limit(60)
      .lean();

    // 6. Aggregate day-by-day totals for timeline charts
    const timelineMap: { [dateStr: string]: { sales: number; purchases: number } } = {};
    sales.forEach((s) => {
      const d = new Date(s.date).toISOString().split("T")[0];
      if (!timelineMap[d]) timelineMap[d] = { sales: 0, purchases: 0 };
      timelineMap[d].sales += s.netAmount;
    });
    purchases.forEach((p) => {
      const d = new Date(p.date).toISOString().split("T")[0];
      if (!timelineMap[d]) timelineMap[d] = { sales: 0, purchases: 0 };
      timelineMap[d].purchases += p.totalAmount;
    });

    const timeline = Object.keys(timelineMap)
      .sort()
      .map((d) => ({
        date: d,
        sales: timelineMap[d].sales,
        purchases: timelineMap[d].purchases,
      }));

    return NextResponse.json({
      range,
      totalSalesRevenue: sales.reduce((acc, s) => acc + s.netAmount, 0),
      totalPurchasesCost: purchases.reduce((acc, p) => acc + p.totalAmount, 0),
      salesCount: sales.length,
      purchasesCount: purchases.length,
      grainProfitLoss,
      customersWithUdhaar,
      timeline,
      rateHistory,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
