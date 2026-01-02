"use client";

const DEBUG_KEY = "slimyDebug";

export function isSlimyDebugEnabled() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DEBUG_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSlimyDebugEnabled(enabled) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEBUG_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

export function debugLog(...args) {
  if (!isSlimyDebugEnabled()) return;
  console.log(...args);
}

export function debugWarn(...args) {
  if (!isSlimyDebugEnabled()) return;
  console.warn(...args);
}

export function debugError(...args) {
  if (!isSlimyDebugEnabled()) return;
  console.error(...args);
}
