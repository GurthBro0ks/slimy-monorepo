"use strict";

let SETTINGS_VERSION_V0 = 1;
let contractsDefaultUserSettings = null;
let contractsDefaultGuildSettings = null;

try {
  // Prefer shared contracts when available (canonical defaults + schemas live in packages/)
  const contracts = require("@slimy/contracts");
  SETTINGS_VERSION_V0 = Number(contracts?.SETTINGS_VERSION_V0) || 1;
  contractsDefaultUserSettings = contracts?.defaultUserSettings || null;
  contractsDefaultGuildSettings = contracts?.defaultGuildSettings || null;
} catch {
  // Keep admin-api bootable even if workspace package isn't installed yet.
}

const DEFAULT_VERSION = SETTINGS_VERSION_V0;

function defaultUserSettings(userId = "unknown") {
  if (typeof contractsDefaultUserSettings === "function") {
    return contractsDefaultUserSettings(String(userId || "unknown"));
  }

  return {
    userId: String(userId || "unknown"),
    version: DEFAULT_VERSION,
    updatedAt: new Date().toISOString(),
    prefs: {},
    profile: {},
    chat: {},
    snail: {
      personalSheet: {
        enabled: false,
        sheetId: null,
      },
    },
  };
}

function defaultGuildSettings(guildId = "unknown") {
  if (typeof contractsDefaultGuildSettings === "function") {
    return contractsDefaultGuildSettings(String(guildId || "unknown"));
  }

  return {
    guildId: String(guildId || "unknown"),
    version: DEFAULT_VERSION,
    updatedAt: new Date().toISOString(),
    prefs: {},
    profile: {},
    chat: {},
    snail: {
      personalSheet: {
        enabled: false,
        sheetId: null,
      },
    },
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function shallowMergeObject(base, patch) {
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch;
  return { ...base, ...patch };
}

function mergeSettings(existing, patch, { allowKeys } = {}) {
  const current = isPlainObject(existing) ? existing : {};
  if (!isPlainObject(patch)) return current;

  const allowed = new Set(
    Array.isArray(allowKeys) ? allowKeys : ["profile", "chat", "snail", "prefs"],
  );
  const next = { ...current };

  for (const [k, v] of Object.entries(patch)) {
    if (!allowed.has(k)) continue;
    next[k] = shallowMergeObject(next[k], v);
  }

  // Preserve version unless explicitly provided and valid
  const ver = Number.isFinite(Number(current.version)) ? Number(current.version) : DEFAULT_VERSION;
  next.version = ver;
  next.updatedAt = new Date().toISOString();

  // Ensure required nested defaults exist
  if (!isPlainObject(next.profile)) next.profile = {};
  if (!isPlainObject(next.chat)) next.chat = {};
  if (!isPlainObject(next.prefs)) next.prefs = {};
  if (!isPlainObject(next.snail)) next.snail = {};
  if (!isPlainObject(next.snail.personalSheet)) next.snail.personalSheet = {};
  if (typeof next.snail.personalSheet.enabled !== "boolean") next.snail.personalSheet.enabled = false;
  if (typeof next.snail.personalSheet.sheetId !== "string" && next.snail.personalSheet.sheetId !== null) {
    next.snail.personalSheet.sheetId = null;
  }

  return next;
}

module.exports = {
  DEFAULT_VERSION,
  defaultUserSettings,
  defaultGuildSettings,
  mergeSettings,
};
