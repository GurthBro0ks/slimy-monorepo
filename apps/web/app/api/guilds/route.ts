import { NextRequest } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { apiHandler } from "@/lib/api/handler";
import { ValidationApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic"; // no-store

/**
 * GET /api/guilds
 * List all guilds (admin only)
 */
export const GET = apiHandler(async (request: NextRequest) => {
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

  const result = await apiClient.getOrThrow(`/api/guilds?${queryParams}`, {
    useCache: true,
    cacheTtl: 300000, // 5 minutes TTL
  });

  return { body: result.data };
});

/**
 * POST /api/guilds
 * Create a new guild (admin only)
 */
export const POST = apiHandler(async (request: NextRequest) => {
  await requireAuth(request);

  const body = await request.json();
  const { discordId, name, settings } = body;

  if (!discordId || !name) {
    throw new ValidationApiError("discordId and name are required");
  }

  if (typeof discordId !== "string" || typeof name !== "string") {
    throw new ValidationApiError("discordId and name must be strings");
  }

  if (name.length < 2 || name.length > 100) {
    throw new ValidationApiError("Guild name must be between 2 and 100 characters");
  }

  const result = await apiClient.postOrThrow("/api/guilds", {
    discordId,
    name,
    settings: settings || {},
  });

  return { body: result.data, status: 201 };
});
