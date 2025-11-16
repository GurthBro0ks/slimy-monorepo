import { NextResponse } from "next/server";
import { getLatestSnailEvents } from "@/lib/snail-events";

export const runtime = "nodejs";
export const revalidate = 60; // Cache for 60 seconds

/**
 * GET /api/snail/history
 * Returns the latest 50 snail events.
 */
export async function GET() {
  try {
    const events = getLatestSnailEvents();

    return NextResponse.json({
      ok: true,
      events,
      count: events.length,
    });
  } catch (error) {
    console.error("Snail history API error:", error);
    return NextResponse.json(
      {
        ok: false,
        code: "HISTORY_FETCH_ERROR",
        message: "Failed to fetch snail history",
      },
      { status: 500 }
    );
  }
}
