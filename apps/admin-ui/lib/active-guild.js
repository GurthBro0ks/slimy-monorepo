"use client";

import { useEffect, useMemo, useState } from "react";

export const ACTIVE_GUILD_ID_KEY = "slimy_admin_active_guild_id";

export function parseGuildIdFromPath(asPath) {
  const path = String(asPath || "").split("?")[0].split("#")[0];
  const match = path.match(/^\/(guilds|snail)\/([^/]+)(?:\/|$)/);
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
