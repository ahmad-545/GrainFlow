import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin authorization required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const result = await seedDatabase(force);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Seed error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin authorization required" }, { status: 403 });
    }

    const result = await seedDatabase(false);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
