/**
 * Next.js API Route for Auth "Me" Endpoint
 *
 * This route proxies authentication requests to the admin-api and includes
 * role information for RBAC (Role-Based Access Control).
 *
 * It handles:
 * - Fetching current user information from admin-api
 * - Extracting role from the user object (stored in database)
 * - Falling back to role determination from Discord guilds if needed
 * - Returning user, role, and guilds information
 */

import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import { getUserRole } from "@/slimy.config";

export const dynamic = "force-dynamic"; // no-store

interface AdminApiMeResponse {
  user: {
    id: string;
    name?: string;
    role?: string; // Role from database (new RBAC system)
    discordId?: string;
    username?: string;
    globalName?: string;
    avatar?: string;
  };
  guilds?: Array<{
    id: string;
    roles: string[];
  }>;
}

export async function GET() {
  try {
    const result = await apiClient.get<AdminApiMeResponse>("/api/auth/me", {
      useCache: false, // Don't cache auth data
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Failed to authenticate" },
        { status: result.status || 401 }
      );
    }

    // Use role from database if available (new RBAC system)
    // Otherwise fall back to determining role from Discord guilds (legacy)
    let role = result.data.user?.role;

    if (!role) {
      // Fallback: Extract roles from guilds and determine user role
      const allRoles = result.data.guilds?.flatMap(g => g.roles) || [];
      role = getUserRole(allRoles);
    }

    // Return user data with role information
    return NextResponse.json({
      id: result.data.user.id,
      name: result.data.user.name || result.data.user.globalName || result.data.user.username || "User",
      role: role || "user", // Default to "user" if no role found
      discordId: result.data.user.discordId,
      username: result.data.user.username,
      globalName: result.data.user.globalName,
      avatar: result.data.user.avatar,
      guilds: result.data.guilds || [],
    });
  } catch (error) {
    console.error("[auth/me] Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
