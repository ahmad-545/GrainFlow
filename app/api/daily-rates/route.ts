import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { DailyRate, Product, ActivityLog } from "@/lib/models";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const yesterdayDate = new Date(new Date(date).getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

    const products = await Product.find({}).sort({ name: 1 }).lean();

    // Rates for selected date and yesterday
    const currentRates = await DailyRate.find({ date }).lean();
    const prevRates = await DailyRate.find({ date: yesterdayStr }).lean();

    const currentMap = new Map();
    currentRates.forEach((r) => currentMap.set(r.productId.toString(), r));

    const prevMap = new Map();
    prevRates.forEach((r) => prevMap.set(r.productId.toString(), r));

    const rateBoard = products.map((prod) => {
      const pId = prod._id.toString();
      const todayEntry = currentMap.get(pId);
      const yesterdayEntry = prevMap.get(pId);

      const todayRate = todayEntry ? todayEntry.rate : 0;
      const yesterdayRate = yesterdayEntry ? yesterdayEntry.rate : 0;
      const diff = todayRate && yesterdayRate ? todayRate - yesterdayRate : 0;

      let status: "up" | "down" | "same" = "same";
      if (diff > 0) status = "up";
      else if (diff < 0) status = "down";

      return {
        productId: prod._id,
        productName: prod.name,
        nameUrdu: prod.nameUrdu,
        unit: prod.unit,
        currentStock: prod.currentStock,
        todayRate,
        yesterdayRate,
        diff,
        status,
        updatedAt: todayEntry?.updatedAt || null,
        notes: todayEntry?.notes || "",
      };
    });

    // If productId requested, also get 30-day historical trend
    let history: any[] = [];
    if (productId) {
      history = await DailyRate.find({ productId })
        .sort({ date: 1 })
        .limit(30)
        .lean();
    } else {
      // Return historical rates for all products (last 7 days)
      history = await DailyRate.find({})
        .sort({ date: 1 })
        .limit(100)
        .lean();
    }

    return NextResponse.json({
      date,
      yesterdayStr,
      rateBoard,
      history,
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

    const { productId, rate, date, notes } = body;
    const rateNum = Number(rate);

    if (!productId || isNaN(rateNum) || rateNum < 0) {
      return NextResponse.json({ error: "Product ID and valid rate are required" }, { status: 400 });
    }

    const targetDate = date || new Date().toISOString().split("T")[0];
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check yesterday's rate to compute difference
    const yesterday = new Date(new Date(targetDate).getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const prevRateDoc = await DailyRate.findOne({ productId, date: yesterday });

    let changeStatus: "up" | "down" | "same" = "same";
    let changeDiff = 0;

    if (prevRateDoc) {
      changeDiff = rateNum - prevRateDoc.rate;
      if (changeDiff > 0) changeStatus = "up";
      else if (changeDiff < 0) changeStatus = "down";
    }

    // Upsert rate for targetDate
    const rateDoc = await DailyRate.findOneAndUpdate(
      { productId, date: targetDate },
      {
        $set: {
          productName: product.name,
          rate: rateNum,
          changeStatus,
          changeDiff,
          notes: notes || "",
          updatedBy: "Admin",
        },
      },
      { upsert: true, new: true }
    );

    await ActivityLog.create({
      action: "UPDATE_DAILY_RATE",
      entity: "DailyRate",
      details: `Set rate for ${product.name} to Rs ${rateNum} on ${targetDate}`,
    });

    return NextResponse.json({ success: true, rateDoc });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
