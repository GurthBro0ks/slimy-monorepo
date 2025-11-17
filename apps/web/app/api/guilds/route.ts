import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { AuthenticationError } from "@/lib/errors";

export const dynamic = "force-dynamic"; // no-store

/**
 * GET /api/guilds
 * List all guilds (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";
    const search = searchParams.get("search") || undefined;
    const includeMembers = searchParams.get("includeMembers") === "true";

    const queryParams = new URLSearchParams({
      limit,
      offset,
      ...(search && { search }),
      ...(includeMembers && { includeMembers: "true" }),
    });

    const result = await apiClient.get(`/api/guilds?${queryParams}`, {
      useCache: true,
      cacheTtl: 300000, // 5 minutes TTL
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
    console.error("Failed to fetch guilds:", error);
    return NextResponse.json(
      { error: "Failed to fetch guilds", code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guilds
 * Create a new guild OR trigger sync (based on action parameter)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const body = await request.json();
    const { action, discordId, name, settings } = body;

    // Handle sync action
    if (action === "sync") {
      const result = await apiClient.post("/api/guilds/sync", {});

      if (!result.ok) {
        return NextResponse.json(result, { status: result.status || 500 });
      }

      return NextResponse.json(result.data);
    }

    // Handle create guild
    // Basic validation
    if (!discordId || !name) {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "discordId and name are required"
        },
        { status: 400 }
      );
    }

    if (typeof discordId !== "string" || typeof name !== "string") {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "discordId and name must be strings"
        },
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "Guild name must be between 2 and 100 characters"
        },
        { status: 400 }
      );
    }

    const result = await apiClient.post("/api/guilds", {
      discordId,
      name,
      settings: settings || {},
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
    console.error("Failed to create guild:", error);
    return NextResponse.json(
      { error: "Failed to create guild", code: "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
