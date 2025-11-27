import { NextRequest } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { errorResponse } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * POST /api/guilds/:id/members/bulk/add
 * Bulk add members to guild
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get("operation");
    const body = await request.json();

    // Validate inputs - BEFORE authentication
    if (!operation) {
      const { body: errBody, status, headers } = errorResponse(
        new Error("operation query parameter is required (add, update, remove)")
      );
      return Response.json(errBody, { status: 400, headers });
    }

    const { id } = await params;
    let endpoint: string;
    let payload: any;

    switch (operation) {
      case "add":
        if (!body.members || !Array.isArray(body.members)) {
          const { body: errBody, status, headers } = errorResponse(
            new Error("members array is required for add operation")
          );
          return Response.json(errBody, { status: 400, headers });
        }
        endpoint = `/api/guilds/${id}/members/bulk-add`;
        payload = { members: body.members };
        break;

      case "update":
        if (!body.updates || !Array.isArray(body.updates)) {
          const { body: errBody, status, headers } = errorResponse(
            new Error("updates array is required for update operation")
          );
          return Response.json(errBody, { status: 400, headers });
        }
        endpoint = `/api/guilds/${id}/members/bulk-update`;
        payload = { updates: body.updates };
        break;

      case "remove":
        if (!body.userIds || !Array.isArray(body.userIds)) {
          const { body: errBody, status, headers } = errorResponse(
            new Error("userIds array is required for remove operation")
          );
          return Response.json(errBody, { status: 400, headers });
        }
        endpoint = `/api/guilds/${id}/members/bulk-remove`;
        payload = { userIds: body.userIds };
        break;

      default:
        const { body: errBody, status, headers } = errorResponse(
          new Error("Invalid operation. Must be one of: add, update, remove")
        );
        return Response.json(errBody, { status: 400, headers });
    }

    // THEN authenticate
    await requireAuth();

    const result = await apiClient.post(endpoint, payload);

    if (!result.ok) {
      return Response.json(result, { status: result.status || 500 });
    }

    return Response.json(result.data);
  } catch (error) {
    const { body, status, headers } = errorResponse(error);
    return Response.json(body, { status, headers });
  }
}
