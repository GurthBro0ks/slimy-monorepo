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

import type { SettingsChangeEventV0 } from "@slimy/admin-api-client";

type ScopeType = "user" | "guild";

export type SettingsActivityWidgetProps = {
  scopeType: ScopeType;
  scopeId?: string;
  limit?: number;
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

  const client = useMemo(
    () => createWebCentralSettingsClient({ csrfToken }),
    [csrfToken],
  );

  const resolvedScopeId = useMemo(() => {
    if (props.scopeType === "guild") return safeString(props.scopeId).trim() || null;
    if (props.scopeId) return safeString(props.scopeId).trim() || null;
    if (isLoading) return null;
    return resolveUserId(user as any);
  }, [isLoading, props.scopeId, props.scopeType, user]);

  const viewAllHref = useMemo(() => {
    if (props.scopeType === "user") return "/settings";
    if (!resolvedScopeId) return "/club";
    return `/club/${encodeURIComponent(resolvedScopeId)}/settings`;
  }, [props.scopeType, resolvedScopeId]);

  const [events, setEvents] = useState<SettingsChangeEventV0[] | null>(null);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchedAtMs, setLastFetchedAtMs] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SettingsChangeEventV0 | null>(null);

  const lastSeenKey = useMemo(() => {
    if (!resolvedScopeId) return null;
    return activityLastSeenStorageKeyV1(props.scopeType, resolvedScopeId);
  }, [props.scopeType, resolvedScopeId]);

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
    if (!resolvedScopeId) return;
    setIsRefreshing(true);
    setError(null);
    setSelectedEvent(null);

    const res = await client.listSettingsChangesV0({
      scopeType: props.scopeType,
      scopeId: resolvedScopeId,
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
  }, [client, limit, props.scopeType, resolvedScopeId]);

  useEffect(() => {
    if (props.scopeType === "user" && !resolvedScopeId) return;
    if (props.scopeType === "guild" && !resolvedScopeId) return;
    void refresh();
  }, [props.scopeType, refresh, resolvedScopeId]);

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

  const scopeLabel = useMemo(() => {
    if (props.scopeType === "user") return "User";
    return resolvedScopeId ? `Guild: ${resolvedScopeId}` : "Guild";
  }, [props.scopeType, resolvedScopeId]);

  const debug = useMemo(() => {
    return {
      scopeType: props.scopeType,
      scopeId: resolvedScopeId,
      limit,
      eventsCount: events?.length ?? null,
      lastFetchedAtMs,
      fetchStatus,
    };
  }, [events?.length, fetchStatus, lastFetchedAtMs, limit, props.scopeType, resolvedScopeId]);

  return (
    <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Settings Activity</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Recent settings changes • {scopeLabel}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {typeof newEventCount === "number" && newEventCount > 0 && (
              <Badge className="bg-emerald-600">{newEventCount} new</Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              disabled={isRefreshing || !resolvedScopeId}
            >
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={markAsSeen}
              disabled={!resolvedScopeId || !events?.length}
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
        {!resolvedScopeId && props.scopeType === "user" && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-950/40 p-3 text-sm text-zinc-200">
            Sign in to view user settings activity.
          </div>
        )}

        {!resolvedScopeId && props.scopeType === "guild" && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-950/40 p-3 text-sm text-zinc-200">
            Select a guild to view activity.
          </div>
        )}

        {resolvedScopeId && events === null && (
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
          </div>
        )}

        {resolvedScopeId && events !== null && events.length === 0 && !error && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-950/40 p-3 text-sm text-zinc-200">
            No recent settings changes.
          </div>
        )}

        {resolvedScopeId && events?.length ? (
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
            <div>scopeType: {debug.scopeType}</div>
            <div>scopeId: {debug.scopeId ?? "(none)"}</div>
            <div>limit: {debug.limit}</div>
            <div>events: {debug.eventsCount ?? "(loading)"}</div>
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
