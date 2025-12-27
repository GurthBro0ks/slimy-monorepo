"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyBox } from "@/components/ui/copy-box";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/context";
import { createWebCentralSettingsClient } from "@/lib/api/central-settings-client";
import { getGuildIdentityMap } from "@/lib/guildIdentity";

import type { SettingsChangeEventV0 } from "@slimy/admin-api-client";

type ScopeType = "user" | "guild";

export type SettingsActivityWidgetProps = {
  scopeType: ScopeType;
  scopeId?: string;
  limit?: number;
  defaultView?: "user" | "activeGuild";
  enableActiveGuildSwitch?: boolean;
};

type FetchStatus = { ok: true; status: number } | { ok: false; status: number; error: string };

function safeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return String(value);
}

function resolveUserId(user: any): string | null {
  return safeString(user?.discordId || user?.id || user?.sub || "").trim() || null;
}

function activityLastSeenStorageKeyV1(scopeType: ScopeType, scopeId: string): string {
  return `slimy:settings-activity:lastSeen:v1:${scopeType}:${scopeId}`;
}

function readLastSeenId(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) return null;
    return n;
  } catch {
    return null;
  }
}

function writeLastSeenId(key: string, id: number): void {
  try {
    localStorage.setItem(key, String(id));
  } catch {
    // ignore (quota / disabled storage)
  }
}

function formatEventTimestamp(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString();
}

function summarizeChangedKeys(keys: string[] | undefined, max = 3): string {
  const list = Array.isArray(keys) ? keys.filter((k) => typeof k === "string" && k.trim()).slice() : [];
  if (!list.length) return "No changed keys provided";

  const head = list.slice(0, max);
  const rest = list.length - head.length;
  return rest > 0 ? `${head.join(", ")} (+${rest} more)` : head.join(", ");
}

