"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyBox } from "@/components/ui/copy-box";
import { useAuth } from "@/lib/auth/context";
import { createWebCentralSettingsClient } from "@/lib/api/central-settings-client";
import * as contracts from "@slimy/contracts";

type ScopeType = "user" | "guild";

export type BasicFieldConfig = {
  id: string;
  label: string;
  kind: "select" | "text";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  getValue: (settings: any) => string;
  apply: (draft: any, nextValue: string) => void;
};

type Status = { ok: true; status: number } | { ok: false; status: number; error: string };

type SaveState = "idle" | "saving" | "saved" | "error";

type DiffSummary = {
  added: string[];
  removed: string[];
  changed: string[];
};

type ModalState =
  | null
  | {
      kind: "diff";
      pending: any;
      diff: DiffSummary;
      remoteChanged: boolean;
      remoteEventsPreview: any[];
      onConfirm: () => void;
    }
  | { kind: "reset"; onConfirm: () => void };

function safeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return String(value);
}

function resolveUserId(user: any): string | null {
  return safeString(user?.discordId || user?.id || user?.sub || "").trim() || null;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normalizeForStableJson(value: any): any {
  if (Array.isArray(value)) return value.map(normalizeForStableJson);
  if (value && typeof value === "object") {
    const out: any = {};
    for (const k of Object.keys(value).sort()) out[k] = normalizeForStableJson(value[k]);
    return out;
  }
  return value;
}

function stableJson(value: any): string {
  return JSON.stringify(normalizeForStableJson(value), null, 2);
}

function stripEphemeralFields(value: any): any {
  if (!value || typeof value !== "object") return value;
  const out: any = Array.isArray(value) ? value.slice() : { ...value };
  if (!Array.isArray(out)) delete out.updatedAt;
  return out;
}

function formatZodIssues(issues: any): string {
  if (!Array.isArray(issues) || !issues.length) return "Validation failed";
  return issues
    .slice(0, 25)
    .map((issue) => `${Array.isArray(issue.path) ? issue.path.join(".") || "value" : "value"}: ${issue.message}`)
    .join("\n");
}

function isObject(value: any): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function diffJsonPaths(before: any, after: any, path: string[] = []): DiffSummary {
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  const pushPath = (kind: keyof DiffSummary, p: string[]) => {
    const rendered = p.length ? p.join(".") : "value";
    (kind === "added" ? added : kind === "removed" ? removed : changed).push(rendered);
  };

  if (Array.isArray(before) || Array.isArray(after)) {
    if (!Array.isArray(before) || !Array.isArray(after)) {
      pushPath("changed", path);
      return { added, removed, changed };
    }
    if (before.length !== after.length) pushPath("changed", path.concat("length"));
    const len = Math.min(before.length, after.length);
    for (let i = 0; i < len; i++) {
      const next = diffJsonPaths(before[i], after[i], path.concat(`[${i}]`));
      added.push(...next.added);
      removed.push(...next.removed);
      changed.push(...next.changed);
    }
    if (after.length > before.length) pushPath("added", path.concat(`[${before.length}…]`));
    if (before.length > after.length) pushPath("removed", path.concat(`[${after.length}…]`));
    return { added, removed, changed };
  }

  if (!isObject(before) || !isObject(after)) {
    if (!Object.is(before, after)) pushPath("changed", path);
    return { added, removed, changed };
  }

  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
  for (const k of keys) {
    if (!(k in before)) {
      pushPath("added", path.concat(k));
      continue;
    }
    if (!(k in after)) {
      pushPath("removed", path.concat(k));
      continue;
    }
    const next = diffJsonPaths((before as any)[k], (after as any)[k], path.concat(k));
    added.push(...next.added);
    removed.push(...next.removed);
    changed.push(...next.changed);
  }
  return { added, removed, changed };
}

function renderModal(children: ReactNode, onClose: () => void) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-xl border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function SettingsEditor(props: {
  scopeType: ScopeType;
  scopeId?: string | null;
  title: string;
  description?: string;
  basicFieldsConfig: BasicFieldConfig[];
}) {
  const { user, isLoading } = useAuth();

  const resolvedScopeId = useMemo(() => {
    if (props.scopeId) return String(props.scopeId).trim() || null;
    if (props.scopeType === "user") return resolveUserId(user);
    return null;
  }, [props.scopeId, props.scopeType, user]);

  const client = useMemo(
    () => createWebCentralSettingsClient({ csrfToken: safeString((user as any)?.csrfToken || "").trim() || null }),
    [user],
  );

  const [rawJson, setRawJson] = useState("");
  const [serverSettings, setServerSettings] = useState<any | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<Status | null>(null);
  const [lastFetchAt, setLastFetchAt] = useState<number | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const [eventsSinceId, setEventsSinceId] = useState<number | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [memory, setMemory] = useState<any[]>([]);

  const [modal, setModal] = useState<ModalState>(null);

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

  const applyBasicUpdate = useCallback(
    (field: BasicFieldConfig, nextValue: string) => {
      if (!basicEnabled) return;
      const draft = deepClone(parsedJson.value);
      field.apply(draft, nextValue);
      setRawJson(JSON.stringify(draft, null, 2));
    },
    [basicEnabled, parsedJson],
  );

  const buildCandidate = useCallback(
    (raw: any, opts: { updatedAtMode: "preserve" | "now" }) => {
      const base: any = { ...(raw || {}) };
      if (props.scopeType === "user") base.userId = resolvedScopeId;
      else base.guildId = resolvedScopeId;

      base.version = typeof base.version === "number" ? base.version : contracts.SETTINGS_VERSION_V0;
      base.prefs = typeof base.prefs === "object" && base.prefs ? base.prefs : {};

      if (opts.updatedAtMode === "now") {
        base.updatedAt = new Date().toISOString();
      } else {
        const existing = typeof base.updatedAt === "string" ? base.updatedAt : null;
        const server = typeof serverSettings?.updatedAt === "string" ? serverSettings.updatedAt : null;
        base.updatedAt = existing || server || new Date().toISOString();
      }

      return base;
    },
    [props.scopeType, resolvedScopeId, serverSettings],
  );

  const validateCandidate = useCallback(
    (candidate: any) => {
      if (props.scopeType === "user") return contracts.UserSettingsSchema.safeParse(candidate);
      return contracts.GuildSettingsSchema.safeParse(candidate);
    },
    [props.scopeType],
  );

  const compareState = useMemo(() => {
    if (!resolvedScopeId) return { isDirty: false, diff: null as DiffSummary | null, pending: null as any };
    if (!parsedJson.ok) return { isDirty: false, diff: null as DiffSummary | null, pending: null as any };
    if (!serverSettings) return { isDirty: rawJson.trim().length > 0, diff: null as DiffSummary | null, pending: null as any };

    const pending = buildCandidate(parsedJson.value, { updatedAtMode: "preserve" });
    const before = stripEphemeralFields(serverSettings);
    const after = stripEphemeralFields(pending);
    const beforeStable = stableJson(before);
    const afterStable = stableJson(after);
    const isDirty = beforeStable !== afterStable;
    const diff = isDirty ? diffJsonPaths(before, after) : null;
    return { isDirty, diff, pending };
  }, [buildCandidate, parsedJson, rawJson, resolvedScopeId, serverSettings]);

  useEffect(() => {
    if (saveState === "saved" && compareState.isDirty) setSaveState("idle");
  }, [compareState.isDirty, saveState]);

  const loadSettings = useCallback(async () => {
    if (!resolvedScopeId) return;
    setError(null);

    const res =
      props.scopeType === "user"
        ? await client.getUserSettings(resolvedScopeId)
        : await client.getGuildSettings(resolvedScopeId);

    if (!res.ok) {
      setLastStatus({ ok: false, status: res.status, error: safeString(res.error) || "request_failed" });
      setError(`Failed to load ${props.scopeType} settings`);
      return;
    }
    if (!res.data?.ok) {
      setLastStatus({ ok: false, status: res.status, error: "upstream_not_ok" });
      setError(`Failed to load ${props.scopeType} settings`);
      return;
    }

    setLastStatus({ ok: true, status: res.status });
    setLastFetchAt(Date.now());
    setServerSettings(res.data.settings);
    setRawJson(JSON.stringify(res.data.settings, null, 2));
    setSaveState("idle");

    const cursorRes = await client.listSettingsChangesV0({
      scopeType: props.scopeType,
      scopeId: resolvedScopeId,
      limit: 1,
    });
    if (cursorRes.ok) {
      setEvents(cursorRes.data.events || []);
      setEventsSinceId(cursorRes.data.nextSinceId ?? null);
    }
  }, [client, props.scopeType, resolvedScopeId]);

  const checkEvents = useCallback(async () => {
    if (!resolvedScopeId) return;
    setError(null);

    const res = await client.listSettingsChangesV0({
      scopeType: props.scopeType,
      scopeId: resolvedScopeId,
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
  }, [client, eventsSinceId, props.scopeType, resolvedScopeId]);

  const loadMemory = useCallback(async () => {
    if (!resolvedScopeId) return;
    setError(null);

    const res = await client.listMemory(props.scopeType, resolvedScopeId);
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
  }, [client, props.scopeType, resolvedScopeId]);

  useEffect(() => {
    if (!isLoading && resolvedScopeId) loadSettings().catch(() => {});
  }, [isLoading, resolvedScopeId, loadSettings]);

  const resetToServer = useCallback(() => {
    setModal({
      kind: "reset",
      onConfirm: () => {
        setModal(null);
        void loadSettings();
      },
    });
  }, [loadSettings]);

  const doSave = useCallback(
    async (candidateForSave: any) => {
      if (!resolvedScopeId) return;
      setSaveState("saving");
      setError(null);

      const res =
        props.scopeType === "user"
          ? await client.setUserSettings(resolvedScopeId, candidateForSave)
          : await client.setGuildSettings(resolvedScopeId, candidateForSave);

      if (!res.ok) {
        setLastStatus({ ok: false, status: res.status, error: safeString(res.error) || "request_failed" });
        setSaveState("error");
        setError(`Failed to save ${props.scopeType} settings`);
        return;
      }
      if (!res.data?.ok) {
        setLastStatus({ ok: false, status: res.status, error: "upstream_not_ok" });
        setSaveState("error");
        setError(`Failed to save ${props.scopeType} settings`);
        return;
      }

      setLastStatus({ ok: true, status: res.status });
      setLastFetchAt(Date.now());
      setLastSavedAt(Date.now());
      setSaveState("saved");
      setServerSettings(res.data.settings);
      setRawJson(JSON.stringify(res.data.settings, null, 2));

      const cursorRes = await client.listSettingsChangesV0({
        scopeType: props.scopeType,
        scopeId: resolvedScopeId,
        sinceId: eventsSinceId ?? undefined,
        limit: contracts.SETTINGS_CHANGES_DEFAULT_LIMIT,
      });
      if (cursorRes.ok) {
        setEvents(cursorRes.data.events || []);
        setEventsSinceId(cursorRes.data.nextSinceId ?? eventsSinceId);
      }
    },
    [client, eventsSinceId, props.scopeType, resolvedScopeId],
  );

  const prepareSave = useCallback(async () => {
    if (!resolvedScopeId) return;
    setError(null);

    if (!parsedJson.ok) {
      setSaveState("error");
      setError(`Cannot save: ${parsedJson.error}`);
      return;
    }

    const candidateForCompare = buildCandidate(parsedJson.value, { updatedAtMode: "preserve" });
    const validatedCompare = validateCandidate(candidateForCompare);
    if (!validatedCompare.success) {
      setSaveState("error");
      setError(formatZodIssues(validatedCompare.error.issues));
      setLastStatus({ ok: false, status: 400, error: "contracts_validation_failed" });
      return;
    }

    const candidateForSave = buildCandidate(parsedJson.value, { updatedAtMode: "now" });
    const validatedSave = validateCandidate(candidateForSave);
    if (!validatedSave.success) {
      setSaveState("error");
      setError(formatZodIssues(validatedSave.error.issues));
      setLastStatus({ ok: false, status: 400, error: "contracts_validation_failed" });
      return;
    }

    if (!serverSettings) {
      setModal({
        kind: "diff",
        pending: candidateForCompare,
        diff: { added: ["(no server baseline loaded)"], removed: [], changed: [] },
        remoteChanged: false,
        remoteEventsPreview: [],
        onConfirm: () => {
          setModal(null);
          void doSave(validatedSave.data as any);
        },
      });
      return;
    }

    const before = stripEphemeralFields(serverSettings);
    const after = stripEphemeralFields(candidateForCompare);
    const diff = diffJsonPaths(before, after);
    const beforeStable = stableJson(before);
    const afterStable = stableJson(after);
    const isDirty = beforeStable !== afterStable;

    if (!isDirty) {
      setSaveState("saved");
      setLastSavedAt(lastSavedAt ?? Date.now());
      return;
    }

    let remoteChanged = false;
    let remoteEventsPreview: any[] = [];
    const cursorCheck = await client.listSettingsChangesV0({
      scopeType: props.scopeType,
      scopeId: resolvedScopeId,
      sinceId: eventsSinceId ?? undefined,
      limit: 1,
    });
    if (cursorCheck.ok) {
      remoteEventsPreview = cursorCheck.data.events || [];
      if ((cursorCheck.data.events || []).length) remoteChanged = true;
    }

    setModal({
      kind: "diff",
      pending: candidateForCompare,
      diff,
      remoteChanged,
      remoteEventsPreview,
      onConfirm: () => {
        setModal(null);
        void doSave(validatedSave.data as any);
      },
    });
  }, [
    buildCandidate,
    client,
    doSave,
    eventsSinceId,
    lastSavedAt,
    parsedJson,
    props.scopeType,
    resolvedScopeId,
    serverSettings,
    validateCandidate,
  ]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (props.scopeType === "user" && !resolvedScopeId) {
    return (
      <div className="container max-w-4xl py-8 space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Not signed in</AlertTitle>
          <AlertDescription>Sign in to view and edit your settings.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (props.scopeType === "guild" && !resolvedScopeId) {
    return (
      <div className="container max-w-4xl py-8 space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Missing scopeId</AlertTitle>
          <AlertDescription>Open this page as `/club/&lt;guildId&gt;/settings`.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusText = lastStatus
    ? lastStatus.ok
      ? `OK ${lastStatus.status}`
      : `ERR ${lastStatus.status} (${lastStatus.error})`
    : "—";

  const saveLabel =
    saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : saveState === "error" ? "Save failed" : "Save";

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{props.title}</h1>
        {props.description ? <p className="text-muted-foreground">{props.description}</p> : null}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <div className="whitespace-pre-wrap">{error}</div>
            <CopyBox content={error} label="Copy error" />
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Basic Settings (v0.32)</CardTitle>
          <CardDescription>These controls update the JSON editor below (schema: `@slimy/contracts`).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!basicEnabled ? (
            <div className="text-sm text-muted-foreground">
              Basic controls are disabled until the JSON editor contains valid JSON. ({parsedJson.ok ? "—" : parsedJson.error})
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {props.basicFieldsConfig.map((field) => {
                const value = field.getValue(parsedJson.value);
                return (
                  <div key={field.id} className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-center">
                    <label className="text-sm font-medium">{field.label}</label>
                    {field.kind === "select" ? (
                      <select
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                        value={value}
                        onChange={(e) => applyBasicUpdate(field, e.target.value)}
                      >
                        {(field.options || []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(e) => applyBasicUpdate(field, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{props.scopeType === "user" ? "UserSettings JSON" : "GuildSettings JSON"}</CardTitle>
          <CardDescription>
            Save workflow: idle → saving → saved (timestamp) / error. Diff preview shown before saving.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="w-full min-h-[340px] rounded-md border bg-background p-3 font-mono text-sm"
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            spellCheck={false}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => loadSettings()} variant="secondary" disabled={saveState === "saving"}>
              Reload
            </Button>
            <Button onClick={() => resetToServer()} variant="secondary" disabled={saveState === "saving"}>
              Reset to server defaults
            </Button>
            <Button onClick={() => prepareSave()} disabled={saveState === "saving"}>
              {saveLabel}
            </Button>
            <div className="text-sm text-muted-foreground">
              {compareState.isDirty ? "Unsaved changes" : "No local changes"} • last saved:{" "}
              <span className="font-mono">{lastSavedAt ? new Date(lastSavedAt).toISOString() : "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug / Status</CardTitle>
          <CardDescription>Temporary debug/status strip (remove later).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            admin-api base: <span className="font-mono">/api</span> (rewrite proxy)
          </div>
          <div>
            scope: <span className="font-mono">{props.scopeType}:{resolvedScopeId}</span>
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
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => checkEvents()} variant="secondary" size="sm" disabled={saveState === "saving"}>
              Check changes
            </Button>
            <Button onClick={() => loadMemory()} variant="secondary" size="sm" disabled={saveState === "saving"}>
              Load memory
            </Button>
          </div>
          <div className="space-y-2">
            {(events || []).length ? (
              (events || []).map((ev: any) => (
                <div key={ev.id} className="rounded-md border p-3">
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
              <div className="text-muted-foreground">No events loaded.</div>
            )}
          </div>
          <div className="space-y-2">
            {(memory || []).length ? (
              (memory || []).map((rec: any, idx: number) => {
                const content = rec?.content && typeof rec.content === "object" ? rec.content : {};
                const preview = safeString(JSON.stringify(content)).slice(0, 200);
                return (
                  <div key={`${rec.kind}-${rec.updatedAt}-${idx}`} className="rounded-md border p-3">
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
              <div className="text-muted-foreground">No memory loaded.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {modal?.kind === "reset"
        ? renderModal(
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <div className="text-lg font-semibold">Reset to server defaults?</div>
                <div className="text-sm text-muted-foreground">
                  This discards local edits and reloads settings from the server (auto-initialized defaults if none exist).
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setModal(null)}>
                  Cancel
                </Button>
                <Button onClick={() => modal.onConfirm()}>Reset</Button>
              </div>
            </div>,
            () => setModal(null),
          )
        : null}

      {modal?.kind === "diff"
        ? renderModal(
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <div className="text-lg font-semibold">Review changes before saving</div>
                <div className="text-sm text-muted-foreground">
                  You’re about to update central settings. Confirm the diff preview below.
                </div>
              </div>

              {modal.remoteChanged ? (
                <Alert variant="destructive">
                  <AlertTitle>Settings changed elsewhere</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <div>
                      New change events exist since your last cursor. Reload is recommended to avoid overwriting newer settings.
                    </div>
                    {(modal.remoteEventsPreview || []).length ? (
                      <div className="rounded-md border bg-muted/50 p-3 font-mono text-xs">
                        latest remote event id: {safeString(modal.remoteEventsPreview[0]?.id || "unknown")}
                      </div>
                    ) : null}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-md border p-3">
                  <div className="font-medium">Changed keys</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    added {modal.diff.added.length} • removed {modal.diff.removed.length} • changed {modal.diff.changed.length}
                    (excluding `updatedAt`)
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-sm font-mono">
                    {(modal.diff.added.slice(0, 25) || []).map((p) => (
                      <div key={`a:${p}`}>+ {p}</div>
                    ))}
                    {(modal.diff.removed.slice(0, 25) || []).map((p) => (
                      <div key={`r:${p}`}>- {p}</div>
                    ))}
                    {(modal.diff.changed.slice(0, 25) || []).map((p) => (
                      <div key={`c:${p}`}>~ {p}</div>
                    ))}
                    {modal.diff.added.length + modal.diff.removed.length + modal.diff.changed.length > 75 ? (
                      <div className="text-muted-foreground">…truncated</div>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-md border p-3">
                    <div className="font-medium">Current (server)</div>
                    <pre className="mt-2 max-h-[280px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs">
                      {serverSettings ? stableJson(stripEphemeralFields(serverSettings)) : "—"}
                    </pre>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="font-medium">Pending (local)</div>
                    <pre className="mt-2 max-h-[280px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs">
                      {stableJson(stripEphemeralFields(modal.pending))}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="secondary" onClick={() => setModal(null)}>
                  Cancel
                </Button>
                {modal.remoteChanged ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setModal(null);
                      void loadSettings();
                    }}
                  >
                    Reload
                  </Button>
                ) : null}
                <Button onClick={() => modal.onConfirm()} disabled={saveState === "saving"}>
                  Save anyway
                </Button>
              </div>
            </div>,
            () => setModal(null),
          )
        : null}
    </div>
  );
}
