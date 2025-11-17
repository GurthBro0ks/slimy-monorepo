import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { AuthenticationError } from "@/lib/errors";

export const dynamic = "force-dynamic"; // no-store

/**
 * PATCH /api/saved-prompts/:id
 * Update a saved prompt (if owned by user)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);

    const { id } = params;
    const promptId = parseInt(id, 10);

    if (isNaN(promptId)) {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "Invalid prompt ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, content, tags } = body;

    // Validate title if provided
    if (title !== undefined && typeof title !== "string") {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "title must be a string",
        },
        { status: 400 }
      );
    }

    if (title && title.length > 200) {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "title must be 200 characters or less",
        },
        { status: 400 }
      );
    }

    // Validate content if provided
    if (content !== undefined && typeof content !== "string") {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "content must be a string",
        },
        { status: 400 }
      );
    }

    // Validate tags if provided
    if (tags !== undefined && tags !== null && typeof tags !== "string") {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "tags must be a comma-separated string or null",
        },
        { status: 400 }
      );
    }

    const result = await apiClient.patch(`/api/saved-prompts/${id}`, {
      title,
      content,
      tags,
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
    console.error("Failed to update saved prompt:", error);
    return NextResponse.json(
      { error: "Failed to update saved prompt", code: "UPDATE_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/saved-prompts/:id
 * Delete a saved prompt (if owned by user)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);

    const { id } = params;
    const promptId = parseInt(id, 10);

    if (isNaN(promptId)) {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "Invalid prompt ID",
        },
        { status: 400 }
      );
    }

    const result = await apiClient.delete(`/api/saved-prompts/${id}`);

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    console.error("Failed to delete saved prompt:", error);
    return NextResponse.json(
      { error: "Failed to delete saved prompt", code: "DELETE_ERROR" },
      { status: 500 }
    );
  }
}
