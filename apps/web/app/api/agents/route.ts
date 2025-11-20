import { NextResponse } from "next/server";
import { proxyToAdminApi } from "@/lib/api-client";

export const runtime = "nodejs";
export const revalidate = 0; // No caching for agents list

/**
 * GET /api/agents
 * List all available agents from the registry
 */
export async function GET() {
  try {
    const response = await proxyToAdminApi("/api/agents", {
      method: "GET",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: response.code,
          message: response.message,
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Agents API error:", error);
    return NextResponse.json(
      {
        ok: false,
        code: "AGENTS_FETCH_ERROR",
        message: "Failed to fetch agents",
      },
      { status: 500 }
    );
  }
}
