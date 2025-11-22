import { NextRequest } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { apiHandler } from "@/lib/api/handler";
import { ValidationApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

/**
 * GET /api/guilds/:id
 * Get guild by ID
 */
export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAuth(request);

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const includeMembers = searchParams.get("includeMembers") !== "false"; // Default true

  const queryParams = new URLSearchParams({
    ...(includeMembers && { includeMembers: "true" }),
  });

  const result = await apiClient.getOrThrow(`/api/guilds/${id}?${queryParams}`, {
    useCache: true,
    cacheTtl: 180000, // 3 minutes TTL
  });

  return { body: result.data };
});

/**
 * PATCH /api/guilds/:id
 * Update guild
 */
export const PATCH = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAuth(request);

  const { id } = await params;
  const body = await request.json();
  const { name, settings } = body;

  if (!name && !settings) {
    throw new ValidationApiError("At least one field (name or settings) must be provided");
  }

  if (name && (typeof name !== "string" || name.length < 2 || name.length > 100)) {
    throw new ValidationApiError("Name must be a string between 2 and 100 characters");
  }

  const result = await apiClient.patchOrThrow(`/api/guilds/${id}`, {
    name,
    settings,
  });

  return { body: result.data };
});

/**
 * DELETE /api/guilds/:id
 * Delete guild (admin only)
 */
export const DELETE = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAuth(request);

  const { id } = await params;

  const result = await apiClient.deleteOrThrow(`/api/guilds/${id}`);
  return { body: result.data };
});
