import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ActivityLog } from "@/lib/models";

export async function GET() {
  try {
    await connectToDatabase();
    const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json(logs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
