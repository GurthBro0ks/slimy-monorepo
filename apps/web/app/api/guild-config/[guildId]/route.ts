import { NextRequest, NextResponse } from "next/server";

const ADMIN_API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE || "http://localhost:3080";

export const runtime = "nodejs";

/**
 * GET /api/guild-config/:guildId
 * Proxy to admin-api to get guild configuration
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const { guildId } = await params;
    const url = `${ADMIN_API_BASE}/api/guild-config/${guildId}`;

    const res = await fetch(url, {
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });

    const body = await res.text();

    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[guild-config:get] proxy error", error);
    return NextResponse.json(
      { error: "Failed to fetch guild config" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/guild-config/:guildId
 * Proxy to admin-api to update guild configuration
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const { guildId } = await params;
    const url = `${ADMIN_API_BASE}/api/guild-config/${guildId}`;
    const json = await req.json();

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify(json),
    });

    const body = await res.text();

    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[guild-config:patch] proxy error", error);
    return NextResponse.json(
      { error: "Failed to update guild config" },
      { status: 500 }
    );
  }
}
