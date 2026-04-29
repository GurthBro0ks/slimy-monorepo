export interface StoatUser {
  _id: string;
  username: string;
  display_name?: string;
  avatar?: unknown;
  role?: string;
}

export interface StoatLoginResponse {
  _id: string;
  token: string;
  name: string;
  result: "Success" | string;
}

// Use session auth API
const LOCAL_AUTH_URL = "/api/session";

export async function slimeChatLogin(email: string, password: string): Promise<{ success: true; token: string; userId: string; } | { success: false; error: string; }> {
  try {
    const res = await fetch(`${LOCAL_AUTH_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Login failed" };
    }

    return { success: true, token: "session_cookie", userId: data.user.id };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown login error" };
  }
}

export async function slimeChatGetUser(): Promise<StoatUser> {
  const res = await fetch(`${LOCAL_AUTH_URL}/me`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.statusText}`);
  }

  return res.json();
}

export async function slimeChatLogout(): Promise<void> {
  // Local logout - cookie will be cleared by browser
}
