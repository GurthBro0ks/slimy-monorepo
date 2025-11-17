import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { AuthenticationError } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * GET /api/guilds/:id/webhooks
 * List webhooks for a guild
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);

    const { id: guildId } = await params;

    const result = await apiClient.get(
      `/api/webhooks?guildId=${encodeURIComponent(guildId)}`,
      {
        useCache: false, // Don't cache webhook configs
      }
    );

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    console.error("Failed to fetch webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks", code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guilds/:id/webhooks
 * Create a new webhook for a guild
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);

    const { id: guildId } = await params;
    const body = await request.json();

    // Ensure guildId matches the route parameter
    const payload = {
      ...body,
      guildId,
    };

    const result = await apiClient.post("/api/webhooks", payload);

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    console.error("Failed to create webhook:", error);
    return NextResponse.json(
      { error: "Failed to create webhook", code: "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
