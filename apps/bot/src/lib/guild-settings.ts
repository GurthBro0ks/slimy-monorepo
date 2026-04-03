/**
 * Per-guild settings management via MySQL guild_settings table.
 * Ported from /opt/slimy/app/lib/guild-settings.js
 */

import { database } from './database.js';

function ensureDatabaseConfigured(): void {
  if (!database.isConfigured()) {
    throw new Error("Database is not configured for guild settings");
  }
}

function sanitizeKey(key: string): string {
  return String(key || "").trim().toLowerCase();
}

function extractSheetId(input: string): string | null {
  const raw = String(input || "").trim();
  if (!raw) return null;

  const urlMatch = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (urlMatch?.[1]) return urlMatch[1];

  const gidMatch = raw.match(/^docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (gidMatch?.[1]) return gidMatch[1];

  const simpleMatch = raw.match(/^([a-zA-Z0-9-_]{20,})$/);
  if (simpleMatch?.[1]) return simpleMatch[1];

  return null;
}

function normalizeSheetInput(input: string): { sheetId: string | null; url: string | null } {
  const trimmed = String(input || "").trim();
  if (!trimmed) return { sheetId: null, url: null };

  let sheetId = extractSheetId(trimmed);
  let url: string | null = null;

  if (/^https?:\/\//i.test(trimmed)) {
    url = trimmed;
  } else if (sheetId) {
    url = `https://docs.google.com/spreadsheets/d/${sheetId}`;
  }

  if (!sheetId && url) {
    sheetId = extractSheetId(url);
  }

  return { sheetId, url };
}

export async function getGuildSetting(guildId: string, key: string): Promise<string | null> {
  ensureDatabaseConfigured();
  if (!guildId) throw new Error("guildId is required");
  const normalized = sanitizeKey(key);
  if (!normalized) throw new Error("key is required");

  interface Row { value: string; }
  const rows = await database.query<Row[]>(
    `SELECT value FROM guild_settings WHERE guild_id = ? AND key_name = ? LIMIT 1`,
    [guildId, normalized],
  );
  return rows[0]?.value ?? null;
}

export interface GuildSettingEntry {
  key: string;
  value: string;
}

export async function getGuildSettings(guildId: string): Promise<GuildSettingEntry[]> {
  ensureDatabaseConfigured();
  if (!guildId) throw new Error("guildId is required");

  interface Row { key_name: string; value: string; }
  const rows = await database.query<Row[]>(
    `SELECT key_name, value FROM guild_settings WHERE guild_id = ?`,
    [guildId],
  );
  return rows.map((row) => ({ key: row.key_name, value: row.value }));
}

export async function setGuildSetting(guildId: string, key: string, value: string): Promise<void> {
  ensureDatabaseConfigured();
  if (!guildId) throw new Error("guildId is required");
  const normalized = sanitizeKey(key);
  if (!normalized) throw new Error("key is required");

  if (value === null || typeof value === "undefined" || value === "") {
    await clearGuildSetting(guildId, normalized);
    return;
  }

  await database.execute(
    `INSERT INTO guild_settings (guild_id, key_name, value) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [guildId, normalized, String(value)],
  );
}

export async function clearGuildSetting(guildId: string, key: string): Promise<void> {
  ensureDatabaseConfigured();
  if (!guildId) throw new Error("guildId is required");
  const normalized = sanitizeKey(key);
  if (!normalized) throw new Error("key is required");

  await database.execute(
    `DELETE FROM guild_settings WHERE guild_id = ? AND key_name = ?`,
    [guildId, normalized],
  );
}

export interface SheetConfig {
  url: string | null;
  sheetId: string | null;
}

export async function getSheetConfig(guildId: string): Promise<SheetConfig> {
  const storedUrl = await getGuildSetting(guildId, "club_sheet_url");
  const storedId = await getGuildSetting(guildId, "club_sheet_id");

  const envUrl = process.env.CLUB_SHEET_URL || null;
  const envId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.SHEETS_SPREADSHEET_ID || null;

  let url = storedUrl || envUrl || null;
  let sheetId = storedId || envId || null;

  if (!sheetId && url) {
    sheetId = extractSheetId(url);
  }
  if (!url && sheetId) {
    url = `https://docs.google.com/spreadsheets/d/${sheetId}`;
  }

  return { url: url || null, sheetId: sheetId || null };
}

export async function setSheetConfig(guildId: string, config: SheetConfig): Promise<void> {
  await setGuildSetting(guildId, "club_sheet_url", config.url || "");
  if (config.sheetId) {
    await setGuildSetting(guildId, "club_sheet_id", config.sheetId);
  } else {
    await clearGuildSetting(guildId, "club_sheet_id");
  }
}

export async function clearSheetConfig(guildId: string): Promise<void> {
  await clearGuildSetting(guildId, "club_sheet_url");
  await clearGuildSetting(guildId, "club_sheet_id");
}

export { extractSheetId, normalizeSheetInput };
