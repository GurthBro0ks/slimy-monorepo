import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { getUserRole } from "@/slimy.config";

export const dynamic = "force-dynamic"; // no-store

// Backend response is the user object directly (not wrapped in { user: ... })
interface AdminApiMeResponse {
  id: string;
  discordId?: string;
  username: string;
  globalName?: string;
  avatar?: string;
  email?: string;
  role: string;
  guilds?: Array<{
    id: string;
    name?: string;
    icon?: string | null;
    installed?: boolean;
    roles?: string[];
  }>;
  sessionGuilds?: Array<{
    id: string;
    name?: string;
    icon?: string | null;
    installed?: boolean;
    roles?: string[];
  }>;
  lastActiveGuild?: {
    id: string;
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const result = await apiClient.get<AdminApiMeResponse>("/api/auth/me", {
    useCache: false, // Don't cache auth data
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status || 401 });
  }

  // Backend returns user data directly, transform it to match frontend expectations
  const backendUser = result.data;
  const transformedUser: any = {
    id: backendUser.id,
    discordId: backendUser.discordId || backendUser.id,
    username: backendUser.username,
    globalName: backendUser.globalName,
    avatar: backendUser.avatar,
    lastActiveGuildId: backendUser.lastActiveGuild?.id,
  };

  const normalizeGuild = (g: any) => ({
    id: String(g?.id || ""),
    name: g?.name ? String(g.name) : undefined,
    icon: g?.icon ?? null,
    installed: Boolean(g?.installed),
    roles: Array.isArray(g?.roles) ? g.roles : [],
  });

  const sessionGuilds = (backendUser.sessionGuilds || []).map(normalizeGuild);
  const guilds = (backendUser.guilds || sessionGuilds).map(normalizeGuild);

  // Effective role: support both Discord role IDs and admin-api markers ("admin"/"owner"/"club")
  const flattenedRoles = guilds.flatMap((g: any) => (Array.isArray(g?.roles) ? g.roles : [])).map(String);
  const hasAdminMarker = flattenedRoles.includes("admin") || flattenedRoles.includes("owner");
  const hasClubMarker = flattenedRoles.includes("club");

  const effectiveRole = hasAdminMarker
    ? "admin"
    : hasClubMarker
      ? "club"
      : getUserRole(flattenedRoles);

  transformedUser.role = effectiveRole;
  transformedUser.guilds = guilds;
  transformedUser.sessionGuilds = sessionGuilds;

  // Return a flat user object (client + server auth consumers can still accept { user: ... } via adapter logic)
  return NextResponse.json(transformedUser);
}
