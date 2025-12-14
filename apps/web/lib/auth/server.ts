import { cookies } from "next/headers";
import { AdminApiClient } from "@/lib/api/admin-client";

export interface ServerAuthUser {
  id: string;
  username: string;
  role: 'admin' | 'club' | 'user' | 'member' | 'owner';
  guilds: any[];
  email?: string; 
}

export async function requireAuth(cookieStoreOverride?: any): Promise<ServerAuthUser | null> {
  try {
    const cookieStore = await (cookieStoreOverride ? Promise.resolve(cookieStoreOverride) : cookies());
    
    // Look for ANY valid session cookie
    const explicitCookieName = String(process.env.ADMIN_TOKEN_COOKIE || "").trim();
    const sessionToken = 
      (explicitCookieName ? cookieStore.get(explicitCookieName) : undefined) ||
      cookieStore.get("slimy_admin") || 
      cookieStore.get("slimy_admin_token") ||
      cookieStore.get("slimy_session") || 
      cookieStore.get("connect.sid");

    if (!sessionToken) {
        console.log("[Auth] FAILED: No valid session cookie found.");
        return null;
    }

    const client = new AdminApiClient();
    const headers = { Cookie: `${sessionToken.name}=${sessionToken.value}` };
    
    // Request the user profile
    const response = await client.get<any>("/api/auth/me", { headers });

    if (!response.ok) {
      console.log(`[Auth] FAILED: Admin API rejected token with status ${response.status}`);
      return null;
    }

    // FIX: Support both { user: ... } AND { id: ... } structures
    const userData = response.data?.user || response.data;

    if (!userData || !userData.id) {
      console.log("[Auth] FAILED: Admin API returned OK (200) but invalid user data structure:", JSON.stringify(response.data));
      return null;
    }

    console.log(`[Auth] SUCCESS: Authenticated as ${userData.username} (${userData.id})`);
    return userData as ServerAuthUser;

  } catch (error) {
    console.error("[Auth] CRITICAL ERROR:", error);
    return null;
  }
}
