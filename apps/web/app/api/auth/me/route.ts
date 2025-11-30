import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { getUserRole } from "@/slimy.config";

export const dynamic = "force-dynamic"; // no-store

// Backend response is the user object directly (not wrapped in { user: ... })
interface AdminApiMeResponse {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string;
  email?: string;
  role: string;
  discordId: string;
  guilds?: Array<{
    id: string;
    name: string;
    icon?: string;
    role?: string;
    permissions?: string;
    installed?: boolean;
  }>;
  sessionGuilds?: Array<{
    id: string;
    roles: string[];
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
  const transformedUser = {
    id: backendUser.id,
    discordId: backendUser.discordId,
    username: backendUser.username,
    globalName: backendUser.globalName,
    avatar: backendUser.avatar,
    role: backendUser.role,
  };

  // Extract guild info for the frontend
  const guilds = (backendUser.sessionGuilds || []).map(g => ({
    id: g.id,
    roles: g.roles,
  }));

  return NextResponse.json({
    user: transformedUser,
    role: backendUser.role,
    guilds,
  });
}
