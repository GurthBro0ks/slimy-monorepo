"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth/context";
import { createWebCentralSettingsClient } from "@/lib/api/central-settings-client";
import * as contracts from "@slimy/contracts";

export default function SettingsPage() {
  const { user, isLoading } = useAuth();

  const userId = useMemo(() => {
    const raw = (user as any)?.discordId || (user as any)?.id || (user as any)?.sub || "";
    return String(raw || "").trim() || null;
  }, [user]);

  const client = useMemo(
    () => createWebCentralSettingsClient({ csrfToken: (user as any)?.csrfToken }),
    [user],
  );

  const [rawJson, setRawJson] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<{ ok: boolean; status: number; error?: string } | null>(null);
  const [lastFetchAt, setLastFetchAt] = useState<number | null>(null);

  const [eventsSinceId, setEventsSinceId] = useState<number | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [memory, setMemory] = useState<any[]>([]);

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
    const theme = typeof prefs?.theme === "string" ? prefs.theme : "";
    const chat = prefs?.chat || {};
    const markdown = typeof chat?.markdown === "boolean" ? (chat.markdown ? "true" : "false") : "unset";
    const profanityFilter = typeof chat?.profanityFilter === "boolean" ? (chat.profanityFilter ? "true" : "false") : "unset";
    const snail = prefs?.snail || {};
    const avatarId = typeof snail?.avatarId === "string" ? snail.avatarId : "";
    const vibe = typeof snail?.vibe === "string" ? snail.vibe : "";
    const loreFlags = Array.isArray(snail?.loreFlags) ? snail.loreFlags.filter((v: any) => typeof v === "string") : [];

    return { theme, markdown, profanityFilter, avatarId, vibe, loreFlagsText: loreFlags.join(", ") };
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
    if (!userId) return;
    setError(null);

    const res = await client.getUserSettings(userId);
    if (!res.ok) {
      setLastStatus({ ok: false, status: res.status, error: String(res.error || "request_failed") });
      setError("Failed to load user settings");
      return;
    }
    if (!res.data?.ok) {
      setLastStatus({ ok: false, status: res.status, error: "upstream_not_ok" });
      setError("Failed to load user settings");
      return;
    }

    setLastStatus({ ok: true, status: res.status });
    setLastFetchAt(Date.now());
    setRawJson(JSON.stringify(res.data.settings, null, 2));
  }, [client, userId]);

  const saveSettings = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);

    try {
      const parsed = JSON.parse(rawJson);
      const candidate = {
        ...(parsed || {}),
        userId,
        version: typeof parsed?.version === "number" ? parsed.version : contracts.SETTINGS_VERSION_V0,
        updatedAt: new Date().toISOString(),
        prefs: typeof parsed?.prefs === "object" && parsed?.prefs ? parsed.prefs : {},
      };

      const validated = contracts.UserSettingsSchema.safeParse(candidate);
      if (!validated.success) {
        const msg = validated.error.issues
          .slice(0, 15)
          .map((issue) => `${issue.path.join(".") || "value"}: ${issue.message}`)
          .join("\n");
        setLastStatus({ ok: false, status: 400, error: "contracts_validation_failed" });
        setError(msg || "Validation failed");
        return;
      }

      const res = await client.setUserSettings(userId, validated.data as any);
      if (!res.ok) {
        setLastStatus({ ok: false, status: res.status, error: String(res.error || "request_failed") });
        setError("Failed to save user settings");
        return;
      }
      if (!res.data?.ok) {
        setLastStatus({ ok: false, status: res.status, error: "upstream_not_ok" });
        setError("Failed to save user settings");
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
  }, [client, rawJson, userId]);

  const checkEvents = useCallback(async () => {
    if (!userId) return;
    setError(null);

    const res = await client.listSettingsChangesV0({
      scopeType: "user",
      scopeId: userId,
      sinceId: eventsSinceId ?? undefined,
      limit: contracts.SETTINGS_CHANGES_DEFAULT_LIMIT,
    });

    if (!res.ok) {
      setLastStatus({ ok: false, status: res.status, error: String(res.error || "request_failed") });
      setError("Failed to load change events");
      return;
    }

    setLastStatus({ ok: true, status: res.status });
    setEvents(res.data.events);
    setEventsSinceId(res.data.nextSinceId ?? eventsSinceId);
  }, [client, eventsSinceId, userId]);

  const loadMemory = useCallback(async () => {
    if (!userId) return;
    setError(null);

    const res = await client.listMemory("user", userId);
    if (!res.ok) {
      setLastStatus({ ok: false, status: res.status, error: String(res.error || "request_failed") });
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
  }, [client, userId]);

  useEffect(() => {
    if (!isLoading && userId) loadSettings().catch(() => {});
  }, [isLoading, userId, loadSettings]);

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
          <AlertDescription>Sign in to view and edit your settings.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusText = lastStatus
    ? lastStatus.ok
      ? `OK ${lastStatus.status}`
      : `ERR ${lastStatus.status} (${lastStatus.error || "error"})`
    : "—";

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">User Settings</h1>
        <p className="text-muted-foreground">Central `UserSettings` for your account.</p>
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
                <label className="text-sm font-medium">Theme</label>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={basicValues?.theme || ""}
                  onChange={(e) => {
                    const next = e.target.value;
                    applyBasicUpdate((draft) => {
                      draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
                      if (!next) delete draft.prefs.theme;
                      else draft.prefs.theme = next;
                    });
                  }}
                >
                  <option value="">(unset)</option>
                  <option value="system">system</option>
                  <option value="neon">neon</option>
                  <option value="classic">classic</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-center">
                <label className="text-sm font-medium">Chat markdown</label>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={basicValues?.markdown || "unset"}
                  onChange={(e) => {
                    const next = e.target.value;
                    applyBasicUpdate((draft) => {
                      draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
                      const chat = typeof draft.prefs.chat === "object" && draft.prefs.chat ? { ...draft.prefs.chat } : {};
                      if (next === "unset") delete chat.markdown;
                      else chat.markdown = next === "true";
                      if (Object.keys(chat).length) draft.prefs.chat = chat;
                      else delete draft.prefs.chat;
                    });
                  }}
                >
                  <option value="unset">(unset)</option>
                  <option value="true">enabled</option>
                  <option value="false">disabled</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-center">
                <label className="text-sm font-medium">Profanity filter</label>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={basicValues?.profanityFilter || "unset"}
                  onChange={(e) => {
                    const next = e.target.value;
                    applyBasicUpdate((draft) => {
                      draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
                      const chat = typeof draft.prefs.chat === "object" && draft.prefs.chat ? { ...draft.prefs.chat } : {};
                      if (next === "unset") delete chat.profanityFilter;
                      else chat.profanityFilter = next === "true";
                      if (Object.keys(chat).length) draft.prefs.chat = chat;
                      else delete draft.prefs.chat;
                    });
                  }}
                >
                  <option value="unset">(unset)</option>
                  <option value="true">enabled</option>
                  <option value="false">disabled</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-center">
                <label className="text-sm font-medium">Snail avatarId</label>
                <input
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={basicValues?.avatarId || ""}
                  onChange={(e) => {
                    const next = e.target.value;
                    applyBasicUpdate((draft) => {
                      draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
                      const snail = typeof draft.prefs.snail === "object" && draft.prefs.snail ? { ...draft.prefs.snail } : {};
                      if (!next) delete snail.avatarId;
                      else snail.avatarId = next;
                      if (Object.keys(snail).length) draft.prefs.snail = snail;
                      else delete draft.prefs.snail;
                    });
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-center">
                <label className="text-sm font-medium">Snail vibe</label>
                <input
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={basicValues?.vibe || ""}
                  onChange={(e) => {
                    const next = e.target.value;
                    applyBasicUpdate((draft) => {
                      draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
                      const snail = typeof draft.prefs.snail === "object" && draft.prefs.snail ? { ...draft.prefs.snail } : {};
                      if (!next) delete snail.vibe;
                      else snail.vibe = next;
                      if (Object.keys(snail).length) draft.prefs.snail = snail;
                      else delete draft.prefs.snail;
                    });
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-center">
                <label className="text-sm font-medium">Snail loreFlags (comma-separated)</label>
                <input
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={basicValues?.loreFlagsText || ""}
                  onChange={(e) => {
                    const next = e.target.value;
                    applyBasicUpdate((draft) => {
                      const flags = next
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);

                      draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
                      const snail = typeof draft.prefs.snail === "object" && draft.prefs.snail ? { ...draft.prefs.snail } : {};
                      if (!flags.length) delete snail.loreFlags;
                      else snail.loreFlags = flags;
                      if (Object.keys(snail).length) draft.prefs.snail = snail;
                      else delete draft.prefs.snail;
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
          <CardTitle>UserSettings JSON</CardTitle>
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
          <CardDescription>Lists up to 100 records for your user scope.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => loadMemory()} variant="secondary">
            Load memory
          </Button>
          <div className="space-y-2">
            {(memory || []).length ? (
              (memory || []).map((rec: any, idx: number) => {
                const content = rec?.content && typeof rec.content === "object" ? rec.content : {};
                const preview = JSON.stringify(content).slice(0, 200);
                return (
                  <div key={`${rec.kind}-${rec.updatedAt}-${idx}`} className="rounded-md border p-3 text-sm">
                    <div className="font-mono">{rec.kind}</div>
                    <div className="text-muted-foreground">
                      {rec.updatedAt} • source {rec.source}
                    </div>
                    <div className="mt-1 font-mono text-xs break-words">
                      {preview}
                      {preview.length >= 200 ? "…" : ""}
                    </div>
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
            admin-api base: <span className="font-mono">/api</span> (rewrite proxy)
          </div>
          <div>
            scope: <span className="font-mono">user:{userId}</span>
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
