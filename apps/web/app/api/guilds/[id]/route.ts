import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { AuthenticationError } from "@/lib/errors";

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
    await requireAuth(request);

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
    console.error("Failed to fetch guild:", error);
    return NextResponse.json(
      { error: "Failed to fetch guild", code: "FETCH_ERROR" },
      { status: 500 }
    );
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
    await requireAuth(request);

    const { id } = await params;
    const body = await request.json();
    const { name, settings } = body;

    // Basic validation
    if (!name && !settings) {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "At least one field (name or settings) must be provided"
        },
        { status: 400 }
      );
    }

    if (name && (typeof name !== "string" || name.length < 2 || name.length > 100)) {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "Name must be a string between 2 and 100 characters"
        },
        { status: 400 }
      );
    }

    const result = await apiClient.patch(`/api/guilds/${id}`, {
      name,
      settings,
    });

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
    console.error("Failed to update guild:", error);
    return NextResponse.json(
      { error: "Failed to update guild", code: "UPDATE_ERROR" },
      { status: 500 }
    );
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
    await requireAuth(request);

    const { id } = await params;

    const result = await apiClient.delete(`/api/guilds/${id}`);

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
    console.error("Failed to delete guild:", error);
    return NextResponse.json(
      { error: "Failed to delete guild", code: "DELETE_ERROR" },
      { status: 500 }
    );
  }
}
