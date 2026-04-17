/**
 * File-based memory store — fallback when DB is not configured.
 * Ported from /opt/slimy/app/lib/memory.js
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

interface MemoryMemo {
  _id: string;
  userId: string;
  guildId: string | null;
  content: string;
  tags: string[];
  context: Record<string, unknown>;
  createdAt: number;
}

interface MemoryPrefs {
  userId: string;
  guildId: string | null;
  key: string;
  value: string;
}

interface MemoryChannelMode {
  guildId: string;
  targetId: string;
  targetType: "category" | "channel" | "thread";
  modes: Record<string, boolean>;
  updatedAt: number;
}

interface MemoryDB {
  prefs: MemoryPrefs[];
  memos: MemoryMemo[];
  channelModes: MemoryChannelMode[];
}

const DATA_DIR = process.env.SLIMY_MEMORY_DIR
  ? path.resolve(process.cwd(), process.env.SLIMY_MEMORY_DIR)
  : path.join(process.cwd(), "data");
const FILE = process.env.SLIMY_MEMORY_FILE
  ? path.resolve(process.cwd(), process.env.SLIMY_MEMORY_FILE)
  : path.join(DATA_DIR, "data_store.json");

const MODE_KEYS = [
  "admin",
  "chat",
  "personality",
  "no_personality",
  "super_snail",
];
const MODE_SET = new Set(MODE_KEYS);

function load(): MemoryDB {
  try {
    if (!fs.existsSync(FILE)) {
      const empty: MemoryDB = { prefs: [], memos: [], channelModes: [] };
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify(empty, null, 2), "utf8");
      return empty;
    }

    const raw = fs.readFileSync(FILE, "utf8");
    const db: MemoryDB = JSON.parse(raw);
    db.prefs ||= [];
    db.memos ||= [];
    db.channelModes ||= [];
    return db;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      const empty: MemoryDB = { prefs: [], memos: [], channelModes: [] };
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify(empty, null, 2), "utf8");
      return empty;
    }
    if (err instanceof SyntaxError) {
      console.error("[memory] Database file corrupted (invalid JSON)");
      return { prefs: [], memos: [], channelModes: [] };
    }
    throw err;
  }
}

async function save(db: MemoryDB): Promise<void> {
  const tempFile = FILE + ".tmp";
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), "utf8");
    fs.renameSync(tempFile, FILE);
  } catch (e) {
    try {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch {
      // ignore
    }
    throw e;
  }
}

function prefKey(userId: string, guildId: string | null, key: string) {
  return { userId, guildId: guildId || null, key };
}

async function setConsent({
  userId,
  guildId,
  allowed,
}: {
  userId: string;
  guildId: string | null;
  allowed: boolean;
}): Promise<void> {
  const db = load();
  const k = prefKey(userId, guildId, "consent");
  const i = db.prefs.findIndex(
    (p) =>
      p.userId === k.userId && p.guildId === k.guildId && p.key === "consent",
  );
  if (i >= 0) db.prefs[i].value = allowed ? "1" : "0";
  else db.prefs.push({ ...k, value: allowed ? "1" : "0" });
  await save(db);
}

async function getConsent({
  userId,
  guildId,
}: {
  userId: string;
  guildId: string | null;
}): Promise<boolean> {
  const db = load();
  const k = prefKey(userId, guildId, "consent");
  const r = db.prefs.find(
    (p) =>
      p.userId === k.userId && p.guildId === k.guildId && p.key === "consent",
  );
  return r?.value === "1";
}

function emptyModeState(): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (const key of MODE_KEYS) state[key] = false;
  return state;
}

function sanitizeModes(
  modes: string | string[],
): string[] {
  if (Array.isArray(modes)) {
    const seen = new Set<string>();
    return modes
      .map((m) => String(m || "").toLowerCase().trim())
      .filter((m) => {
        if (!m || !MODE_SET.has(m) || seen.has(m)) return false;
        seen.add(m);
        return true;
      });
  }
  if (typeof modes === "string") {
    return sanitizeModes(modes.split(/[,\s]+/));
  }
  return [];
}

async function patchChannelModes({
  guildId,
  targetId,
  targetType,
  modes,
  operation = "merge",
}: {
  guildId: string;
  targetId: string;
  targetType: string;
  modes: string | string[];
  operation?: string;
}): Promise<Record<string, boolean>> {
  if (!guildId || !targetId || !targetType) {
    throw new Error(
      "patchChannelModes requires guildId, targetId, targetType",
    );
  }

  const db = load();
  db.channelModes ||= [];
  const idx = db.channelModes.findIndex(
    (entry) =>
      entry.guildId === guildId &&
      entry.targetId === targetId &&
      entry.targetType === targetType,
  );
  const modeList = sanitizeModes(modes);

  if (!modeList.length && operation !== "replace") {
    return idx >= 0 ? db.channelModes[idx].modes : emptyModeState();
  }

  if (operation === "replace") {
    const clearedModes = emptyModeState();
    for (const mode of modeList) clearedModes[mode] = true;

    if (idx === -1) {
      if (MODE_KEYS.every((key) => !clearedModes[key])) {
        await save(db);
        return emptyModeState();
      }
      const entry: MemoryChannelMode = {
        guildId,
        targetId,
        targetType: targetType as "category" | "channel" | "thread",
        modes: clearedModes,
        updatedAt: Date.now(),
      };
      db.channelModes.push(entry);
      await save(db);
      return entry.modes;
    }

    const entry = db.channelModes[idx];
    entry.modes = clearedModes;
    entry.updatedAt = Date.now();
    if (MODE_KEYS.every((key) => !entry.modes[key])) {
      db.channelModes.splice(idx, 1);
    }
    await save(db);
    return entry.modes;
  }

  if (idx === -1) {
    const entry: MemoryChannelMode = {
      guildId,
      targetId,
      targetType: targetType as "category" | "channel" | "thread",
      modes: emptyModeState(),
      updatedAt: Date.now(),
    };
    for (const mode of modeList) entry.modes[mode] = true;
    if (MODE_KEYS.every((key) => !entry.modes[key])) {
      await save(db);
      return emptyModeState();
    }
    db.channelModes.push(entry);
    await save(db);
    return entry.modes;
  }

  const entry = db.channelModes[idx];
  for (const mode of modeList) entry.modes[mode] = true;
  entry.updatedAt = Date.now();
  if (MODE_KEYS.every((key) => !entry.modes[key])) {
    db.channelModes.splice(idx, 1);
  }
  await save(db);
  return entry.modes;
}

async function getChannelModes({
  guildId,
  targetId,
  targetType,
}: {
  guildId: string;
  targetId: string;
  targetType?: string;
}): Promise<Record<string, boolean>> {
  if (!guildId || !targetId) return emptyModeState();
  const db = load();
  db.channelModes ||= [];
  const entry = db.channelModes.find(
    (record) =>
      record.guildId === guildId &&
      record.targetId === targetId &&
      (!targetType || record.targetType === targetType),
  );
  return entry ? { ...emptyModeState(), ...entry.modes } : emptyModeState();
}

async function clearChannelModes({
  guildId,
  targetId,
  targetType,
}: {
  guildId: string;
  targetId: string;
  targetType: string;
}): Promise<Record<string, boolean>> {
  return patchChannelModes({
    guildId,
    targetId,
    targetType,
    modes: [],
    operation: "replace",
  });
}

async function listChannelModes({
  guildId,
}: {
  guildId: string;
}): Promise<MemoryChannelMode[]> {
  const db = load();
  db.channelModes ||= [];
  return db.channelModes
    .filter((entry) => entry.guildId === guildId)
    .map((entry) => ({
      ...entry,
      modes: { ...emptyModeState(), ...entry.modes },
    }));
}

async function addMemo({
  userId,
  guildId,
  content,
  tags = [],
  context = {},
}: {
  userId: string;
  guildId: string | null;
  content: string;
  tags?: string[];
  context?: Record<string, unknown>;
}): Promise<MemoryMemo> {
  const db = load();
  const memo: MemoryMemo = {
    _id: randomUUID(),
    userId,
    guildId: guildId || null,
    content,
    tags: Array.isArray(tags) ? tags.map((t) => String(t)) : [],
    context: typeof context === "object" && context !== null ? { ...context } : {},
    createdAt: Date.now(),
  };
  db.memos.push(memo);
  await save(db);
  return memo;
}

async function listMemos({
  userId,
  guildId,
  limit = 25,
}: {
  userId: string;
  guildId: string | null;
  limit?: number;
}): Promise<MemoryMemo[]> {
  const db = load();
  const rows = db.memos
    .filter(
      (m) => m.userId === userId && m.guildId === (guildId || null),
    )
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return rows.slice(0, limit);
}

async function deleteMemo({
  id,
  userId,
  guildId,
}: {
  id: string;
  userId: string;
  guildId: string | null;
}): Promise<boolean> {
  const db = load();
  const initialCount = db.memos.length;
  db.memos = db.memos.filter((m) => {
    if (m._id !== id || m.userId !== userId) return true;
    if (guildId !== undefined && m.guildId !== (guildId || null)) return true;
    return false;
  });
  const deleted = db.memos.length < initialCount;
  if (deleted) await save(db);
  return deleted;
}

async function deleteAllMemos({
  userId,
  guildId,
}: {
  userId: string;
  guildId: string | null;
}): Promise<number> {
  const db = load();
  const targetGuild = guildId || null;
  const initialCount = db.memos.length;
  db.memos = db.memos.filter(
    (m) => !(m.userId === userId && m.guildId === targetGuild),
  );
  const deletedCount = initialCount - db.memos.length;
  if (deletedCount > 0) await save(db);
  return deletedCount;
}

export const memoryStore = {
  setConsent,
  getConsent,
  patchChannelModes,
  getChannelModes,
  clearChannelModes,
  listChannelModes,
  addMemo,
  listMemos,
  deleteMemo,
  deleteAllMemos,
  // Backward compatibility aliases
  saveMemory: addMemo,
  getMemories: listMemos,
};

export default memoryStore;
