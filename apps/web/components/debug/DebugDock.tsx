"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

type HealthState =
  | { status: "idle" | "loading" }
  | { status: "ok"; requestId: string | null }
  | { status: "error"; requestId: string | null; code: string };

type DiagState =
  | { status: "idle" | "loading" }
  | { status: "ok"; requestId: string | null; authenticated: boolean; user?: any }
  | { status: "error"; requestId: string | null; code: string; authenticated?: boolean };

type GuildSummary = {
  id: string;
  name?: string;
  roleLabel?: string;
  roleSource?: string;
};

const LS_ENABLED = "slimy_debug_ui_enabled";
const LS_OPEN = "slimy_debug_ui_open";

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

function getActiveGuildId(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const idx = segments.indexOf("guilds");
  const maybe = idx >= 0 ? segments[idx + 1] : null;
  return maybe && /^\d+$/.test(maybe) ? maybe : null;
}

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function DebugDock() {
  const pathname = usePathname() || "/";
  const { user, isLoading: authLoading } = useAuth();

  const envEnabled = process.env.NEXT_PUBLIC_DEBUG_UI === "1";
  const [enabled, setEnabled] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const [health, setHealth] = useState<HealthState>({ status: "idle" });
  const [diag, setDiag] = useState<DiagState>({ status: "idle" });
  const [guilds, setGuilds] = useState<GuildSummary[] | null>(null);

  const activeGuildId = useMemo(() => getActiveGuildId(pathname), [pathname]);
  const activeGuild = useMemo(() => {
    if (!activeGuildId || !guilds) return null;
    return guilds.find((g) => String(g.id) === String(activeGuildId)) || null;
  }, [activeGuildId, guilds]);

  useEffect(() => {
    const initialEnabled = envEnabled || readLocalStorageFlag(LS_ENABLED);
    const initialOpen = readLocalStorageFlag(LS_OPEN);
    setEnabled(initialEnabled);
    setOpen(initialOpen);
  }, [envEnabled]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d")) return;
      e.preventDefault();
      setEnabled((prev) => {
        const next = !prev;
        if (!envEnabled) writeLocalStorageFlag(LS_ENABLED, next);
        return next;
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [envEnabled]);

  useEffect(() => {
    writeLocalStorageFlag(LS_OPEN, open);
  }, [open]);

  useEffect(() => {
    if (!enabled) return;
    let canceled = false;

    const run = async () => {
      setHealth({ status: "loading" });
      setDiag({ status: "loading" });

      const [healthRes, diagRes] = await Promise.allSettled([
        fetch("/api/admin-api/health", { cache: "no-store", credentials: "include" }),
        fetch("/api/admin-api/diag", { cache: "no-store", credentials: "include" }),
      ]);

      if (!canceled) {
        if (healthRes.status === "fulfilled") {
          const res = healthRes.value;
          const requestId = res.headers.get("x-request-id");
          if (res.ok) setHealth({ status: "ok", requestId });
          else setHealth({ status: "error", requestId, code: `HTTP_${res.status}` });
        } else {
          setHealth({ status: "error", requestId: null, code: "NETWORK" });
        }

        if (diagRes.status === "fulfilled") {
          const res = diagRes.value;
          const requestId = res.headers.get("x-request-id");
          const body = await safeJson(res);
          const authenticated =
            Boolean(body?.authenticated) || Boolean(body?.ok && body?.authenticated);

          if (res.ok) {
            setDiag({
              status: "ok",
              requestId,
              authenticated,
              user: body?.user ?? null,
            });
          } else {
            setDiag({
              status: "error",
              requestId,
              code: `HTTP_${res.status}`,
              authenticated,
            });
          }
        } else {
          setDiag({ status: "error", requestId: null, code: "NETWORK" });
        }
      }
    };

    run().catch(() => {
      if (!canceled) {
        setHealth({ status: "error", requestId: null, code: "UNKNOWN" });
        setDiag({ status: "error", requestId: null, code: "UNKNOWN" });
      }
    });

    const interval = setInterval(() => run().catch(() => {}), 30000);
    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (!user || authLoading) return;
    let canceled = false;

    const run = async () => {
      const res = await fetch("/api/discord/guilds", { cache: "no-store", credentials: "include" });
      if (!res.ok) return;
      const data = await safeJson(res);
      const list = Array.isArray(data?.guilds) ? data.guilds : [];
      const normalized: GuildSummary[] = list.map((g: any) => ({
        id: String(g?.id || ""),
        name: g?.name ? String(g.name) : undefined,
        roleLabel: g?.roleLabel ? String(g.roleLabel) : undefined,
        roleSource: g?.roleSource ? String(g.roleSource) : undefined,
      }));
      if (!canceled) setGuilds(normalized);
    };

    run().catch(() => {});
    return () => {
      canceled = true;
    };
  }, [enabled, user, authLoading]);

  const debugBlob = useMemo(() => {
    return {
      ts: new Date().toISOString(),
      route: pathname,
      env: { NODE_ENV: process.env.NODE_ENV, NEXT_PUBLIC_DEBUG_UI: envEnabled ? "1" : "0" },
      user: user
        ? {
            id: (user as any).id ?? null,
            discordId: (user as any).discordId ?? null,
            role: (user as any).role ?? null,
          }
        : null,
      activeGuild: activeGuildId
        ? {
            id: activeGuildId,
            name: activeGuild?.name ?? null,
            roleLabel: activeGuild?.roleLabel ?? null,
            roleSource: activeGuild?.roleSource ?? null,
          }
        : null,
      adminApi: {
        health: health.status,
        requestId:
          health.status === "ok" || health.status === "error" ? health.requestId : null,
        diag: diag.status,
        diagRequestId:
          diag.status === "ok" || diag.status === "error" ? diag.requestId : null,
        authenticated:
          diag.status === "ok"
            ? diag.authenticated
            : diag.status === "error"
              ? diag.authenticated ?? null
              : null,
      },
    };
  }, [activeGuild?.name, activeGuild?.roleLabel, activeGuild?.roleSource, activeGuildId, diag, envEnabled, health, pathname, user]);

  const copyBlob = async () => {
    const payload = JSON.stringify(debugBlob, null, 2);
    await navigator.clipboard.writeText(payload);
  };

  if (!enabled) return null;

  return (
    <div className="fixed bottom-3 right-3 z-[9999] text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded border border-black bg-white px-3 py-2 font-mono shadow"
        aria-expanded={open}
      >
        Debug
      </button>

      {open ? (
        <div className="mt-2 w-[360px] max-w-[90vw] rounded border border-black bg-white p-3 font-mono shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold">Status</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!envEnabled) {
                    writeLocalStorageFlag(LS_ENABLED, false);
                    setEnabled(false);
                  } else {
                    setOpen(false);
                  }
                }}
                className="rounded border border-black px-2 py-1"
                title={envEnabled ? "Close" : "Disable"}
              >
                {envEnabled ? "Close" : "Disable"}
              </button>
              <button type="button" onClick={copyBlob} className="rounded border border-black px-2 py-1">
                Copy Debug Blob
              </button>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <div>route: {pathname}</div>
            <div>env: {process.env.NODE_ENV}</div>
            <div>
              user:{" "}
              {authLoading
                ? "loading"
                : user
                  ? `${(user as any).id ?? "?"} (${(user as any).role ?? "member"})`
                  : "none"}
            </div>
            <div>
              activeGuild: {activeGuildId || "none"}{" "}
              {activeGuildId && activeGuild?.roleLabel
                ? `(${activeGuild.roleLabel}${activeGuild.roleSource ? `:${activeGuild.roleSource}` : ""})`
                : ""}
            </div>
            <div>
              admin-api health:{" "}
              {health.status === "ok"
                ? `ok${health.requestId ? ` (req ${health.requestId})` : ""}`
                : health.status === "error"
                  ? `error:${health.code}${health.requestId ? ` (req ${health.requestId})` : ""}`
                  : health.status}
            </div>
            <div>
              admin-api diag:{" "}
              {diag.status === "ok"
                ? `ok auth=${diag.authenticated ? "true" : "false"}${diag.requestId ? ` (req ${diag.requestId})` : ""}`
                : diag.status === "error"
                  ? `error:${diag.code}${diag.requestId ? ` (req ${diag.requestId})` : ""}`
                  : diag.status}
            </div>
            {!envEnabled ? (
              <div className="mt-2 opacity-70">
                Tip: toggle with Ctrl+Shift+D (persists in localStorage).
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

