"use client";

import { useEffect, useMemo, useState } from "react";

export const ACTIVE_GUILD_ID_KEY = "slimy_admin_active_guild_id";
export const ACTIVE_GUILD_SYNC_ID_KEY = "slimy_last_active_guild_sync_id";
export const ACTIVE_GUILD_SYNC_TS_KEY = "slimy_last_active_guild_sync_ts";
export const ACTIVE_GUILD_SYNC_STATUS_KEY = "slimy_last_active_guild_sync_status";

export function parseGuildIdFromPath(asPath) {
  const path = String(asPath || "").split("?")[0].split("#")[0];
  const match = path.match(/^\/(guilds|snail|club)\/([^/]+)(?:\/|$)/);
  if (!match) return "";
  return match[2] || "";
}

export function readActiveGuildId() {
  if (typeof window === "undefined") return "";
  try {
    return String(window.localStorage.getItem(ACTIVE_GUILD_ID_KEY) || "");
  } catch {
    return "";
  }
}

export function writeActiveGuildId(guildId) {
  if (typeof window === "undefined") return;
  try {
    const value = String(guildId || "");
    if (!value) {
      window.localStorage.removeItem(ACTIVE_GUILD_ID_KEY);
      return;
    }
    window.localStorage.setItem(ACTIVE_GUILD_ID_KEY, value);
  } catch {
    // ignore
  }
}

function readLocalStorageValue(key) {
  if (typeof window === "undefined") return "";
  try {
    return String(window.localStorage.getItem(key) || "");
  } catch {
    return "";
  }
}

function writeLocalStorageValue(key, value) {
  if (typeof window === "undefined") return;
  try {
    if (value === null || value === undefined || value === "") {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

export function readActiveGuildSyncInfo() {
  const guildId = readLocalStorageValue(ACTIVE_GUILD_SYNC_ID_KEY);
  const tsRaw = readLocalStorageValue(ACTIVE_GUILD_SYNC_TS_KEY);
  const status = readLocalStorageValue(ACTIVE_GUILD_SYNC_STATUS_KEY);
  const ts = tsRaw ? Number(tsRaw) : 0;
  return {
    guildId,
    ts: Number.isFinite(ts) ? ts : 0,
    status,
  };
}

export async function ensureActiveGuildCookie(
  guildId,
  { csrfToken, minIntervalMs = 5000 } = {},
) {
  if (typeof window === "undefined") {
    return { ok: false, skipped: true, reason: "server" };
  }

  const normalizedGuildId = String(guildId || "").trim();
  if (!normalizedGuildId) {
    return { ok: false, skipped: true, reason: "missing_guild_id" };
  }

  const now = Date.now();
  const last = readActiveGuildSyncInfo();
  const lastStatus = String(last.status || "");
  const shouldBackoff =
    last.guildId === normalizedGuildId &&
    ["400", "401", "403", "404", "429", "503", "error"].includes(lastStatus);
  const effectiveMinIntervalMs = shouldBackoff ? Math.max(minIntervalMs, 60_000) : minIntervalMs;

  if (last.guildId === normalizedGuildId && last.ts && now - last.ts < effectiveMinIntervalMs) {
    return { ok: false, skipped: true, reason: "recent_attempt", status: last.status || "" };
  }

  writeLocalStorageValue(ACTIVE_GUILD_SYNC_ID_KEY, normalizedGuildId);
  writeLocalStorageValue(ACTIVE_GUILD_SYNC_TS_KEY, now);
  writeLocalStorageValue(ACTIVE_GUILD_SYNC_STATUS_KEY, "pending");

  const headers = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  try {
    const response = await fetch("/api/auth/active-guild", {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ guildId: normalizedGuildId }),
    });

    writeLocalStorageValue(ACTIVE_GUILD_SYNC_STATUS_KEY, response.status);

    return {
      ok: response.ok,
      status: response.status,
      performed: true,
    };
  } catch (err) {
    writeLocalStorageValue(ACTIVE_GUILD_SYNC_STATUS_KEY, "error");
    return {
      ok: false,
      status: "error",
      performed: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function useActiveGuild({ explicitGuildId, router } = {}) {
  const [stored, setStored] = useState(() => readActiveGuildId());

  const fromExplicit = String(explicitGuildId || "");
  const rawQuery = router?.query?.guildId;
  const fromQuery = rawQuery ? String(Array.isArray(rawQuery) ? rawQuery[0] : rawQuery) : "";
  const fromPath = parseGuildIdFromPath(router?.asPath);

  const resolved = useMemo(() => {
    const guildId = fromExplicit || fromPath || fromQuery || stored || "";
    const source = fromExplicit
      ? "explicit"
      : fromPath
        ? "path"
        : fromQuery
          ? "query"
          : stored
            ? "localStorage"
            : "none";
    return { guildId, source };
  }, [fromExplicit, fromPath, fromQuery, stored]);

  useEffect(() => {
    if (!resolved.guildId) return;
    if (resolved.source === "localStorage") return;
    writeActiveGuildId(resolved.guildId);
    setStored(resolved.guildId);
  }, [resolved.guildId, resolved.source]);

  return resolved;
}
