"use strict";

const DEFAULT_VERSION = 1;

function defaultUserSettings() {
  return {
    version: DEFAULT_VERSION,
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

function defaultGuildSettings() {
  return {
    version: DEFAULT_VERSION,
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

  const allowed = new Set(Array.isArray(allowKeys) ? allowKeys : ["profile", "chat", "snail"]);
  const next = { ...current };

  for (const [k, v] of Object.entries(patch)) {
    if (!allowed.has(k)) continue;
    next[k] = shallowMergeObject(next[k], v);
  }

  // Preserve version unless explicitly provided and valid
  const ver = Number.isFinite(Number(current.version)) ? Number(current.version) : DEFAULT_VERSION;
  next.version = ver;

  // Ensure required nested defaults exist
  if (!isPlainObject(next.profile)) next.profile = {};
  if (!isPlainObject(next.chat)) next.chat = {};
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