export function SettingsActivityWidget(props: SettingsActivityWidgetProps) {
  const { user, isLoading } = useAuth();
  const csrfToken = safeString((user as any)?.csrfToken || "").trim() || null;
  const enableActiveGuildSwitch = props.enableActiveGuildSwitch ?? true;

  const client = useMemo(
    () => createWebCentralSettingsClient({ csrfToken }),
    [csrfToken],
  );

  const userScopeId = useMemo(() => {
    if (props.scopeType !== "user") return null;
    if (props.scopeId) return safeString(props.scopeId).trim() || null;
    if (isLoading) return null;
    return resolveUserId(user as any);
  }, [isLoading, props.scopeId, props.scopeType, user]);

  const guildScopeId = useMemo(() => {
    if (props.scopeType !== "guild") return null;
    return safeString(props.scopeId).trim() || null;
  }, [props.scopeId, props.scopeType]);

  const [activeGuildId, setActiveGuildId] = useState<string>("");
  const [activeGuildLoadError, setActiveGuildLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!enableActiveGuildSwitch) return;
    if (props.scopeType !== "user") return;
    if (!userScopeId) return;

    let cancelled = false;
    (async () => {
      setActiveGuildLoadError(null);
      const res = await client.getUserSettings(userScopeId);
      if (cancelled) return;
      if (!res.ok || !res.data?.ok) {
        setActiveGuildLoadError("Failed to load UserSettings (activeGuildId)");
        return;
      }
      const settings = res.data.settings as Record<string, unknown>;
      const v = settings["activeGuildId"];
      setActiveGuildId(typeof v === "string" ? v : "");
    })().catch(() => {
      if (cancelled) return;
      setActiveGuildLoadError("Failed to load UserSettings (activeGuildId)");
    });

    return () => {
      cancelled = true;
    };
  }, [client, enableActiveGuildSwitch, props.scopeType, userScopeId]);

  const [view, setView] = useState<"user" | "activeGuild">(props.defaultView ?? "user");

  const effectiveScopeType: ScopeType = useMemo(() => {
    if (props.scopeType === "guild") return "guild";
    if (!enableActiveGuildSwitch) return "user";
    if (view === "activeGuild" && activeGuildId.trim()) return "guild";
    return "user";
  }, [activeGuildId, enableActiveGuildSwitch, props.scopeType, view]);

  const effectiveScopeId = useMemo(() => {
    if (effectiveScopeType === "guild") return props.scopeType === "guild" ? guildScopeId : activeGuildId.trim() || null;
    return userScopeId;
  }, [activeGuildId, effectiveScopeType, guildScopeId, props.scopeType, userScopeId]);

  const viewAllHref = useMemo(() => {
    if (effectiveScopeType === "user") return "/settings";
    if (!effectiveScopeId) return "/club";
    return `/club/${encodeURIComponent(effectiveScopeId)}/settings`;
  }, [effectiveScopeId, effectiveScopeType]);

  const [events, setEvents] = useState<SettingsChangeEventV0[] | null>(null);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchedAtMs, setLastFetchedAtMs] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SettingsChangeEventV0 | null>(null);
  const [guildIdentityMap, setGuildIdentityMap] = useState<Record<string, { id: string; name: string; iconUrl?: string }> | null>(null);
  const [guildIdentityError, setGuildIdentityError] = useState<string | null>(null);

  useEffect(() => {
    const needsGuildIdentity =
      effectiveScopeType === "guild" || !!events?.some((e) => e.scopeType === "guild");

    if (!needsGuildIdentity) {
      setGuildIdentityMap(null);
      setGuildIdentityError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setGuildIdentityError(null);
      const map = await getGuildIdentityMap();
      if (cancelled) return;
      setGuildIdentityMap(map);
    })().catch((err) => {
      if (cancelled) return;
      setGuildIdentityError(safeString((err as any)?.message) || "guild_identity_load_failed");
    });

    return () => {
      cancelled = true;
    };
  }, [effectiveScopeType, events]);

  const lastSeenKey = useMemo(() => {
    if (!effectiveScopeId) return null;
    return activityLastSeenStorageKeyV1(effectiveScopeType, effectiveScopeId);
  }, [effectiveScopeId, effectiveScopeType]);

  const [lastSeenId, setLastSeenId] = useState<number | null>(null);

  useEffect(() => {
    if (!lastSeenKey) {
      setLastSeenId(null);
      return;
    }
    setLastSeenId(readLastSeenId(lastSeenKey));
  }, [lastSeenKey]);

  const limit = typeof props.limit === "number" && props.limit > 0 ? Math.min(props.limit, 50) : 10;

  const refresh = useCallback(async () => {
    if (!effectiveScopeId) return;
    setIsRefreshing(true);
    setError(null);
    setSelectedEvent(null);

    const res = await client.listSettingsChangesV0({
      scopeType: effectiveScopeType,
      scopeId: effectiveScopeId,
      limit,
    });

    if (!res.ok) {
      setFetchStatus({ ok: false, status: res.status, error: safeString(res.error) || "request_failed" });
      setError("Failed to load settings activity");
      setIsRefreshing(false);
      return;
    }

    setFetchStatus({ ok: true, status: res.status });
    setEvents(Array.isArray(res.data.events) ? res.data.events : []);
    setLastFetchedAtMs(Date.now());
    setIsRefreshing(false);
  }, [client, effectiveScopeId, effectiveScopeType, limit]);

  useEffect(() => {
    if (!effectiveScopeId) return;
    void refresh();
  }, [effectiveScopeId, refresh]);

  const maxEventId = useMemo(() => {
    const list = events ?? [];
    let max = -1;
    for (const e of list) {
      if (typeof (e as any)?.id === "number" && (e as any).id > max) max = (e as any).id;
    }
    return max >= 0 ? max : null;
  }, [events]);

  const newEventCount = useMemo(() => {
    if (!events?.length) return 0;
    if (typeof lastSeenId !== "number") return events.length;
    return events.filter((e) => e.id > lastSeenId).length;
  }, [events, lastSeenId]);

  const markAsSeen = useCallback(() => {
    if (!lastSeenKey) return;
    if (typeof maxEventId !== "number") return;
    writeLastSeenId(lastSeenKey, maxEventId);
    setLastSeenId(maxEventId);
  }, [lastSeenKey, maxEventId]);

  const resolveGuildDisplay = useCallback(
    (guildId: string) => {
      const id = safeString(guildId).trim();
      if (!id) return { name: "Guild (unknown)", iconUrl: undefined as string | undefined, isKnown: false, id: "" };
      const identity = guildIdentityMap?.[id];
      if (identity) return { name: identity.name, iconUrl: identity.iconUrl, isKnown: true, id };
      return { name: `Guild ${id}`, iconUrl: undefined as string | undefined, isKnown: false, id };
    },
    [guildIdentityMap],
  );

  const scopeLabel = useMemo(() => {
    if (effectiveScopeType === "user") return "You";
    const guild = resolveGuildDisplay(safeString(effectiveScopeId));
    const prefix = props.scopeType === "guild" ? "Guild" : "Active Club";
    return `${prefix}: ${guild.name}`;
  }, [effectiveScopeId, effectiveScopeType, props.scopeType, resolveGuildDisplay]);

  const scopeSecondary = useMemo(() => {
    if (effectiveScopeType !== "guild") return null;
    const guild = resolveGuildDisplay(safeString(effectiveScopeId));
    if (guild.isKnown) return null;
    return guild.id || null;
  }, [effectiveScopeId, effectiveScopeType, resolveGuildDisplay]);

  const debug = useMemo(() => {
    return {
      widgetScopeType: props.scopeType,
      widgetScopeId: props.scopeId ?? null,
      view,
      enableActiveGuildSwitch,
      userScopeId,
      activeGuildId: activeGuildId || null,
      activeGuildLoadError,
      effectiveScopeType,
      effectiveScopeId,
      scopeSecondary,
      limit,
      eventsCount: events?.length ?? null,
      lastFetchedAtMs,
      fetchStatus,
      guildIdentityCount: guildIdentityMap ? Object.keys(guildIdentityMap).length : null,
      guildIdentityError,
    };
  }, [
    activeGuildId,
    activeGuildLoadError,
    effectiveScopeId,
    effectiveScopeType,
    enableActiveGuildSwitch,
    events?.length,
    fetchStatus,
    guildIdentityError,
    guildIdentityMap,
    lastFetchedAtMs,
    limit,
    props.scopeId,
    props.scopeType,
    scopeSecondary,
    userScopeId,
    view,
  ]);

  return (
    <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Settings Activity</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Recent settings changes • {scopeLabel}
            </CardDescription>
            {effectiveScopeType === "guild" && effectiveScopeId ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {(() => {
                  const g = resolveGuildDisplay(effectiveScopeId);
                  return (
                    <>
                      {g.iconUrl ? (
                        <img
                          src={g.iconUrl}
                          alt=""
                          className="h-6 w-6 rounded border border-zinc-700 object-cover"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded border border-zinc-700 bg-zinc-900" />
                      )}
                      <div className="text-xs text-zinc-200">
                        <span className="font-medium">{g.name}</span>
                        {scopeSecondary ? (
                          <span className="ml-2 font-mono text-zinc-500">({scopeSecondary})</span>
                        ) : null}
                      </div>
                      {guildIdentityError ? (
                        <div className="text-xs text-red-300">{guildIdentityError}</div>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            ) : null}
            {props.scopeType === "user" && enableActiveGuildSwitch ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="text-xs text-zinc-400">Scope</label>
                <select
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                  value={view}
                  onChange={(e) => setView(e.target.value === "activeGuild" ? "activeGuild" : "user")}
                  disabled={!userScopeId}
                >
                  <option value="user">User</option>
                  <option value="activeGuild" disabled={!activeGuildId.trim()}>
                    Active Club
                  </option>
                </select>
                {!activeGuildId.trim() ? (
                  <div className="text-xs text-zinc-400">
                    No active club selected.{" "}
                    <Link href="/settings" className="underline">
                      Set it in settings
                    </Link>
                    .
                  </div>
                ) : null}
                {activeGuildLoadError ? (
                  <div className="text-xs text-red-300">{activeGuildLoadError}</div>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {events !== null ? (
              <Badge variant="secondary" className="text-xs">
                {events.length} shown
              </Badge>
            ) : null}
            {typeof newEventCount === "number" && newEventCount > 0 && (
              <Badge className="bg-emerald-600">{newEventCount} new</Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              disabled={isRefreshing || !effectiveScopeId}
            >
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={markAsSeen}
              disabled={!effectiveScopeId || !events?.length}
            >
              Mark as seen
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={viewAllHref}>View all</Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {!userScopeId && props.scopeType === "user" && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-950/40 p-3 text-sm text-zinc-200">
            Sign in to view user settings activity.
          </div>
        )}

        {!guildScopeId && props.scopeType === "guild" && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-950/40 p-3 text-sm text-zinc-200">
            Select a guild to view activity.
          </div>
        )}

        {effectiveScopeId && events === null && (
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-3 text-sm text-red-200">
            <div className="font-medium">Error</div>
            <div className="mt-1 whitespace-pre-wrap">{error}</div>
            <div className="mt-2 text-xs text-red-200/90">
              <Link href={viewAllHref} className="underline">
                Open settings
              </Link>
            </div>
          </div>
        )}

        {effectiveScopeId && events !== null && events.length === 0 && !error && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-950/40 p-3 text-sm text-zinc-200">
            <div>No recent settings changes.</div>
            <div className="mt-2 text-xs text-zinc-400">
              <Link href={viewAllHref} className="underline">
                Open settings
              </Link>
            </div>
          </div>
        )}

        {effectiveScopeId && events?.length ? (
          <div className="space-y-2">
            {events.map((e) => {
              const isNew = typeof lastSeenId === "number" ? e.id > lastSeenId : true;
              const linkHref =
                e.scopeType === "guild"
                  ? `/club/${encodeURIComponent(e.scopeId)}/settings`
                  : "/settings";

              return (
                <div
                  key={e.id}
                  className="flex flex-col gap-2 rounded-xl border border-zinc-700 bg-zinc-950/40 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-xs text-zinc-400">{formatEventTimestamp(e.createdAt)}</div>
                      {isNew && <Badge className="bg-emerald-700">NEW</Badge>}
                      <Badge variant="secondary" className="text-xs">
                        {e.kind}
                      </Badge>
                      {e.source && (
                        <Badge variant="outline" className="text-xs">
                          {e.source}
                        </Badge>
                      )}
                      {e.actorIsAdmin && <Badge className="bg-purple-700 text-xs">admin</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedEvent(e)}>
                        Details
                      </Button>
                      <Button asChild variant="secondary" size="sm">
                        <Link href={linkHref}>Open</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-200">
                    <span className="text-zinc-400">Scope:</span>
                    {e.scopeType === "guild" ? (
                      (() => {
                        const g = resolveGuildDisplay(e.scopeId);
                        return (
                          <>
                            {g.iconUrl ? (
                              <img
                                src={g.iconUrl}
                                alt=""
                                className="h-5 w-5 rounded border border-zinc-700 object-cover"
                              />
                            ) : (
                              <div className="h-5 w-5 rounded border border-zinc-700 bg-zinc-900" />
                            )}
                            <span className="font-medium">{g.name}</span>
                            {!g.isKnown && g.id ? (
                              <span className="font-mono text-xs text-zinc-500">({g.id})</span>
                            ) : null}
                          </>
                        );
                      })()
                    ) : (
                      <span className="font-medium">You</span>
                    )}
                  </div>

                  <div className="text-sm text-zinc-200">
                    <span className="text-zinc-400">Actor:</span> {e.actorUserId}
                  </div>
                  <div className="text-sm text-zinc-200">
                    <span className="text-zinc-400">Changed:</span> {summarizeChangedKeys(e.changedKeys)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {selectedEvent && (
          <div className="rounded-2xl border border-emerald-500/30 bg-zinc-950/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-medium text-zinc-100">Audit detail</div>
                <div className="text-xs text-zinc-400">Event #{selectedEvent.id}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
            <div className="mt-3">
              <CopyBox
                content={JSON.stringify(selectedEvent, null, 2)}
                label="Raw event JSON"
              />
            </div>
          </div>
        )}

	        <div className="rounded-xl border border-zinc-700 bg-zinc-950/40 p-3 text-xs text-zinc-300">
	          <div className="font-medium text-zinc-200">Debug</div>
	          <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
	            <div>widgetScopeType: {debug.widgetScopeType}</div>
	            <div>widgetScopeId: {debug.widgetScopeId ?? "(none)"}</div>
	            <div>view: {debug.view}</div>
	            <div>activeGuildId: {debug.activeGuildId ?? "(none)"}</div>
	            <div>activeGuildLoadError: {debug.activeGuildLoadError ?? "(none)"}</div>
	            <div>effectiveScopeType: {debug.effectiveScopeType}</div>
	            <div>effectiveScopeId: {debug.effectiveScopeId ?? "(none)"}</div>
	            <div>scopeSecondary: {debug.scopeSecondary ?? "(none)"}</div>
	            <div>limit: {debug.limit}</div>
	            <div>events: {debug.eventsCount ?? "(loading)"}</div>
	            <div>guildIdentityCount: {debug.guildIdentityCount ?? "(loading)"}</div>
	            <div>guildIdentityError: {debug.guildIdentityError ?? "(none)"}</div>
	            <div>
	              lastFetch:{" "}
	              {typeof debug.lastFetchedAtMs === "number"
	                ? new Date(debug.lastFetchedAtMs).toLocaleTimeString()
	                : "(never)"}
            </div>
            <div>
              status:{" "}
              {debug.fetchStatus
                ? debug.fetchStatus.ok
                  ? debug.fetchStatus.status
                  : `${debug.fetchStatus.status} (${debug.fetchStatus.error})`
                : "(none)"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
