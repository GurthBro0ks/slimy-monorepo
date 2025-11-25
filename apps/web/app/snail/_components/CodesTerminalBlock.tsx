"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CodesApiResponse = {
  sources?: unknown;
  codes?: unknown;
};

type TerminalState = "loading" | "ready" | "empty" | "error";

const LOADING_MESSAGE = "CONNECTING_TO_DATASTREAM...";
const EMPTY_MESSAGE = "NO_DATA_FOUND...";
const ERROR_MESSAGE = "CONNECTION_LOST";

const extractCodes = (payload?: CodesApiResponse): string[] => {
  if (!payload) return [];

  const fromSources = Array.isArray(payload.sources)
    ? payload.sources
      .map((entry) => {
        if (typeof entry === "string") return entry.trim();
        if (entry && typeof entry === "object" && "code" in entry && typeof (entry as { code?: unknown }).code === "string") {
          return entry.code.trim();
        }
        if (entry && typeof entry === "object" && "value" in entry && typeof (entry as { value?: unknown }).value === "string") {
          return (entry as { value: string }).value.trim();
        }
        return null;
      })
      .filter((code): code is string => Boolean(code))
    : [];

  if (fromSources.length > 0) {
    return fromSources;
  }

  if (Array.isArray(payload.codes)) {
    return payload.codes
      .map((entry) => {
        if (typeof entry === "string") return entry.trim();
        if (entry && typeof entry === "object" && "code" in entry && typeof (entry as { code?: unknown }).code === "string") {
          return entry.code.trim();
        }
        return null;
      })
      .filter((code): code is string => Boolean(code));
  }

  return [];
};

export function CodesTerminalBlock() {
  const [terminalText, setTerminalText] = useState(LOADING_MESSAGE);
  const [state, setState] = useState<TerminalState>("loading");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCodes() {
      setState("loading");
      setTerminalText(LOADING_MESSAGE);

      try {
        const response = await fetch("/api/codes?scope=active", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const data = (await response.json()) as CodesApiResponse;
        const codes = extractCodes(data);

        if (!codes.length) {
          setState("empty");
          setTerminalText(EMPTY_MESSAGE);
          return;
        }

        setState("ready");
        setTerminalText(codes.join("\n"));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to load snail codes", error);
        setState("error");
        setTerminalText(ERROR_MESSAGE);
      }
    }

    void loadCodes();

    return () => {
      controller.abort();
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (!terminalText) return;

    try {
      await navigator.clipboard.writeText(terminalText);
      setCopyState("copied");
    } catch (error) {
      console.error("Clipboard write failed", error);
      setCopyState("error");
    } finally {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
      resetTimer.current = setTimeout(() => setCopyState("idle"), 1800);
    }
  }, [terminalText]);

  const copyLabel =
    copyState === "copied" ? "COPIED!" : copyState === "error" ? "COPY FAILED" : "COPY ALL";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-purple/70 bg-gradient-to-b from-zinc-950/90 via-black to-black/90 p-0 shadow-[0_0_45px_rgba(139,79,191,0.45)]",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:border before:border-neon-green/20 before:opacity-60 before:[mask-image:radial-gradient(circle_at_top,_white,_transparent)] before:content-['']"
      )}
    >
      <div className="relative flex items-center justify-between border-b border-purple/40 bg-gradient-to-r from-dark-purple/40 via-transparent to-black/50 px-6 py-4 font-mono text-xs uppercase tracking-[0.3em] text-neon-green">
        <span className="text-sm tracking-[0.25em]">filename: active_codes.txt</span>
        <div className="flex items-center gap-3">
          {state === "loading" && (
            <span className="text-[0.65rem] text-purple/70 animate-pulse tracking-[0.3em]">
              SYNCING...
            </span>
          )}
          <Button
            variant="purple"
            size="sm"
            onClick={handleCopy}
            className={cn(
              "font-mono text-xs tracking-[0.3em]",
              copyState === "copied" && "bg-neon-green text-black hover:bg-neon-green/90",
              copyState === "error" && "bg-red-600 hover:bg-red-600"
            )}
          >
            {copyLabel}
          </Button>
        </div>
      </div>
      <div className="relative px-6 py-6">
        <div className="rounded-2xl border border-purple/40 bg-black/80 p-4 shadow-inner shadow-purple/30">
          <pre className="min-h-[260px] whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-neon-green">
            {terminalText}
          </pre>
          {state === "ready" && (
            <div className="mt-4 text-right font-mono text-[0.65rem] uppercase tracking-[0.35em] text-lime-green">
              LIVE FEED LINKED &gt;&gt; {terminalText.split("\n").length} codes
            </div>
          )}
          {state === "error" && (
            <div className="mt-4 text-right font-mono text-[0.65rem] uppercase tracking-[0.35em] text-red-400">
              RETRY LATER &gt;&gt; SIGNAL LOST
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default CodesTerminalBlock;