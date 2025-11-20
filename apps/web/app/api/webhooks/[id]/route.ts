import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { AuthenticationError } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * GET /api/webhooks/:id
 * Get a specific webhook by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);

    const { id } = await params;

    const result = await apiClient.get(`/api/webhooks/${id}`, {
      useCache: false,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 404 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    console.error("Failed to fetch webhook:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhook", code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/webhooks/:id
 * Update a webhook
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);

    const { id } = await params;
    const body = await request.json();

    const result = await apiClient.patch(`/api/webhooks/${id}`, body);

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
    console.error("Failed to update webhook:", error);
    return NextResponse.json(
      { error: "Failed to update webhook", code: "UPDATE_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);

    const { id } = await params;

    const result = await apiClient.delete(`/api/webhooks/${id}`);

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
    console.error("Failed to delete webhook:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook", code: "DELETE_ERROR" },
      { status: 500 }
    );
  }
}
