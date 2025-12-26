export type AdminApiJsonResult<T> =
  | { ok: true; status: number; data: T; headers: Headers }
  | { ok: false; status: number; error: unknown; headers: Headers };

export type AdminApiClientInit = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  defaultHeaders?: Record<string, string>;
};

export function resolveAdminApiBaseUrl(env?: Record<string, string | undefined>): string {
  const e = env ?? (globalThis as any)?.process?.env ?? {};
  const baseUrl =
    (typeof e.ADMIN_API_INTERNAL_URL === "string" && e.ADMIN_API_INTERNAL_URL.trim()) ||
    (typeof e.NEXT_PUBLIC_ADMIN_API_BASE_URL === "string" && e.NEXT_PUBLIC_ADMIN_API_BASE_URL.trim()) ||
    "";

  if (!baseUrl) {
    throw new Error("admin-api baseUrl missing (set ADMIN_API_INTERNAL_URL or NEXT_PUBLIC_ADMIN_API_BASE_URL)");
  }
  return baseUrl;
}

function isLoopbackHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
}

function assertNoLoopbackInProd(baseUrl: string): void {
  const nodeEnv = (globalThis as any)?.process?.env?.NODE_ENV;
  if (nodeEnv !== "production") return;
  try {
    const url = new URL(baseUrl);
    if (isLoopbackHostname(url.hostname)) {
      throw new Error("loopback baseUrl forbidden in production");
    }
  } catch {
    throw new Error("invalid admin-api baseUrl");
  }
}

async function fetchJson<T>(
  client: AdminApiClientInit,
  path: string,
  init?: RequestInit,
): Promise<AdminApiJsonResult<T>> {
  assertNoLoopbackInProd(client.baseUrl);

  const fetcher = client.fetchImpl ?? fetch;
  const url = new URL(path.replace(/^\//, ""), client.baseUrl.replace(/\/+$/, "") + "/");
  const headers = new Headers(init?.headers);

  for (const [k, v] of Object.entries(client.defaultHeaders ?? {})) {
    if (!headers.has(k)) headers.set(k, v);
  }
  if (!headers.has("accept")) headers.set("accept", "application/json");

  const res = await fetcher(url.toString(), { ...init, headers });
  const resHeaders = res.headers;

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    return { ok: false, status: res.status, error: body ?? res.statusText, headers: resHeaders };
  }
  return { ok: true, status: res.status, data: body as T, headers: resHeaders };
}

export type MemoryScopeType = "user" | "guild";
export type MemoryKind = "profile_summary" | "preferences" | "project_state" | "snail_lore";
export type MemorySource = "discord" | "web" | "admin-ui" | "system";

export type UserSettingsPrefs = {
  theme?: "neon" | "classic" | "system";
  chat?: { markdown?: boolean; profanityFilter?: boolean };
  snail?: { avatarId?: string; vibe?: string; loreFlags?: string[] };
};

export type GuildSettingsPrefs = {
  botEnabled?: boolean;
  channels?: { adminLogChannelId?: string; globalChatChannelId?: string };
  widget?: { enabled?: boolean };
};

export type UserSettingsV0 = {
  userId: string;
  version: number;
  updatedAt: string;
  prefs: UserSettingsPrefs;
  [k: string]: unknown;
};

export type GuildSettingsV0 = {
  guildId: string;
  version: number;
  updatedAt: string;
  prefs: GuildSettingsPrefs;
  [k: string]: unknown;
};

export type MemoryRecordV0 = {
  scopeType: MemoryScopeType;
  scopeId: string;
  kind: MemoryKind;
  source: MemorySource;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type MemoryWriteRequestV0 = {
  kind: MemoryKind;
  source: MemorySource;
  content: Record<string, unknown>;
};

export function createAdminApiClient(client: AdminApiClientInit) {
  return {
    getUserSettings(userId: string) {
      return fetchJson<{ ok: boolean; settings: UserSettingsV0 }>(
        client,
        `/api/settings/user/${encodeURIComponent(userId)}`,
        { method: "GET" },
      );
    },
    setUserSettings(userId: string, settings: UserSettingsV0) {
      return fetchJson<{ ok: boolean; settings: UserSettingsV0 }>(
        client,
        `/api/settings/user/${encodeURIComponent(userId)}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(settings),
        },
      );
    },
    getGuildSettings(guildId: string) {
      return fetchJson<{ ok: boolean; settings: GuildSettingsV0 }>(
        client,
        `/api/settings/guild/${encodeURIComponent(guildId)}`,
        { method: "GET" },
      );
    },
    setGuildSettings(guildId: string, settings: GuildSettingsV0) {
      return fetchJson<{ ok: boolean; settings: GuildSettingsV0 }>(
        client,
        `/api/settings/guild/${encodeURIComponent(guildId)}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(settings),
        },
      );
    },
    listMemory(scopeType: MemoryScopeType, scopeId: string, opts?: { kind?: MemoryKind }) {
      const qs = opts?.kind ? `?kind=${encodeURIComponent(opts.kind)}` : "";
      return fetchJson<{ ok: boolean; records: MemoryRecordV0[] }>(
        client,
        `/api/memory/${encodeURIComponent(scopeType)}/${encodeURIComponent(scopeId)}${qs}`,
        { method: "GET" },
      );
    },
    writeMemory(scopeType: MemoryScopeType, scopeId: string, body: MemoryWriteRequestV0) {
      return fetchJson<{ ok: boolean; record: MemoryRecordV0 }>(
        client,
        `/api/memory/${encodeURIComponent(scopeType)}/${encodeURIComponent(scopeId)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );
    },
  };
}

export function createAdminApiClientFromEnv(opts?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  defaultHeaders?: Record<string, string>;
}) {
  return createAdminApiClient({
    baseUrl: resolveAdminApiBaseUrl(opts?.env),
    fetchImpl: opts?.fetchImpl,
    defaultHeaders: opts?.defaultHeaders,
  });
}
