import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // no-store

const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE || process.env.ADMIN_API_BASE || "";

/**
 * POST /api/notifications/[id]/read
 * Mark a notification as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get cookies from the request
    const cookieHeader = request.headers.get("cookie") || "";

    const response = await fetch(
      `${ADMIN_API_BASE}/api/notifications/${id}/read`,
      {
        method: "POST",
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
    console.error("Failed to mark notification as read:", error);
    return NextResponse.json(
      { ok: false, code: "UPDATE_ERROR", message: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
