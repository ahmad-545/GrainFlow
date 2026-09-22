import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ShopSettings, ActivityLog } from "@/lib/models";

const DEFAULT_SETTINGS = {
  shopName: "Al-Rehman Grain Commission Shop",
  shopNameUrdu: "الرحمٰن غلہ کمیشن شاپ - غلہ منڈی",
  shopAddress: "Shop #42, Main Galla Mandi, Gate 1",
  shopPhone: "0300-1234567, 0321-7654321",
  shopLicense: "MANDI-FSD-2026-904",
  receiptFooterNote: "کمیشن شاپ پر مال تسلی بخش تولا اور بیچا جاتا ہے۔ کمپیوٹرائزڈ پرچہ منڈی",
};

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await ShopSettings.findOne();
    if (!settings) {
      settings = await ShopSettings.create(DEFAULT_SETTINGS);
    }
    return NextResponse.json(settings);
  } catch (error: unknown) {
    console.error("Settings GET error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      shopName,
      shopNameUrdu,
      shopAddress,
      shopPhone,
      shopLicense,
      receiptFooterNote,
    } = body;

    const updated = await ShopSettings.findOneAndUpdate(
      {},
      {
        $set: {
          shopName: shopName || DEFAULT_SETTINGS.shopName,
          shopNameUrdu: shopNameUrdu || DEFAULT_SETTINGS.shopNameUrdu,
          shopAddress: shopAddress || DEFAULT_SETTINGS.shopAddress,
          shopPhone: shopPhone || DEFAULT_SETTINGS.shopPhone,
          shopLicense: shopLicense || DEFAULT_SETTINGS.shopLicense,
          receiptFooterNote: receiptFooterNote || DEFAULT_SETTINGS.receiptFooterNote,
        },
      },
      { new: true, upsert: true }
    );

    await ActivityLog.create({
      action: "UPDATE_SHOP_SETTINGS",
      entity: "Settings",
      details: `Updated shop settings: "${updated.shopName}" (${updated.shopAddress})`,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Settings POST error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
