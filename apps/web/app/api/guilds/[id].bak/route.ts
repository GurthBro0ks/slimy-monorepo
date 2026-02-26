import { NextRequest } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { errorResponse } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * GET /api/guilds/:id
 * Get guild by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeMembers = searchParams.get("includeMembers") !== "false"; // Default true

    const queryParams = new URLSearchParams({
      ...(includeMembers && { includeMembers: "true" }),
    });

    const result = await apiClient.get(`/api/guilds/${id}?${queryParams}`, {
      useCache: true,
      cacheTtl: 180000, // 3 minutes TTL
    });

    if (!result.ok) {
      return Response.json(result, { status: result.status || 404 });
    }

    return Response.json(result.data);
  } catch (error) {
    const { body, status, headers } = errorResponse(error);
    return Response.json(body, { status, headers });
  }
}

/**
 * PATCH /api/guilds/:id
 * Update guild
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { name, settings } = body;

    // Basic validation - BEFORE authentication
    if (!name && !settings) {
      const { body: errBody, status, headers } = errorResponse(
        new Error("At least one field (name or settings) must be provided")
      );
      return Response.json(errBody, { status: 400, headers });
    }

    if (name && (typeof name !== "string" || name.length < 2 || name.length > 100)) {
      const { body: errBody, status, headers } = errorResponse(
        new Error("Name must be a string between 2 and 100 characters")
      );
      return Response.json(errBody, { status: 400, headers });
    }

    // THEN authenticate
    await requireAuth();

    const { id } = await params;

    const result = await apiClient.patch(`/api/guilds/${id}`, {
      name,
      settings,
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
 * DELETE /api/guilds/:id
 * Delete guild (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;

    const result = await apiClient.delete(`/api/guilds/${id}`);

    if (!result.ok) {
      return Response.json(result, { status: result.status || 500 });
    }

    return Response.json(result.data);
  } catch (error) {
    const { body, status, headers } = errorResponse(error);
    return Response.json(body, { status, headers });
  }
}
