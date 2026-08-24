import { NextResponse } from "next/server";
import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await DataClient.getSystemHealth();
    return NextResponse.json({ health: health[0] || null });
  } catch (error) {
    console.error("Error fetching system health:", error);
    return NextResponse.json({ error: "Failed to fetch system health" }, { status: 500 });
  }
}
