import { cookies } from "next/headers";

export interface ServerAuthUser {
  id: string;
  username: string;
  role: 'admin' | 'club' | 'user' | 'member' | 'owner';
  guilds: any[];
  email?: string; 
}

function parseSessionToken(token: string): { userId: string; email: string; role: string; expires: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const payload = JSON.parse(decoded);
    if (!payload.userId || !payload.expires) return null;
    if (payload.expires < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(cookieStoreOverride?: any): Promise<ServerAuthUser | null> {
  try {
    const cookieStore = cookieStoreOverride ? await Promise.resolve(cookieStoreOverride) : await cookies();

    // Check all possible cookie names (in priority order)
    const sessionCookie = 
      cookieStore.get("slimy_session") || 
      cookieStore.get("slimy_admin") || 
      cookieStore.get("slimy_admin_token") || 
      cookieStore.get("connect.sid");

    if (!sessionCookie?.value) {
      console.log("[Auth] FAILED: No valid session cookie found.");
      return null;
    }

    const session = parseSessionToken(sessionCookie.value);
    if (!session) {
      console.log("[Auth] FAILED: Invalid or expired session token.");
      return null;
    }

    console.log(`[Auth] SUCCESS: Authenticated as ${session.email} (${session.userId})`);
    return {
      id: session.userId,
      username: session.email?.split("@")[0] || "unknown",
      email: session.email,
      role: session.role || "member",
      guilds: [],
    };
  } catch (error) {
    console.error("[Auth] requireAuth error:", error);
    return null;
  }
}
