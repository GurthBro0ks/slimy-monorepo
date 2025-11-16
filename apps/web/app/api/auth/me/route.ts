import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import { getUserRole } from "@/slimy.config";

export const dynamic = "force-dynamic"; // no-store

interface AdminApiMeResponse {
  user: {
    id: string;
    name: string;
  };
  guilds?: Array<{
    id: string;
    roles: string[];
  }>;
}

export async function GET() {
  const result = await apiClient.get<AdminApiMeResponse>("/api/auth/me", {
    useCache: false, // Don't cache auth data
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status || 401 });
  }

  // Extract roles from guilds and determine user role
  const allRoles = result.data.guilds?.flatMap(g => g.roles) || [];
  const role = getUserRole(allRoles);

  return NextResponse.json({
    user: result.data.user,
    role,
    guilds: result.data.guilds,
  });
}
