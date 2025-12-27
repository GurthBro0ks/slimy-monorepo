"use client";

export type GuildIdentity = {
  id: string;
  name: string;
  iconUrl?: string;
};

type GuildIdentityCacheV1 = {
  v: 1;
  savedAtMs: number;
  guilds: GuildIdentity[];
};

const LOCAL_STORAGE_KEY = "slimy:guild-identity:v1";
const LOCAL_STORAGE_TTL_MS = 10 * 60 * 1000;

let memoryCache: { savedAtMs: number; map: Record<string, GuildIdentity> } | null = null;
let inFlight: Promise<Record<string, GuildIdentity>> | null = null;

function safeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return String(value);
}

function tryReadLocalStorageMap(): Record<string, GuildIdentity> | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuildIdentityCacheV1;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.v !== 1) return null;
    if (typeof parsed.savedAtMs !== "number") return null;
    if (Date.now() - parsed.savedAtMs > LOCAL_STORAGE_TTL_MS) return null;
    if (!Array.isArray(parsed.guilds)) return null;

    const map: Record<string, GuildIdentity> = {};
    for (const g of parsed.guilds) {
      const id = safeString((g as any)?.id).trim();
      const name = safeString((g as any)?.name).trim();
      const iconUrl = safeString((g as any)?.iconUrl).trim();
      if (!id || !name) continue;
      map[id] = iconUrl ? { id, name, iconUrl } : { id, name };
    }
    return Object.keys(map).length ? map : null;
  } catch {
    return null;
  }
}

function tryWriteLocalStorageMap(map: Record<string, GuildIdentity>): void {
  try {
    const guilds = Object.values(map);
    const payload: GuildIdentityCacheV1 = { v: 1, savedAtMs: Date.now(), guilds };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore (quota / disabled storage)
  }
}

function normalizeIconUrl(guildId: string, icon: unknown): string | undefined {
  const iconHash = safeString(icon).trim();
  if (!iconHash) return undefined;
  return `https://cdn.discordapp.com/icons/${encodeURIComponent(guildId)}/${encodeURIComponent(iconHash)}.png`;
}

async function fetchGuildIdentityMapFromApi(): Promise<Record<string, GuildIdentity>> {
  const res = await fetch("/api/discord/guilds", { cache: "no-store", credentials: "include" });
  if (!res.ok) throw new Error(`guilds_fetch_failed:${res.status}`);

  const data: any = await res.json();
  const list = Array.isArray(data?.guilds) ? data.guilds : [];

  const map: Record<string, GuildIdentity> = {};
  for (const raw of list) {
    const id = safeString(raw?.id).trim();
    const name = safeString(raw?.name).trim();
    if (!id || !name) continue;
    const iconUrl = normalizeIconUrl(id, raw?.icon);
    map[id] = iconUrl ? { id, name, iconUrl } : { id, name };
  }
  return map;
}

export async function getGuildIdentityMap(opts?: { forceRefresh?: boolean }): Promise<Record<string, GuildIdentity>> {
  const forceRefresh = !!opts?.forceRefresh;

  if (!forceRefresh && memoryCache && Date.now() - memoryCache.savedAtMs <= LOCAL_STORAGE_TTL_MS) {
    return memoryCache.map;
  }

  if (!forceRefresh && !memoryCache) {
    const cached = tryReadLocalStorageMap();
    if (cached) {
      memoryCache = { savedAtMs: Date.now(), map: cached };
      return cached;
    }
  }

  if (!forceRefresh && inFlight) return inFlight;

  inFlight = (async () => {
    const fetched = await fetchGuildIdentityMapFromApi();
    memoryCache = { savedAtMs: Date.now(), map: fetched };
    tryWriteLocalStorageMap(fetched);
    return fetched;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export async function getGuildIdentity(guildId: string): Promise<GuildIdentity | undefined> {
  const id = safeString(guildId).trim();
  if (!id) return undefined;
  const map = await getGuildIdentityMap();
  return map[id];
}

