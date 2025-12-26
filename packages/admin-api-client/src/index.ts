import * as contracts from "../../contracts/dist/index.js";
import type {
  SettingsChangeEvent,
  SettingsChangeKind,
  SettingsScopeType,
} from "../../contracts/dist/index.js";

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
  if (baseUrl.startsWith("/")) return;

  try {
    const url = new URL(baseUrl);
    if (isLoopbackHostname(url.hostname)) throw new Error("loopback baseUrl forbidden in production");
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
  const normalizedPath = `/${path.replace(/^\//, "")}`;
  const baseUrl = client.baseUrl.replace(/\/+$/, "");
  const target = (() => {
    if (baseUrl.startsWith("/")) {
      if (normalizedPath === baseUrl || normalizedPath.startsWith(`${baseUrl}/`)) return normalizedPath;
      return `${baseUrl}${normalizedPath}`;
    }
    return new URL(normalizedPath.replace(/^\//, ""), `${baseUrl}/`).toString();
  })();
  const headers = new Headers(init?.headers);

  for (const [k, v] of Object.entries(client.defaultHeaders ?? {})) {
    if (!headers.has(k)) headers.set(k, v);
  }
  if (!headers.has("accept")) headers.set("accept", "application/json");

  const res = await fetcher(target, { ...init, headers });
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

export type SettingsScopeTypeV0 = SettingsScopeType;
export type SettingsChangeKindV0 = SettingsChangeKind;
export type SettingsChangeEventV0 = SettingsChangeEvent;

export type SettingsChangesResponseV0 = {
  ok: true;
  events: SettingsChangeEventV0[];
  nextSinceId: number | null;
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

export type UserSettingsPatchV0 = {
  prefs?: {
    theme?: "neon" | "classic" | "system";
    chat?: { markdown?: boolean; profanityFilter?: boolean };
    snail?: { avatarId?: string; vibe?: string; loreFlags?: string[] };
  };
};

export type GuildSettingsPatchV0 = {
  prefs?: {
    botEnabled?: boolean;
    channels?: { adminLogChannelId?: string; globalChatChannelId?: string };
    widget?: { enabled?: boolean };
  };
};

function mergeDeep(target: any, patch: any): any {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return target;
  if (!target || typeof target !== "object" || Array.isArray(target)) return { ...patch };

  const out: any = { ...target };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = mergeDeep(out[k], v);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

function parseSettingsChangesResponse(payload: unknown): SettingsChangesResponseV0 | null {
  if (!payload || typeof payload !== "object") return null;
  const obj: any = payload;
  if (obj.ok !== true) return null;
  if (!Array.isArray(obj.events)) return null;

  const events: SettingsChangeEventV0[] = [];
  for (const raw of obj.events) {
    const parsed = contracts.SettingsChangeEventSchema.safeParse(raw);
    if (!parsed.success) return null;
    events.push(parsed.data);
  }

  const nextRaw = obj.nextSinceId;
  const nextSinceId =
    typeof nextRaw === "number" && Number.isInteger(nextRaw) && nextRaw >= 0 ? nextRaw : null;

  return { ok: true, events, nextSinceId };
}

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
    async patchUserSettings(userId: string, patch: UserSettingsPatchV0) {
      const current = await fetchJson<{ ok: boolean; settings: UserSettingsV0 }>(
        client,
        `/api/settings/user/${encodeURIComponent(userId)}`,
        { method: "GET" },
      );
      if (!current.ok) return current;

      const next: UserSettingsV0 = mergeDeep(current.data.settings, patch);
      return fetchJson<{ ok: boolean; settings: UserSettingsV0 }>(
        client,
        `/api/settings/user/${encodeURIComponent(userId)}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(next),
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
    async patchGuildSettings(guildId: string, patch: GuildSettingsPatchV0) {
      const current = await fetchJson<{ ok: boolean; settings: GuildSettingsV0 }>(
        client,
        `/api/settings/guild/${encodeURIComponent(guildId)}`,
        { method: "GET" },
      );
      if (!current.ok) return current;

      const next: GuildSettingsV0 = mergeDeep(current.data.settings, patch);
      return fetchJson<{ ok: boolean; settings: GuildSettingsV0 }>(
        client,
        `/api/settings/guild/${encodeURIComponent(guildId)}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(next),
        },
      );
    },
    async listSettingsChangesV0(input: {
      scopeType: SettingsScopeTypeV0;
      scopeId: string;
      sinceId?: number | null;
      limit?: number;
      kind?: SettingsChangeKindV0;
    }): Promise<AdminApiJsonResult<SettingsChangesResponseV0>> {
      const params = new URLSearchParams();
      params.set("scopeType", input.scopeType);
      params.set("scopeId", input.scopeId);
      if (typeof input.sinceId === "number") params.set("sinceId", String(input.sinceId));
      if (typeof input.limit === "number") params.set("limit", String(input.limit));
      if (input.kind) params.set("kind", input.kind);

      const res = await fetchJson<unknown>(client, `/api/settings/changes-v0?${params.toString()}`, {
        method: "GET",
      });
      if (!res.ok) return res as AdminApiJsonResult<SettingsChangesResponseV0>;

      const parsed = parseSettingsChangesResponse(res.data);
      if (!parsed) {
        return { ok: false, status: res.status, error: "invalid_settings_changes_response", headers: res.headers };
      }
      return { ok: true, status: res.status, data: parsed, headers: res.headers };
    },
    listMemory(scopeType: MemoryScopeType, scopeId: string, opts?: { kind?: MemoryKind }) {
      const qs = opts?.kind ? `?kind=${encodeURIComponent(opts.kind)}` : "";
      return fetchJson<{ ok: boolean; records: MemoryRecordV0[] }>(
        client,
        `/api/memory/${encodeURIComponent(scopeType)}/${encodeURIComponent(scopeId)}${qs}`,
        { method: "GET" },
      );
    },
    writeMemory(input: { scopeType: MemoryScopeType; scopeId: string } & MemoryWriteRequestV0) {
      return fetchJson<{ ok: boolean; record: MemoryRecordV0 }>(
        client,
        `/api/memory/${encodeURIComponent(input.scopeType)}/${encodeURIComponent(input.scopeId)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: input.kind, source: input.source, content: input.content }),
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
