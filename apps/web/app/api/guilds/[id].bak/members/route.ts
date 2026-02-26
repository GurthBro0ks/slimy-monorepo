import { NextRequest } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { errorResponse } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * GET /api/guilds/:id/members
 * Get guild members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";
    const search = searchParams.get("search") || undefined;

    const queryParams = new URLSearchParams({
      limit,
      offset,
      ...(search && { search }),
    });

    const result = await apiClient.get(`/api/guilds/${id}/members?${queryParams}`, {
      useCache: true,
      cacheTtl: 60000, // 1 minute TTL
    });

    if (!result.ok) {
      return Response.json(result, { status: result.status || 500 });
    }

    return Response.json(result.data);
  } catch (error) {
    const { body, status, headers } = errorResponse(error);
    return Response.json(body, { status, headers });
  }
}

/**
 * POST /api/guilds/:id/members
 * Add member to guild
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { userId, roles = [] } = body;

    // Basic validation - BEFORE authentication
    if (!userId) {
      const { body: errBody, status, headers } = errorResponse(
        new Error("userId is required")
      );
      return Response.json(errBody, { status: 400, headers });
    }

    if (!Array.isArray(roles)) {
      const { body: errBody, status, headers } = errorResponse(
        new Error("roles must be an array")
      );
      return Response.json(errBody, { status: 400, headers });
    }

    // THEN authenticate
    await requireAuth();

    const { id } = await params;

    const result = await apiClient.post(`/api/guilds/${id}/members`, {
      userId,
      roles,
    });

    if (!result.ok) {
      return Response.json(result, { status: result.status || 500 });
    }

    return Response.json(result.data, { status: 201 });
  } catch (error) {
    const { body, status, headers } = errorResponse(error);
    return Response.json(body, { status, headers });
  }
}
