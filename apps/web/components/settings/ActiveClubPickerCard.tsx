"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyBox } from "@/components/ui/copy-box";
import { useAuth } from "@/lib/auth/context";
import { createWebCentralSettingsClient } from "@/lib/api/central-settings-client";
import { getGuildIdentityMap } from "@/lib/guildIdentity";

type SaveState = "idle" | "saving" | "saved" | "error";

function safeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return String(value);
}

function resolveUserId(user: any): string | null {
  return safeString(user?.discordId || user?.id || user?.sub || "").trim() || null;
}

type GuildOption = {
  id: string;
  name: string;
  installed?: boolean;
};

export function ActiveClubPickerCard() {
  const { user, isLoading } = useAuth();
  const csrfToken = safeString((user as any)?.csrfToken || "").trim() || null;
  const userId = useMemo(() => (isLoading ? null : resolveUserId(user as any)), [isLoading, user]);

  const client = useMemo(
    () => createWebCentralSettingsClient({ csrfToken }),
    [csrfToken],
  );

  const guildOptions = useMemo((): GuildOption[] => {
    const raw = ((user as any)?.sessionGuilds || (user as any)?.guilds || []) as any[];
    const valid = raw
      .filter((g) => g && typeof g === "object")
      .map((g) => ({
        id: safeString(g.id).trim(),
        name: safeString(g.name).trim(),
        installed: typeof g.installed === "boolean" ? g.installed : undefined,
      }))
      .filter((g) => g.id && g.name);

    const hasInstalledFlag = valid.some((g) => typeof g.installed === "boolean");
    const filtered = hasInstalledFlag ? valid.filter((g) => g.installed) : valid;
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [user]);

  const [activeGuildId, setActiveGuildId] = useState<string>("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAtMs, setLastSavedAtMs] = useState<number | null>(null);
  const [guildIdentityMap, setGuildIdentityMap] = useState<Record<string, { id: string; name: string; iconUrl?: string }> | null>(null);
  const [guildIdentityError, setGuildIdentityError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);

    const res = await client.getUserSettings(userId);
    if (!res.ok || !res.data?.ok) {
      setError("Failed to load UserSettings (to read active club)");
      return;
    }

    const current = res.data.settings as Record<string, unknown>;
    const v = current["activeGuildId"];
    setActiveGuildId(typeof v === "string" ? v : "");
  }, [client, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId) {
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
  }, [userId]);

  const persist = useCallback(
    async (nextGuildIdRaw: string) => {
      if (!userId) return;
      setSaveState("saving");
      setError(null);

      const currentRes = await client.getUserSettings(userId);
      if (!currentRes.ok || !currentRes.data?.ok) {
        setSaveState("error");
        setError("Failed to load current UserSettings before updating active club");
        return;
      }

      const nextGuildId = safeString(nextGuildIdRaw).trim();
      const nextSettings = JSON.parse(JSON.stringify(currentRes.data.settings)) as Record<string, unknown>;
      nextSettings["activeGuildId"] = nextGuildId ? nextGuildId : null;
      nextSettings["updatedAt"] = new Date().toISOString();

      const writeRes = await client.setUserSettings(userId, nextSettings as any);
      if (!writeRes.ok || !writeRes.data?.ok) {
        setSaveState("error");
        setError("Failed to persist active club to UserSettings");
        return;
      }

      const saved = writeRes.data.settings as Record<string, unknown>;
      const savedGuildId = saved["activeGuildId"];
      setActiveGuildId(typeof savedGuildId === "string" ? savedGuildId : "");
      setSaveState("saved");
      setLastSavedAtMs(Date.now());
    },
    [client, userId],
  );

  const activeGuildIdentity = useMemo(() => {
    const gid = activeGuildId.trim();
    if (!gid) return null;
    const fromMap = guildIdentityMap?.[gid];
    if (fromMap) return fromMap;
    const fromUser = guildOptions.find((g) => g.id === gid);
    return fromUser ? { id: fromUser.id, name: fromUser.name } : null;
  }, [activeGuildId, guildIdentityMap, guildOptions]);

  const activeClubLinks = useMemo(() => {
    const gid = activeGuildId.trim();
    if (!gid) return null;
    return {
      club: `/club?guildId=${encodeURIComponent(gid)}`,
      clubSettings: `/club/${encodeURIComponent(gid)}/settings`,
    };
  }, [activeGuildId]);

  return (
    <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Active Club</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Persisted in central UserSettings (used as a default “guild scope” for web widgets).
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">UserSettings</Badge>
            {saveState === "saving" ? <Badge className="bg-yellow-600">saving</Badge> : null}
            {saveState === "saved" ? <Badge className="bg-emerald-600">saved</Badge> : null}
            {saveState === "error" ? <Badge variant="destructive">error</Badge> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {!userId ? (
          <div className="rounded-xl border border-zinc-700 bg-zinc-950/40 p-3 text-sm text-zinc-200">
            Sign in to set an active club.
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-950/30 p-3">
          {activeGuildIdentity?.iconUrl ? (
            <img
              src={activeGuildIdentity.iconUrl}
              alt=""
              className="h-8 w-8 rounded border border-zinc-700 object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded border border-zinc-700 bg-zinc-900" />
          )}
          <div className="min-w-[220px]">
            <div className="text-sm font-medium text-zinc-100">
              {activeGuildIdentity?.name || (activeGuildId ? "Unknown club" : "No active club")}
            </div>
            <div className="text-xs text-zinc-400">
              {activeGuildId ? "Used as default guild scope across web UI." : "Pick a guild to make club pages feel consistent."}
            </div>
          </div>
          {activeClubLinks ? (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href={activeClubLinks.club}>Open club</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href={activeClubLinks.clubSettings}>Club settings</Link>
              </Button>
            </div>
          ) : null}
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Active club update failed</AlertTitle>
            <AlertDescription className="space-y-2">
              <div className="whitespace-pre-wrap">{error}</div>
              <CopyBox content={error} label="Copy error" />
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Selected guild</label>
            <div className="text-xs text-zinc-400">
              This does not affect permissions. It only selects a default guild scope for the UI.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 min-w-[260px] rounded-md border bg-background px-3 text-sm"
              value={activeGuildId || ""}
              onChange={(e) => void persist(e.target.value)}
              disabled={!userId || saveState === "saving"}
            >
              <option value="">(none)</option>
              {guildOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {(guildIdentityMap?.[g.id]?.name || g.name) + ` (${g.id})`}
                </option>
              ))}
            </select>
            <Button onClick={() => void load()} variant="secondary" size="sm" disabled={!userId || saveState === "saving"}>
              Reload
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-700 bg-zinc-950/40 p-3 text-xs text-zinc-300">
          <div className="font-medium text-zinc-200">Debug</div>
          <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
            <div>userId: {userId ?? "(none)"}</div>
            <div>
              activeGuildId: {activeGuildId ? <span className="font-mono">{activeGuildId}</span> : "(none)"}
            </div>
            <div>guildOptions: {guildOptions.length}</div>
            <div>identityMap: {guildIdentityMap ? Object.keys(guildIdentityMap).length : "(loading)"}</div>
            <div>identityError: {guildIdentityError ?? "(none)"}</div>
            <div>
              lastSaved:{" "}
              {typeof lastSavedAtMs === "number" ? new Date(lastSavedAtMs).toLocaleTimeString() : "(never)"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
