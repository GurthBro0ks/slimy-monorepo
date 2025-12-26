"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth/context";
import { createWebCentralSettingsClient } from "@/lib/api/central-settings-client";
import * as contracts from "@slimy/contracts";

type Status = { ok: true; status: number } | { ok: false; status: number; error: string };

function safeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return String(value);
}

function resolveUserId(user: any): string | null {
  return safeString(user?.discordId || user?.id || user?.sub || "").trim() || null;
}

function formatZodIssues(issues: any): string {
  if (!Array.isArray(issues)) return "Validation failed";
  return issues
    .slice(0, 15)
    .map((issue) => `${Array.isArray(issue.path) ? issue.path.join(".") : "value"}: ${issue.message}`)
    .join("\n");
}

export default function WebGuildSettingsPage() {
  const params = useParams();
  const guildId = useMemo(() => safeString((params as any)?.guildId).trim(), [params]);
  const { user, isLoading } = useAuth();
  const userId = useMemo(() => resolveUserId(user), [user]);

  const client = useMemo(
    () => createWebCentralSettingsClient({ csrfToken: (user as any)?.csrfToken }),
    [user],
  );

  const [rawJson, setRawJson] = useState<string>("");
  const [eventsSinceId, setEventsSinceId] = useState<number | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [memory, setMemory] = useState<any[]>([]);

  const [lastStatus, setLastStatus] = useState<Status | null>(null);
  const [lastFetchAt, setLastFetchAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsedJson = useMemo(() => {
    const text = rawJson.trim();
    if (!text) return { ok: false as const, error: "empty_json" };
    try {
      return { ok: true as const, value: JSON.parse(text) };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ? `invalid_json: ${e.message}` : "invalid_json" };
    }
  }, [rawJson]);

  const basicEnabled = parsedJson.ok && typeof parsedJson.value === "object" && parsedJson.value !== null;
  const basicValues = useMemo(() => {
    if (!basicEnabled) return null;
    const prefs = (parsedJson.value as any)?.prefs || {};
    const widget = prefs?.widget || {};
    const widgetEnabled = typeof widget?.enabled === "boolean" ? (widget.enabled ? "true" : "false") : "unset";
    const botEnabled = typeof prefs?.botEnabled === "boolean" ? (prefs.botEnabled ? "true" : "false") : "unset";
    const channels = prefs?.channels || {};
    const adminLogChannelId = typeof channels?.adminLogChannelId === "string" ? channels.adminLogChannelId : "";
    const globalChatChannelId = typeof channels?.globalChatChannelId === "string" ? channels.globalChatChannelId : "";
    return { widgetEnabled, botEnabled, adminLogChannelId, globalChatChannelId };
  }, [basicEnabled, parsedJson]);

  const applyBasicUpdate = useCallback(
    (updater: (draft: any) => void) => {
      if (!basicEnabled) return;
      const draft = JSON.parse(JSON.stringify(parsedJson.value));
      updater(draft);
      setRawJson(JSON.stringify(draft, null, 2));
    },
    [basicEnabled, parsedJson],
  );

  const loadSettings = useCallback(async () => {
    if (!guildId) return;
    setError(null);

    const res = await client.getGuildSettings(guildId);
    if (!res.ok) {
      setLastStatus({ ok: false, status: res.status, error: safeString(res.error) || "request_failed" });
      setError("Failed to load guild settings");
      return;
    }
    if (!res.data?.ok) {
      setLastStatus({ ok: false, status: res.status, error: "upstream_not_ok" });
      setError("Failed to load guild settings");
      return;
    }

    setLastStatus({ ok: true, status: res.status });
    setLastFetchAt(Date.now());
    setRawJson(JSON.stringify(res.data.settings, null, 2));
  }, [client, guildId]);

  const saveSettings = useCallback(async () => {
    if (!guildId) return;
    setSaving(true);
    setError(null);

    try {
      const parsed = JSON.parse(rawJson);
      const candidate = {
        ...(parsed || {}),
        guildId,
        version: typeof parsed?.version === "number" ? parsed.version : contracts.SETTINGS_VERSION_V0,
        updatedAt: new Date().toISOString(),
        prefs: typeof parsed?.prefs === "object" && parsed?.prefs ? parsed.prefs : {},
      };

      const validated = contracts.GuildSettingsSchema.safeParse(candidate);
      if (!validated.success) {
        setError(formatZodIssues(validated.error.issues));
        setLastStatus({ ok: false, status: 400, error: "contracts_validation_failed" });
        return;
      }

      const res = await client.setGuildSettings(guildId, validated.data as any);
      if (!res.ok) {
        setLastStatus({ ok: false, status: res.status, error: safeString(res.error) || "request_failed" });
        setError("Failed to save guild settings");
        return;
      }
      if (!res.data?.ok) {
        setLastStatus({ ok: false, status: res.status, error: "upstream_not_ok" });
        setError("Failed to save guild settings");
        return;
      }

      setLastStatus({ ok: true, status: res.status });
      setLastFetchAt(Date.now());
      setRawJson(JSON.stringify(res.data.settings, null, 2));
    } catch (err: any) {
      setLastStatus({ ok: false, status: 400, error: "invalid_json" });
      setError(err?.message ? `Invalid JSON: ${err.message}` : "Invalid JSON");
    } finally {
      setSaving(false);
    }
  }, [client, guildId, rawJson]);

  const checkEvents = useCallback(async () => {
    if (!guildId) return;
    setError(null);

    const res = await client.listSettingsChangesV0({
      scopeType: "guild",
      scopeId: guildId,
      sinceId: eventsSinceId ?? undefined,
      limit: contracts.SETTINGS_CHANGES_DEFAULT_LIMIT,
    });

    if (!res.ok) {
      setLastStatus({ ok: false, status: res.status, error: safeString(res.error) || "request_failed" });
      setError("Failed to load change events");
      return;
    }

    setLastStatus({ ok: true, status: res.status });
    setEvents(res.data.events);
    setEventsSinceId(res.data.nextSinceId ?? eventsSinceId);
  }, [client, eventsSinceId, guildId]);

  const loadMemory = useCallback(async () => {
    if (!guildId) return;
    setError(null);

    const res = await client.listMemory("guild", guildId);
    if (!res.ok) {
      setLastStatus({ ok: false, status: res.status, error: safeString(res.error) || "request_failed" });
      setError("Failed to load memory");
      return;
    }
    if (!res.data?.ok) {
      setLastStatus({ ok: false, status: res.status, error: "upstream_not_ok" });
      setError("Failed to load memory");
      return;
    }

    setLastStatus({ ok: true, status: res.status });
    setMemory(res.data.records || []);
  }, [client, guildId]);

  useEffect(() => {
    if (!isLoading && user) loadSettings().catch(() => {});
  }, [isLoading, user, loadSettings]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="container max-w-4xl py-8 space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Not signed in</AlertTitle>
          <AlertDescription>Sign in to view and edit guild settings.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!guildId) {
    return (
      <div className="container max-w-4xl py-8 space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Missing guildId</AlertTitle>
          <AlertDescription>Open this page as `/club/&lt;guildId&gt;/settings`.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const adminApiBase = "/api";
  const statusText = lastStatus
    ? lastStatus.ok
      ? `OK ${lastStatus.status}`
      : `ERR ${lastStatus.status} (${lastStatus.error})`
    : "—";

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Guild Settings</h1>
        <p className="text-muted-foreground">Central `GuildSettings` for guildId: {guildId}</p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Basic Settings (v0.31)</CardTitle>
          <CardDescription>These controls update the JSON editor below (schema: `@slimy/contracts`).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!basicEnabled ? (
            <div className="text-sm text-muted-foreground">
              Basic controls are disabled until the JSON editor contains valid JSON. ({parsedJson.ok ? "—" : parsedJson.error})
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-center">
                <label className="text-sm font-medium">Widget enabled</label>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={basicValues?.widgetEnabled || "unset"}
                  onChange={(e) => {
                    const next = e.target.value;
                    applyBasicUpdate((draft) => {
                      draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
                      const widget = typeof draft.prefs.widget === "object" && draft.prefs.widget ? { ...draft.prefs.widget } : {};
                      if (next === "unset") delete widget.enabled;
                      else widget.enabled = next === "true";
                      if (Object.keys(widget).length) draft.prefs.widget = widget;
                      else delete draft.prefs.widget;
                    });
                  }}
                >
                  <option value="unset">(unset)</option>
                  <option value="true">enabled</option>
                  <option value="false">disabled</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-center">
                <label className="text-sm font-medium">Bot enabled</label>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={basicValues?.botEnabled || "unset"}
                  onChange={(e) => {
                    const next = e.target.value;
                    applyBasicUpdate((draft) => {
                      draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
                      if (next === "unset") delete draft.prefs.botEnabled;
                      else draft.prefs.botEnabled = next === "true";
                    });
                  }}
                >
                  <option value="unset">(unset)</option>
                  <option value="true">enabled</option>
                  <option value="false">disabled</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-center">
                <label className="text-sm font-medium">Admin log channel ID</label>
                <input
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={basicValues?.adminLogChannelId || ""}
                  onChange={(e) => {
                    const next = e.target.value.trim();
                    applyBasicUpdate((draft) => {
                      draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
                      const channels =
                        typeof draft.prefs.channels === "object" && draft.prefs.channels ? { ...draft.prefs.channels } : {};
                      if (!next) delete channels.adminLogChannelId;
                      else channels.adminLogChannelId = next;
                      if (Object.keys(channels).length) draft.prefs.channels = channels;
                      else delete draft.prefs.channels;
                    });
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-center">
                <label className="text-sm font-medium">Global chat channel ID</label>
                <input
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={basicValues?.globalChatChannelId || ""}
                  onChange={(e) => {
                    const next = e.target.value.trim();
                    applyBasicUpdate((draft) => {
                      draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
                      const channels =
                        typeof draft.prefs.channels === "object" && draft.prefs.channels ? { ...draft.prefs.channels } : {};
                      if (!next) delete channels.globalChatChannelId;
                      else channels.globalChatChannelId = next;
                      if (Object.keys(channels).length) draft.prefs.channels = channels;
                      else delete draft.prefs.channels;
                    });
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GuildSettings JSON</CardTitle>
          <CardDescription>Edits are validated with `@slimy/contracts` and saved via admin-api.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="w-full min-h-[320px] rounded-md border bg-background p-3 font-mono text-sm"
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            spellCheck={false}
          />
          <div className="flex gap-2">
            <Button onClick={() => loadSettings()} variant="secondary">
              Refresh
            </Button>
            <Button onClick={() => saveSettings()} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Events (optional)</CardTitle>
          <CardDescription>
            Cursor endpoint: `/api/settings/changes-v0` (limit default {contracts.SETTINGS_CHANGES_DEFAULT_LIMIT}, cap{" "}
            {contracts.SETTINGS_CHANGES_MAX_LIMIT}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button onClick={() => checkEvents()} variant="secondary">
              Check changes
            </Button>
            <div className="text-sm text-muted-foreground self-center">sinceId: {eventsSinceId ?? "null"}</div>
          </div>
          <div className="space-y-2">
            {(events || []).length ? (
              (events || []).map((ev: any) => (
                <div key={ev.id} className="rounded-md border p-3 text-sm">
                  <div className="font-mono">#{ev.id}</div>
                  <div className="text-muted-foreground">
                    {ev.createdAt} • {ev.kind} • actor {ev.actorUserId}
                  </div>
                  {Array.isArray(ev.changedKeys) && ev.changedKeys.length ? (
                    <div className="mt-1 font-mono text-xs">{ev.changedKeys.join(", ")}</div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No events loaded.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Memory (read-only)</CardTitle>
          <CardDescription>Lists up to 100 records for this guild scope.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => loadMemory()} variant="secondary">
            Load memory
          </Button>
          <div className="space-y-2">
            {(memory || []).length ? (
              (memory || []).map((rec: any, idx: number) => {
                const content = rec?.content && typeof rec.content === "object" ? rec.content : {};
                const preview = safeString(JSON.stringify(content)).slice(0, 200);
                return (
                  <div key={`${rec.kind}-${rec.updatedAt}-${idx}`} className="rounded-md border p-3 text-sm">
                    <div className="font-mono">{rec.kind}</div>
                    <div className="text-muted-foreground">
                      {rec.updatedAt} • source {rec.source}
                    </div>
                    <div className="mt-1 font-mono text-xs break-words">{preview}{preview.length >= 200 ? "…" : ""}</div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground">No memory loaded.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug / Status</CardTitle>
          <CardDescription>Temporary debug/status strip (remove later).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>
            admin-api base: <span className="font-mono">{adminApiBase}</span> (rewrite proxy)
          </div>
          <div>
            scope: <span className="font-mono">guild:{guildId}</span>
          </div>
          <div>
            userId: <span className="font-mono">{userId}</span>
          </div>
          <div>
            last status: <span className="font-mono">{statusText}</span>
          </div>
          <div>
            last fetch: <span className="font-mono">{lastFetchAt ? new Date(lastFetchAt).toISOString() : "—"}</span>
          </div>
          <div>
            last change cursor: <span className="font-mono">{eventsSinceId ?? "null"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
