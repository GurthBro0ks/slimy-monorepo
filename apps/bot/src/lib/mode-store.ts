/**
 * Per-guild mode configuration persistence store.
 * Ported from /opt/slimy/app/lib/mode-store.js
 *
 * Uses MySQL table `mode_configs` with schema:
 *   channel_id | category_id | thread_id (only one is non-null per row)
 *   config JSON = { modes: {...}, updatedAt: number }
 *
 * Also maintains an in-memory cache on the Discord client (client.slimeModeCache Map).
 */

import { database } from "./database.js";
import * as fs from "fs";
import * as path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModeEntry {
  guildId: string;
  targetId: string;
  targetType: "channel" | "category" | "thread";
  modes: Record<string, boolean>;
  updatedAt: number;
}

export interface ModeStoreSnapshot {
  channelModes: ModeEntry[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORE_PATH = path.join(process.cwd(), "data_store.json");
const TARGET_TYPES = new Set(["channel", "category", "thread"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureDir(filePath: string): void {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  } catch {
    // ignore
  }
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(value as string);
  } catch {
    return fallback;
  }
}

function cloneStore(store: ModeStoreSnapshot | null): ModeStoreSnapshot {
  if (!store || typeof store !== "object") return { channelModes: [] };
  const entries = Array.isArray(store.channelModes) ? store.channelModes : [];
  return {
    channelModes: entries.map((entry) => ({
      guildId: entry.guildId,
      targetId: entry.targetId,
      targetType: entry.targetType,
      modes: { ...(entry.modes || {}) },
      updatedAt: entry.updatedAt || Date.now(),
    })),
  };
}

function setMemoryStore(store: ModeStoreSnapshot): void {
  memoryStore = cloneStore(store);
}

let memoryStore: ModeStoreSnapshot | null = null;

function readStoreFromDisk(): ModeStoreSnapshot | null {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = safeJsonParse<unknown>(raw, null);
    if (parsed && typeof parsed === "object") {
      const s = parsed as Record<string, unknown>;
      return {
        channelModes: Array.isArray(s.channelModes) ? s.channelModes as ModeEntry[] : [],
      };
    }
  } catch {
    // ignore
  }
  return null;
}

export function getMemoryStore(): ModeStoreSnapshot | null {
  if (memoryStore) return cloneStore(memoryStore);
  const disk = readStoreFromDisk();
  if (disk) {
    memoryStore = cloneStore(disk);
    return cloneStore(memoryStore);
  }
  return null;
}

function cacheKey(guildId: string, targetType = "channel", targetId = "unknown"): string {
  return `${guildId || "unknown"}:${targetType || "channel"}:${targetId || "unknown"}`;
}

function mapTargetColumns(
  targetType: string,
  targetId: string | null,
): { channelId: string | null; categoryId: string | null; threadId: string | null } {
  return {
    channelId: targetType === "channel" ? targetId : null,
    categoryId: targetType === "category" ? targetId : null,
    threadId: targetType === "thread" ? targetId : null,
  };
}

function rowToEntry(row: Record<string, unknown>): ModeEntry | null {
  const rawConfig = row.config;
  const config = safeJsonParse<Record<string, unknown>>(rawConfig, {});
  const payload = typeof config === "object" && config !== null ? config : {};
  const modes =
    (payload.modes && typeof payload.modes === "object") ? payload.modes as Record<string, boolean> : payload as Record<string, boolean>;
  const updatedAt = Number(payload.updatedAt) || Date.now();

  let targetType: "channel" | "category" | "thread" = "channel";
  let targetId: string | null = (row.channel_id as string) || null;

  if (row.thread_id) {
    targetType = "thread";
    targetId = row.thread_id as string;
  } else if (row.category_id) {
    targetType = "category";
    targetId = row.category_id as string;
  }

  if (!targetId) return null;

  return {
    guildId: row.guild_id as string,
    targetId,
    targetType,
    modes: { ...modes },
    updatedAt,
  };
}

export function writeStoreToDisk(store: ModeStoreSnapshot): void {
  try {
    ensureDir(STORE_PATH);
    fs.writeFileSync(STORE_PATH, JSON.stringify(cloneStore(store), null, 2));
  } catch (err) {
    console.warn("[mode-store] Failed to write disk snapshot:", (err as Error).message);
  }
}

// ─── Client Cache ─────────────────────────────────────────────────────────────

interface ClientWithModeCache {
  slimeModeCache?: Map<string, ModeEntry>;
}

function getEffectiveClient(): unknown {
  return (globalThis as Record<string, unknown>).client || null;
}

function refreshClientCache(
  client: unknown,
  entries: Iterable<ModeEntry>,
): void {
  if (!client) return;
  const c = client as ClientWithModeCache;
  const map = new Map<string, ModeEntry>();
  for (const entry of entries) {
    if (!entry?.guildId || !entry?.targetId) continue;
    map.set(cacheKey(entry.guildId, entry.targetType, entry.targetId), {
      guildId: entry.guildId,
      targetType: entry.targetType,
      targetId: entry.targetId,
      modes: { ...(entry.modes || {}) },
      updatedAt: entry.updatedAt || Date.now(),
    });
  }
  c.slimeModeCache = map;
}

export function cacheSet(client: unknown, entry: ModeEntry): void {
  if (!client || !entry?.guildId || !entry?.targetId) return;
  const c = client as ClientWithModeCache;
  if (!c.slimeModeCache || !(c.slimeModeCache instanceof Map)) {
    c.slimeModeCache = new Map<string, ModeEntry>();
  }
  c.slimeModeCache.set(cacheKey(entry.guildId, entry.targetType, entry.targetId), {
    guildId: entry.guildId,
    targetType: entry.targetType,
    targetId: entry.targetId,
    modes: { ...(entry.modes || {}) },
    updatedAt: entry.updatedAt || Date.now(),
  });
}

export function cacheDelete(
  client: unknown,
  guildId: string,
  targetType: string,
  targetId: string,
): void {
  const c = client as ClientWithModeCache;
  if (!c?.slimeModeCache) return;
  c.slimeModeCache.delete(cacheKey(guildId, targetType, targetId));
}

// ─── Backward-Compatible API (used by mode command) ──────────────────────────
// These present the same interface as the original stub while using the NUC1
// schema (channel_id/category_id/thread_id + config JSON).

import { emptyState } from "./modes.js";

interface StubModeRow {
  guild_id: string;
  channel_id: string | null;
  category_id: string | null;
  thread_id: string | null;
  config: unknown;
}

function configToModes(config: unknown): Record<string, boolean> {
  const parsed = safeJsonParse<Record<string, unknown>>(config, {});
  if (parsed && typeof parsed.modes === "object" && parsed.modes !== null) {
    return { ...(parsed.modes as Record<string, boolean>) };
  }
  return {};
}

function modesToTarget(entry: ModeEntry): { targetId: string; targetType: "channel" | "category" | "thread" } {
  return {
    targetId: entry.targetId,
    targetType: entry.targetType,
  };
}

export async function setModes({
  guildId,
  targetId,
  targetType,
  modes: modeList,
  operation = "replace",
}: {
  guildId: string;
  targetId: string;
  targetType: string;
  modes: string[];
  operation?: string;
  actorHasManageGuild?: boolean;
}): Promise<void> {
  if (!database.isConfigured()) return;

  // Build current snapshot from disk/memory as base
  let snapshot = getMemoryStore() || { channelModes: [] };

  const existingIdx = snapshot.channelModes.findIndex(
    (e) => e.guildId === guildId && e.targetId === targetId && e.targetType === targetType,
  );
  const existing = existingIdx >= 0 ? snapshot.channelModes[existingIdx] : null;
  const currentModes = existing ? { ...existing.modes } : { ...emptyState() };

  let newModes: Record<string, boolean>;
  if (operation === "clear") {
    newModes = { ...emptyState() };
  } else if (operation === "remove") {
    newModes = { ...currentModes };
    for (const m of modeList) newModes[m] = false;
  } else {
    newModes = { ...currentModes };
    for (const m of modeList) newModes[m] = true;
  }

  const updatedEntry: ModeEntry = {
    guildId,
    targetId,
    targetType: targetType as "channel" | "category" | "thread",
    modes: newModes,
    updatedAt: Date.now(),
  };

  if (existingIdx >= 0) {
    snapshot.channelModes[existingIdx] = updatedEntry;
  } else {
    snapshot.channelModes.push(updatedEntry);
  }

  await persistStore(snapshot);
}

export async function viewModes({
  guildId,
  targetId,
  targetType,
  parents,
}: {
  guildId: string;
  targetId: string;
  targetType: string;
  parents?: Array<{ targetId: string; targetType: string }>;
}): Promise<{
  direct: { modes: Record<string, boolean> };
  inherited: Array<{ label: string; modes: Record<string, boolean> }>;
  effective: { modes: Record<string, boolean> };
}> {
  const direct: Record<string, boolean> = { ...emptyState() };
  const inherited: Array<{ label: string; modes: Record<string, boolean> }> = [];

  if (database.isConfigured()) {
    try {
      const col =
        targetType === "category" ? "category_id" :
        targetType === "thread" ? "thread_id" : "channel_id";

      interface TargetRow { config: unknown; }
      const rows = await database.query<TargetRow[]>(
        `SELECT config FROM mode_configs WHERE guild_id = ? AND ${col} = ? LIMIT 1`,
        [guildId, targetId],
      );
      if (rows?.[0]?.config) {
        Object.assign(direct, configToModes(rows[0].config));
      }
    } catch {
      // ignore
    }
  }

  if (parents) {
    for (const parent of parents) {
      if (database.isConfigured()) {
        try {
          const col =
            parent.targetType === "category" ? "category_id" :
            parent.targetType === "thread" ? "thread_id" : "channel_id";

          interface ParentRow { config: unknown; }
          const rows = await database.query<ParentRow[]>(
            `SELECT config FROM mode_configs WHERE guild_id = ? AND ${col} = ? LIMIT 1`,
            [guildId, parent.targetId],
          );
          if (rows?.[0]?.config) {
            inherited.push({
              label: `${parent.targetType}:${parent.targetId}`,
              modes: configToModes(rows[0].config),
            });
          }
        } catch {
          // ignore
        }
      }
    }
  }

  const effective: Record<string, boolean> = { ...emptyState() };
  for (const entry of inherited) {
    for (const [k, v] of Object.entries(entry.modes)) {
      if (v) effective[k] = true;
    }
  }
  for (const [k, v] of Object.entries(direct)) {
    if (v) effective[k] = true;
  }

  return { direct: { modes: direct }, inherited, effective: { modes: effective } };
}

export async function listModes({
  guildId,
  presenceMode,
  presenceFilter,
}: {
  guildId: string;
  scope?: string;
  presenceMode?: string | null;
  presenceFilter?: string | null;
}): Promise<Array<{ label: string; modes: Record<string, boolean> }>> {
  if (!database.isConfigured()) return [];

  try {
    interface ListRow {
      channel_id: string | null;
      category_id: string | null;
      thread_id: string | null;
      config: unknown;
    }
    const rows = await database.query<ListRow[]>(
      "SELECT channel_id, category_id, thread_id, config FROM mode_configs WHERE guild_id = ?",
      [guildId],
    );

    return (rows || [])
      .map((row) => {
        const modes = configToModes(row.config);
        let targetType = "channel";
        let targetId = row.channel_id;
        if (row.thread_id) { targetType = "thread"; targetId = row.thread_id; }
        else if (row.category_id) { targetType = "category"; targetId = row.category_id; }

        return {
          label: `${targetType}:${targetId}`,
          modes: { ...emptyState(), ...modes },
        };
      })
      .filter((entry) => {
        if (!presenceMode && !presenceFilter) return true;
        if (presenceMode) {
          const has =
            presenceFilter === "has"
              ? entry.modes[presenceMode]
              : !entry.modes[presenceMode];
          return has;
        }
        return true;
      });
  } catch {
    return [];
  }
}

export function formatModeState(modes: Record<string, boolean>): string {
  const active = Object.entries(modes)
    .filter(([, v]) => v)
    .map(([k]) => k);
  return active.length === 0 ? "(none)" : active.join(" + ");
}

export function cacheGet(
  client: unknown,
  guildId: string,
  targetType = "channel",
  targetId = "unknown",
): Record<string, boolean> | null {
  const c = client as ClientWithModeCache;
  if (!c?.slimeModeCache) return null;
  const entry = c.slimeModeCache.get(cacheKey(guildId, targetType, targetId));
  return entry ? { ...(entry.modes || {}) } : null;
}

// ─── DB Persistence ───────────────────────────────────────────────────────────

interface ModeConfigRow {
  id: number;
  guild_id: string;
  channel_id: string | null;
  category_id: string | null;
  thread_id: string | null;
}

export async function persistStore(
  store: ModeStoreSnapshot,
  client: unknown = null,
): Promise<void> {
  const snapshot = cloneStore(store);
  setMemoryStore(snapshot);

  if (!database.isConfigured()) return;

  try {
    const entries = snapshot.channelModes.filter(
      (entry) =>
        entry.guildId && entry.targetId && TARGET_TYPES.has(entry.targetType),
    );
    const desiredMap = new Map<string, ModeEntry>();
    for (const entry of entries) {
      desiredMap.set(cacheKey(entry.guildId, entry.targetType, entry.targetId), {
        guildId: entry.guildId,
        targetId: entry.targetId,
        targetType: entry.targetType,
        modes: { ...(entry.modes || {}) },
        updatedAt: entry.updatedAt || Date.now(),
      });
    }

    const rows = await database.query<ModeConfigRow[]>(
      "SELECT id, guild_id, channel_id, category_id, thread_id FROM mode_configs",
    );

    const toDelete: number[] = [];
    for (const row of rows) {
      const entry = rowToEntry(row as unknown as Record<string, unknown>);
      if (!entry) {
        toDelete.push(row.id);
        continue;
      }
      const key = cacheKey(entry.guildId, entry.targetType, entry.targetId);
      if (!desiredMap.has(key)) {
        toDelete.push(row.id);
      }
    }

    if (toDelete.length) {
      const placeholders = toDelete.map(() => "?").join(",");
      await database.execute(
        `DELETE FROM mode_configs WHERE id IN (${placeholders})`,
        toDelete,
      );
    }

    for (const entry of desiredMap.values()) {
      await database.ensureGuildRecord(entry.guildId);
      const columns = mapTargetColumns(entry.targetType, entry.targetId);
      const payload = {
        modes: entry.modes,
        updatedAt: entry.updatedAt || Date.now(),
      };

      await database.execute(
        `INSERT INTO mode_configs (guild_id, channel_id, category_id, thread_id, config)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE config = VALUES(config), updated_at = NOW()`,
        [
          entry.guildId,
          columns.channelId,
          columns.categoryId,
          columns.threadId,
          JSON.stringify(payload),
        ],
      );
    }

    const effectiveClient = client || getEffectiveClient();
    if (effectiveClient) {
      refreshClientCache(effectiveClient, desiredMap.values());
    }
  } catch (err) {
    console.warn("[mode-store] Failed to persist mode configs:", (err as Error).message);
  }
}

// ─── Load From DB ─────────────────────────────────────────────────────────────

export async function loadGuildModesIntoCache(
  client: unknown = null,
): Promise<Map<string, ModeEntry>> {
  if (!database.isConfigured()) return new Map();

  try {
    interface ModeConfigRowFull {
      guild_id: string;
      channel_id: string | null;
      category_id: string | null;
      thread_id: string | null;
      config: unknown;
    }
    const rows = await database.query<ModeConfigRowFull[]>(
      "SELECT guild_id, channel_id, category_id, thread_id, config FROM mode_configs",
    );

    const entries: ModeEntry[] = [];
    const cache = new Map<string, ModeEntry>();
    for (const row of rows) {
      const entry = rowToEntry(row as unknown as Record<string, unknown>);
      if (!entry) continue;
      entries.push(entry);
      cache.set(cacheKey(entry.guildId, entry.targetType, entry.targetId), entry);
    }

    const snapshot: ModeStoreSnapshot = { channelModes: entries };
    setMemoryStore(snapshot);
    writeStoreToDisk(snapshot);

    const effectiveClient = client || getEffectiveClient();
    if (effectiveClient) {
      refreshClientCache(effectiveClient, cache.values());
      return (effectiveClient as ClientWithModeCache).slimeModeCache || cache;
    }

    return cache;
  } catch (err) {
    console.warn("[mode-store] Failed to hydrate cache:", (err as Error).message);
    return new Map();
  }
}

// ─── Disk Persistence (for non-DB fallback) ───────────────────────────────────

export { STORE_PATH };
