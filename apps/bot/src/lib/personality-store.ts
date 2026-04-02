/**
 * Personality settings store — persists personality adjustments to disk.
 * Ported from /opt/slimy/app/lib/personality-store.js
 */

import fs from "fs";
import path from "path";

const STORE_DIR = path.join(__dirname, "..", "..", "var");
const STORE_PATH = path.join(STORE_DIR, "personality-adjustments.json");

function ensureDir(): void {
  try {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

function safeParse<T>(value: string, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function loadAdjustments(): Record<string, unknown> {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = safeParse<Record<string, unknown>>(raw, {});
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    // ignore read errors
  }
  return {};
}

function saveAdjustments(data: Record<string, unknown>): void {
  ensureDir();
  const payload: Record<string, unknown> = {};
  for (const [key, record] of Object.entries(data || {})) {
    if (!key) continue;
    if (
      record &&
      typeof record === "object" &&
      typeof (record as Record<string, unknown>).value !== "undefined"
    ) {
      const r = record as Record<string, unknown>;
      payload[key] = {
        value: r.value,
        updatedAt: Number(r.updatedAt) || Date.now(),
        updatedBy: r.updatedBy || null,
        updatedByTag: r.updatedByTag || null,
      };
    }
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2));
}

function setAdjustment(
  parameter: string,
  value: unknown,
  metadata?: Record<string, unknown>,
): Record<string, unknown> | null {
  if (!parameter) return null;
  const adjustments = loadAdjustments();
  adjustments[parameter] = {
    value,
    updatedAt: Date.now(),
    updatedBy: metadata?.updatedBy || null,
    updatedByTag: metadata?.updatedByTag || null,
  };
  saveAdjustments(adjustments);
  return adjustments[parameter] as Record<string, unknown>;
}

function clearAdjustment(parameter: string): boolean {
  if (!parameter) return false;
  const adjustments = loadAdjustments();
  if (!(parameter in adjustments)) return false;
  delete adjustments[parameter];
  saveAdjustments(adjustments);
  return true;
}

function getAllAdjustments(): Record<string, unknown> {
  return loadAdjustments();
}

function mergeAdjustments(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const adjustments = loadAdjustments();
  return {
    ...config,
    adjustments,
  };
}

export {
  STORE_PATH,
  loadAdjustments,
  saveAdjustments,
  setAdjustment,
  clearAdjustment,
  getAllAdjustments,
  mergeAdjustments,
};
