export interface StoatUser {
  _id: string;
  username: string;
  display_name?: string;
  avatar?: {
    _id: string;
    tag: string;
    filename: string;
    metadata: {
      type: string;
      width: number;
      height: number;
    };
    content_type: string;
    size: number;
    deleted: boolean;
    reported: boolean;
    message_id?: string;
    server_id?: string;
    object_id?: string;
  } | null;
  relations?: unknown[];
  badges?: number;
  status?: {
    text?: string;
    presence?: "Online" | "Idle" | "Focus" | "Busy" | "Invisible";
  };
  flags?: number;
  bot?: {
    owner: string;
  };
  privileged?: boolean;
}

export interface StoatLoginResponse {
  _id: string;
  token: string;
  name: string;
  result: "Success" | string;
}

export async function slimeChatLogin(email: string, password: string): Promise<{ success: true; token: string; userId: string; } | { success: false; error: string; }> {
  const url = process.env.SLIMECHAT_API_URL || "https://chat.slimyai.xyz/api";
  try {
    const res = await fetch(`${url}/auth/session/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { success: false, error: errBody || `Failed to login: ${res.statusText}` };
    }

    const data: StoatLoginResponse = await res.json();
    return { success: true, token: data.token, userId: data._id };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown login error" };
  }
}

export async function slimeChatGetUser(sessionToken: string): Promise<StoatUser> {
  const url = process.env.SLIMECHAT_API_URL || "https://chat.slimyai.xyz/api";
  const res = await fetch(`${url}/users/@me`, {
    method: "GET",
    headers: { "x-session-token": sessionToken },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.statusText}`);
  }

  return res.json();
}

export async function slimeChatLogout(sessionToken: string): Promise<void> {
  const url = process.env.SLIMECHAT_API_URL || "https://chat.slimyai.xyz/api";
  try {
    const res = await fetch(`${url}/auth/session/${sessionToken}`, {
      method: "DELETE",
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Failed to logout from Stoat API", res.status);
    }
  } catch (error: unknown) {
    console.error("Logout request failed", error);
  }
}
