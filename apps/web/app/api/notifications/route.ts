import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // no-store

const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE || process.env.ADMIN_API_BASE || "";

/**
 * GET /api/notifications
 * Get notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") || "false";
    const limit = searchParams.get("limit") || "50";

    const queryParams = new URLSearchParams({
      unreadOnly,
      limit,
    });

    // Get cookies from the request
    const cookieHeader = request.headers.get("cookie") || "";

    const response = await fetch(
      `${ADMIN_API_BASE}/api/notifications?${queryParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        credentials: "include",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { ok: false, code: "FETCH_ERROR", message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
