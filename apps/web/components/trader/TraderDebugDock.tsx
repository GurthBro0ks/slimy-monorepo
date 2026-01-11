"use client";

import { useState, useEffect, useMemo } from "react";
import { useTrader } from "@/lib/trader/context";

const LS_KEY = "slimy_trader_debug_open";

function readLocalStorageFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeLocalStorageFlag(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // ignore
  }
}

export function TraderDebugDock() {
  const { mode, adapterType, apiBase, lastFetch, latencyMs, errorCount, lastError } =
    useTrader();
  const [open, setOpen] = useState(false);

  const buildVersion = process.env.NEXT_PUBLIC_BUILD_VERSION || "dev";

  useEffect(() => {
    setOpen(readLocalStorageFlag(LS_KEY));
  }, []);

  useEffect(() => {
    writeLocalStorageFlag(LS_KEY, open);
  }, [open]);

  // Keyboard shortcut: Ctrl+Shift+T
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const debugBlob = useMemo(
    () => ({
      ts: new Date().toISOString(),
      mode,
      adapterType,
      apiBase,
      lastFetch,
      latencyMs,
      errorCount,
      lastError,
      buildVersion,
    }),
    [mode, adapterType, apiBase, lastFetch, latencyMs, errorCount, lastError, buildVersion]
  );

  const copyBlob = async () => {
    const payload = JSON.stringify(debugBlob, null, 2);
    await navigator.clipboard.writeText(payload);
  };

  return (
    <div className="fixed bottom-3 left-3 z-[9999] text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`rounded border px-3 py-2 font-mono shadow transition-colors ${
          open
            ? "border-[var(--neon-green)] bg-black text-[var(--neon-green)]"
            : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
        }`}
        aria-expanded={open}
      >
        Trader Debug
      </button>

      {open && (
        <div className="mt-2 w-[320px] max-w-[90vw] rounded border border-[var(--neon-green)]/50 bg-black/95 p-3 font-mono shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="font-semibold text-[var(--neon-green)]">
              Trader Status
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-gray-700 px-2 py-1 text-gray-400 hover:border-gray-600"
              >
                Close
              </button>
              <button
                type="button"
                onClick={copyBlob}
                className="rounded border border-gray-700 px-2 py-1 text-gray-400 hover:border-[var(--neon-green)] hover:text-[var(--neon-green)]"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="space-y-1.5 text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-500">mode:</span>
              <span
                className={
                  mode === "shadow" ? "text-amber-400" : "text-red-500"
                }
              >
                {mode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">adapter:</span>
              <span className="text-cyan-400">{adapterType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">apiBase:</span>
              <span className="text-gray-300 truncate max-w-[160px]">
                {apiBase}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">lastRefresh:</span>
              <span className="text-gray-300">
                {lastFetch
                  ? new Date(lastFetch).toLocaleTimeString()
                  : "never"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">latency:</span>
              <span
                className={
                  latencyMs && latencyMs > 500
                    ? "text-amber-400"
                    : "text-green-400"
                }
              >
                {latencyMs ? `${latencyMs}ms` : "n/a"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">errors:</span>
              <span
                className={errorCount > 0 ? "text-red-400" : "text-green-400"}
              >
                {errorCount}
              </span>
            </div>
            {lastError && (
              <div className="mt-2 p-2 bg-red-900/30 border border-red-500/30 rounded text-red-400 break-words">
                {lastError}
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-800 mt-2">
              <span className="text-gray-500">build:</span>
              <span className="text-gray-400">{buildVersion}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-800 text-gray-600">
            Tip: toggle with Ctrl+Shift+T
          </div>
        </div>
      )}
    </div>
  );
}
