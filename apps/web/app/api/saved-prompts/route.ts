import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { AuthenticationError } from "@/lib/errors";

export const dynamic = "force-dynamic"; // no-store

/**
 * GET /api/saved-prompts
 * Get all saved prompts for the current user
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const result = await apiClient.get("/api/saved-prompts", {
      useCache: false, // Prompt data should be fresh
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 503 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    console.error("Failed to fetch saved prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved prompts", code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/saved-prompts
 * Create a new saved prompt
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const body = await request.json();
    const { title, content, tags } = body;

    // Basic validation
    if (!title || !content) {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "title and content are required",
        },
        { status: 400 }
      );
    }

    if (typeof title !== "string" || typeof content !== "string") {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "title and content must be strings",
        },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "title must be 200 characters or less",
        },
        { status: 400 }
      );
    }

    if (tags !== undefined && tags !== null && typeof tags !== "string") {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "tags must be a comma-separated string",
        },
        { status: 400 }
      );
    }

    const result = await apiClient.post("/api/saved-prompts", {
      title,
      content,
      tags: tags || null,
    });

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
    console.error("Failed to create saved prompt:", error);
    return NextResponse.json(
      { error: "Failed to create saved prompt", code: "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
