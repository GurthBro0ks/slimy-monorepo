import { NextRequest } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { errorResponse } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * PATCH /api/guilds/:id/members/:userId
 * Update member roles
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const body = await request.json();
    const { roles } = body;

    // Basic validation - BEFORE authentication
    if (!Array.isArray(roles)) {
      const { body: errBody, status, headers } = errorResponse(
        new Error("roles must be an array")
      );
      return Response.json(errBody, { status: 400, headers });
    }

    // THEN authenticate
    await requireAuth();

    const { id, userId } = await params;

    const result = await apiClient.patch(`/api/guilds/${id}/members/${userId}`, {
      roles,
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
 * DELETE /api/guilds/:id/members/:userId
 * Remove member from guild
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    await requireAuth();

    const { id, userId } = await params;

    const result = await apiClient.delete(`/api/guilds/${id}/members/${userId}`);

    if (!result.ok) {
      return Response.json(result, { status: result.status || 500 });
    }

    return Response.json(result.data);
  } catch (error) {
    const { body, status, headers } = errorResponse(error);
    return Response.json(body, { status, headers });
  }
}
