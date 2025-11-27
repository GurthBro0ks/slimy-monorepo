import { NextRequest } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { errorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic"; // no-store

/**
 * GET /api/guilds
 * List all guilds (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

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
      return Response.json(result, { status: result.status || 503 });
    }

    return Response.json(result.data);
  } catch (error) {
    const { body, status, headers } = errorResponse(error);
    return Response.json(body, { status, headers });
  }
}

/**
 * POST /api/guilds
 * Create a new guild (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { discordId, name, settings } = body;

    // Basic validation - BEFORE authentication
    if (!discordId || !name) {
      const { body: errBody, status, headers } = errorResponse(
        new Error("discordId and name are required")
      );
      return Response.json(errBody, { status: 400, headers });
    }

    if (typeof discordId !== "string" || typeof name !== "string") {
      const { body: errBody, status, headers } = errorResponse(
        new Error("discordId and name must be strings")
      );
      return Response.json(errBody, { status: 400, headers });
    }

    if (name.length < 2 || name.length > 100) {
      const { body: errBody, status, headers } = errorResponse(
        new Error("Guild name must be between 2 and 100 characters")
      );
      return Response.json(errBody, { status: 400, headers });
    }

    // THEN authenticate
    await requireAuth();

    const result = await apiClient.post("/api/guilds", {
      discordId,
      name,
      settings: settings || {},
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
