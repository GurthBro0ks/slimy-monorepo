import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { AuthenticationError } from "@/lib/errors";

export const dynamic = "force-dynamic"; // no-store

/**
 * GET /api/profile/me
 * Get the current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const result = await apiClient.get("/api/profile/me", {
      useCache: false, // Profile data should be fresh
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
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile", code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile/me
 * Update the current user's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAuth(request);

    const body = await request.json();
    const { displayName, avatarUrl, timezone, preferences } = body;

    // Validate preferences if provided
    if (preferences !== undefined && (typeof preferences !== "object" || Array.isArray(preferences))) {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "preferences must be a valid JSON object",
        },
        { status: 400 }
      );
    }

    const result = await apiClient.patch("/api/profile/me", {
      displayName,
      avatarUrl,
      timezone,
      preferences,
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
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile", code: "UPDATE_ERROR" },
      { status: 500 }
    );
  }
}
