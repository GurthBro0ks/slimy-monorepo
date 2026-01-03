"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "../../lib/session";
import { getSocketStatusSnapshot, subscribeSocketStatus } from "../../lib/socket";
import {
  ensureSlimyDebugErrorCapture,
  getSlimyDebugErrorsSnapshot,
  isSlimyDebugEnabled,
  setSlimyDebugEnabled,
  subscribeSlimyDebugErrors,
} from "../../lib/slimy-debug";

type HealthState =
  | { status: "idle" | "loading" }
  | { status: "ok"; requestId: string | null }
  | { status: "error"; requestId: string | null; code: string };

type DiagState =
  | { status: "idle" | "loading" }
  | { status: "ok"; requestId: string | null; authenticated: boolean }
  | { status: "error"; requestId: string | null; code: string; authenticated?: boolean };

type GuildSummary = {
  id: string;
  name?: string;
  roleLabel?: string;
  roleSource?: string;
};

const LS_OPEN = "slimy_debug_ui_open";
const LS_OPEN_V2 = "slimyDebugOpen";

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
  const segments = pathname.split("?")[0].split("/").filter(Boolean);
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
  const router = useRouter();
  const pathname = router.asPath || "/";
  const { user, loading: sessionLoading } = useSession();

  const envEnabled = process.env.NEXT_PUBLIC_DEBUG_UI === "1";
  const [enabled, setEnabled] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const [buildId, setBuildId] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthState>({ status: "idle" });
  const [diag, setDiag] = useState<DiagState>({ status: "idle" });
  const [guilds, setGuilds] = useState<GuildSummary[] | null>(null);
  const [guildsRequestId, setGuildsRequestId] = useState<string | null>(null);
  const [guildsRequestStatus, setGuildsRequestStatus] = useState<number | null>(null);
  const [guildsMeta, setGuildsMeta] = useState<any>(null);
  const [guildsError, setGuildsError] = useState<string | null>(null);
  const [meStatus, setMeStatus] = useState<{
    status: "idle" | "loading" | "ok" | "unauth" | "error";
    code: number | null;
    requestId: string | null;
    ts: string | null;
  }>({
    status: "idle",
    code: null,
    requestId: null,
    ts: null,
  });
  const [chatStatus, setChatStatus] = useState<any>(() => getSocketStatusSnapshot());
  const [recentErrors, setRecentErrors] = useState<any[]>(() => getSlimyDebugErrorsSnapshot());

  const activeGuildId = useMemo(() => getActiveGuildId(pathname), [pathname]);
  const sessionActiveGuildId = useMemo(() => {
    if (!user) return null;
    const value = (user as any).activeGuildId;
    return value ? String(value) : null;
  }, [user]);
  const activeGuild = useMemo(() => {
    if (!activeGuildId || !guilds) return null;
    return guilds.find((g) => String(g.id) === String(activeGuildId)) || null;
  }, [activeGuildId, guilds]);

  useEffect(() => {
    const initialEnabled = envEnabled || isSlimyDebugEnabled();
    const initialOpen = readLocalStorageFlag(LS_OPEN_V2) || readLocalStorageFlag(LS_OPEN);
    setEnabled(initialEnabled);
    setOpen(initialOpen);
  }, [envEnabled]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d")) return;
      e.preventDefault();
      setEnabled((prev) => {
        const next = !prev;
        if (!envEnabled) setSlimyDebugEnabled(next);
        return next;
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [envEnabled]);

  useEffect(() => {
    writeLocalStorageFlag(LS_OPEN_V2, open);
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setBuildId((window as any).__NEXT_DATA__?.buildId ?? null);
    } catch {
      setBuildId(null);
    }
  }, []);

  useEffect(() => subscribeSocketStatus(setChatStatus), []);

  useEffect(() => {
    ensureSlimyDebugErrorCapture();
    return subscribeSlimyDebugErrors(setRecentErrors);
  }, []);

  useEffect(() => {
    if (envEnabled) return;

    const tick = () => {
      const next = isSlimyDebugEnabled();
      setEnabled((prev) => (prev === next ? prev : next));
    };

    tick();
    const interval = setInterval(tick, 750);
    return () => clearInterval(interval);
  }, [envEnabled]);

  useEffect(() => {
    if (!enabled) return;
    let canceled = false;

    const run = async () => {
      setHealth({ status: "loading" });
      setDiag({ status: "loading" });
      setMeStatus((prev) => ({ ...prev, status: "loading" }));

	      const [healthRes, diagRes] = await Promise.allSettled([
	        fetch("/api/health", { cache: "no-store", credentials: "include" }),
	        fetch("/api/diag", { cache: "no-store", credentials: "include" }),
	      ]);

      const meRes = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" }).catch(() => null);

      if (canceled) return;

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
        const upstream = body?.upstream ?? body;
        const authenticated = Boolean(upstream?.authenticated);

        if (res.ok) {
          setDiag({ status: "ok", requestId, authenticated });
        } else {
          setDiag({ status: "error", requestId, code: `HTTP_${res.status}`, authenticated });
        }
      } else {
        setDiag({ status: "error", requestId: null, code: "NETWORK" });
      }

      if (meRes) {
        const requestId = meRes.headers.get("x-request-id");
        if (meRes.status === 401) setMeStatus({ status: "unauth", code: 401, requestId, ts: new Date().toISOString() });
        else if (meRes.ok) setMeStatus({ status: "ok", code: meRes.status, requestId, ts: new Date().toISOString() });
        else setMeStatus({ status: "error", code: meRes.status, requestId, ts: new Date().toISOString() });
      } else {
        setMeStatus({ status: "error", code: null, requestId: null, ts: new Date().toISOString() });
      }
    };

    run().catch(() => {
      if (!canceled) {
        setHealth({ status: "error", requestId: null, code: "UNKNOWN" });
        setDiag({ status: "error", requestId: null, code: "UNKNOWN" });
        setMeStatus({ status: "error", code: null, requestId: null, ts: new Date().toISOString() });
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
    if (!user || sessionLoading) return;
    let canceled = false;

		    const run = async () => {
		      const res = await fetch("/api/discord/guilds", {
		        cache: "no-store",
		        credentials: "include",
		      });
	      setGuildsRequestStatus(res.status);
	      setGuildsRequestId(res.headers.get("x-request-id"));
	      const metaFromHeaders = {
	        source: res.headers.get("x-slimy-discord-source"),
	        stale: res.headers.get("x-slimy-discord-stale"),
	        retryAfterMs: res.headers.get("x-slimy-discord-retryafterms"),
	        cacheAgeMs: res.headers.get("x-slimy-discord-cacheagems"),
	        cacheExpiresInMs: res.headers.get("x-slimy-discord-cacheexpiresinms"),
	        cooldownRemainingMs: res.headers.get("x-slimy-discord-cooldownremainingms"),
	      };
	      const data = await safeJson(res);
	      const meta = data?.meta ?? metaFromHeaders;
	      setGuildsMeta(meta);
	      if (!res.ok) {
	        setGuildsError(data?.error ? String(data.error) : `HTTP_${res.status}`);
	        return;
	      }
	      setGuildsError(null);
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
  }, [enabled, user, sessionLoading]);

	  const debugBlob = useMemo(() => {
	    return {
      ts: new Date().toISOString(),
      route: pathname,
      env: { NODE_ENV: process.env.NODE_ENV, buildId, NEXT_PUBLIC_DEBUG_UI: envEnabled ? "1" : "0" },
      user: user
        ? {
            id: (user as any).id ?? null,
            discordId: (user as any).discordId ?? (user as any).discord_id ?? null,
            role: (user as any).role ?? null,
            activeGuildId: (user as any).activeGuildId ?? null,
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
      authMe: meStatus,
	      requestIds: {
        adminApiHealth:
          health.status === "ok" || health.status === "error" ? health.requestId : null,
        adminApiDiag:
          diag.status === "ok" || diag.status === "error" ? diag.requestId : null,
	        authMe: meStatus.requestId ?? null,
	        discordGuilds: guildsRequestId,
	      },
	      discord: {
	        guilds: {
	          status: guildsRequestStatus,
	          error: guildsError,
	          meta: guildsMeta,
	        },
	      },
	      chat: chatStatus,
	      errors: recentErrors,
	    };
	  }, [activeGuild?.name, activeGuild?.roleLabel, activeGuild?.roleSource, activeGuildId, buildId, chatStatus, diag, envEnabled, guildsError, guildsMeta, guildsRequestId, guildsRequestStatus, health, meStatus, pathname, recentErrors, user]);

  const copyBlob = async () => {
    const payload = JSON.stringify(debugBlob);
    await navigator.clipboard.writeText(payload);
  };

  if (!enabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 10000,
        fontSize: 12,
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.65)",
          color: "rgba(255,255,255,0.92)",
          padding: "8px 10px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          cursor: "pointer",
        }}
        aria-expanded={open}
      >
        Debug
      </button>

      {open ? (
        <div
          style={{
            marginTop: 10,
            width: 380,
            maxWidth: "90vw",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(0,0,0,0.75)",
            color: "rgba(255,255,255,0.92)",
            padding: 12,
            boxShadow: "0 16px 44px rgba(0,0,0,0.45)",
            lineHeight: 1.4,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 700 }}>Status</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => {
                  if (!envEnabled) {
                    setSlimyDebugEnabled(false);
                    setEnabled(false);
                  } else {
                    setOpen(false);
                  }
                }}
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.4)",
                  color: "rgba(255,255,255,0.92)",
                  padding: "6px 8px",
                  cursor: "pointer",
                }}
                title={envEnabled ? "Close" : "Disable"}
              >
                {envEnabled ? "Close" : "Disable"}
              </button>
              <button
                type="button"
                onClick={copyBlob}
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.4)",
                  color: "rgba(255,255,255,0.92)",
                  padding: "6px 8px",
                  cursor: "pointer",
                }}
              >
                Copy Debug
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            <div>route: {pathname}</div>
            <div>env: {process.env.NODE_ENV} {buildId ? `(build ${buildId})` : ""}</div>
            <div>
              user:{" "}
              {sessionLoading
                ? "loading"
                : user
                  ? `${(user as any).id ?? "?"} (${(user as any).role ?? "member"})`
                  : "none"}
            </div>
            <div>auth/me: {meStatus.status}{meStatus.code ? ` (HTTP ${meStatus.code})` : ""}{meStatus.requestId ? ` (req ${meStatus.requestId})` : ""}{meStatus.ts ? ` @ ${meStatus.ts}` : ""}</div>
            <div>activeGuildId (session): {sessionActiveGuildId || "none"}</div>
            <div>
              routeGuildId: {activeGuildId || "none"}{" "}
              {activeGuildId && activeGuild?.roleLabel
                ? `(${activeGuild.roleLabel}${activeGuild.roleSource ? `:${activeGuild.roleSource}` : ""})`
                : ""}
            </div>
            <div>
              chat: {chatStatus?.state || "unknown"}
              {chatStatus?.socketId ? ` (id ${chatStatus.socketId})` : ""}
              {chatStatus?.lastError ? ` err=${chatStatus.lastError}` : ""}
            </div>
            <div>
              chat lastEvent: {chatStatus?.lastEventName || "none"}
              {chatStatus?.lastEventAt ? ` @ ${chatStatus.lastEventAt}` : ""}
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
            <div>
              discord/guilds: {guildsRequestStatus != null ? `HTTP ${guildsRequestStatus}` : "unknown"}
              {guildsMeta?.source ? ` source=${guildsMeta.source}` : ""}
              {guildsMeta?.stale != null ? ` stale=${guildsMeta.stale}` : ""}
              {guildsMeta?.cooldownRemainingMs != null ? ` cooldownMs=${guildsMeta.cooldownRemainingMs}` : ""}
              {guildsError ? ` err=${guildsError}` : ""}
              {guildsRequestId ? ` (req ${guildsRequestId})` : ""}
            </div>
            <div>errors captured: {Array.isArray(recentErrors) ? recentErrors.length : 0}</div>
            {!envEnabled ? (
              <div style={{ marginTop: 8, opacity: 0.7 }}>
                Tip: enable via `localStorage.setItem('slimyDebug','1')` or Ctrl+Shift+D.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
