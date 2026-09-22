import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Product, DailyRate, ActivityLog } from "@/lib/models";

export async function GET() {
  try {
    await connectToDatabase();
    const products = await Product.find({}).sort({ name: 1 }).lean();

    // Fetch latest daily rates for each product
    const todayStr = new Date().toISOString().split("T")[0];
    const rates = await DailyRate.find({ date: todayStr }).lean();
    const rateMap = new Map();
    rates.forEach((r) => rateMap.set(r.productId.toString(), r));

    const enriched = products.map((p) => {
      const latestRate = rateMap.get(p._id.toString()) || null;
      const rateVal = p.initialRate || latestRate?.rate || 0;
      const calculatedOpeningValue =
        p.openingStockValue && p.openingStockValue > 0
          ? p.openingStockValue
          : Number(((p.openingStock || p.currentStock || 0) * rateVal).toFixed(2));

      return {
        ...p,
        openingStockValue: calculatedOpeningValue,
        todayRate: latestRate,
        isLowStock: p.currentStock <= p.minStockAlert,
      };
    });

    return NextResponse.json(enriched);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      name,
      nameUrdu,
      unit,
      currentStock,
      openingMaunds,
      openingKg,
      minStockAlert,
      grades,
      bagStock,
      initialRate,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const stockUnit = unit || "maund";
    let computedStock = Number(currentStock) || 0;

    // If openingMaunds or openingKg are provided, compute accurate mixed stock
    if (openingMaunds !== undefined || openingKg !== undefined) {
      const m = Number(openingMaunds) || 0;
      const k = Number(openingKg) || 0;
      if (stockUnit === "maund") {
        computedStock = Number((m + k / 40).toFixed(3));
      } else if (stockUnit === "kg") {
        computedStock = Number((m * 40 + k).toFixed(2));
      } else {
        computedStock = Number(currentStock) || 0;
      }
    }

    const initialRateVal = Number(initialRate) || 0;
    const openingValue =
      body.openingStockValue !== undefined && !isNaN(Number(body.openingStockValue))
        ? Number(body.openingStockValue)
        : Number((computedStock * initialRateVal).toFixed(2));

    const newProduct = await Product.create({
      name,
      nameUrdu: nameUrdu || "",
      unit: stockUnit,
      currentStock: computedStock,
      openingStock: computedStock,
      openingStockUnit: stockUnit,
      initialRate: initialRateVal,
      openingStockValue: openingValue,
      minStockAlert: Number(minStockAlert) || 20,
      grades: grades || [
        { name: "Standard", nameUrdu: "عام", rateAdjustment: 0, stock: computedStock },
      ],
      bagStock: bagStock || {
        emptyBags: 50,
        filledBags: stockUnit === "bag" ? Math.round(computedStock) : 0,
        bagCapacityKg: 50,
      },
      wastageRecords: [],
      notes: body.notes || "",
    });

    if (initialRateVal > 0) {
      const todayStr = new Date().toISOString().split("T")[0];
      await DailyRate.create({
        productId: newProduct._id,
        productName: newProduct.name,
        rate: initialRateVal,
        date: todayStr,
        changeStatus: "same",
        changeDiff: 0,
        notes: "Initial rate setup",
      });
    }

    await ActivityLog.create({
      action: "CREATE_PRODUCT",
      entity: "Product",
      details: `Added new grain type: ${newProduct.name}`,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
