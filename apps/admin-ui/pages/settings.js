"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { createAdminApiClient } from "@slimy/admin-api-client";
import { useSession } from "../lib/session";
import Layout from "../components/Layout";

/**
 * Standalone settings page. Redirects to /club/<guildId>/settings if a guild is active,
 * otherwise shows personal settings only.
 */
export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, csrfToken } = useSession();

  const userId = user?.discordId || user?.id || "";
  const adminApiBaseUrl = "/api";
  const adminApi = useMemo(
    () =>
      createAdminApiClient({
        baseUrl: adminApiBaseUrl,
        defaultHeaders: {
          "x-slimy-client": "admin-ui",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : null),
        },
      }),
    [adminApiBaseUrl, csrfToken],
  );

  const [userChanges, setUserChanges] = useState({
    sinceId: null,
    lastCheckedAt: null,
    lastEventCount: 0,
    error: null,
  });

  const [markdownState, setMarkdownState] = useState({
    loading: false,
    saving: false,
    enabled: false,
    lastFetchedAt: null,
    error: null,
  });

  const refreshUserSettings = useCallback(async () => {
    if (!userId) return;
    setMarkdownState((s) => ({ ...s, loading: true, error: null }));
    const res = await adminApi.getUserSettings(userId);
    if (!res.ok) {
      setMarkdownState((s) => ({ ...s, loading: false, error: res.error, lastFetchedAt: new Date().toISOString() }));
      return;
    }

    const enabled = Boolean(res.data?.settings?.prefs?.chat?.markdown);
    setMarkdownState((s) => ({
      ...s,
      loading: false,
      enabled,
      lastFetchedAt: new Date().toISOString(),
      error: null,
    }));
  }, [adminApi, userId]);

  const primeUserSettingsCursor = useCallback(async () => {
    if (!userId) return;
    const res = await adminApi.listSettingsChangesV0({ scopeType: "user", scopeId: userId, limit: 1 });
    if (!res.ok) {
      setUserChanges((s) => ({ ...s, error: res.error, lastCheckedAt: new Date().toISOString() }));
      return;
    }
    setUserChanges((s) => ({
      ...s,
      sinceId: res.data.nextSinceId,
      lastEventCount: res.data.events.length,
      lastCheckedAt: new Date().toISOString(),
      error: null,
    }));
  }, [adminApi, userId]);

  const refreshUserSettingsIfChanged = useCallback(async () => {
    if (!userId) return;
    const res = await adminApi.listSettingsChangesV0({
      scopeType: "user",
      scopeId: userId,
      sinceId: userChanges.sinceId,
      limit: 1,
    });
    if (!res.ok) {
      setUserChanges((s) => ({ ...s, error: res.error, lastCheckedAt: new Date().toISOString() }));
      return;
    }

    setUserChanges((s) => ({
      ...s,
      sinceId: res.data.nextSinceId,
      lastEventCount: res.data.events.length,
      lastCheckedAt: new Date().toISOString(),
      error: null,
    }));

    if (res.data.events.length) {
      await refreshUserSettings();
    }
  }, [adminApi, userId, userChanges.sinceId, refreshUserSettings]);

  const setMarkdownEnabled = useCallback(async (nextEnabled) => {
    if (!userId) return;
    setMarkdownState((s) => ({ ...s, saving: true, error: null }));
    const res = await adminApi.patchUserSettings(userId, {
      prefs: { chat: { markdown: Boolean(nextEnabled) } },
    });
    if (!res.ok) {
      setMarkdownState((s) => ({ ...s, saving: false, error: res.error }));
      return;
    }

    setMarkdownState((s) => ({
      ...s,
      saving: false,
      enabled: Boolean(res.data?.settings?.prefs?.chat?.markdown),
      lastFetchedAt: new Date().toISOString(),
      error: null,
    }));

    void primeUserSettingsCursor();
  }, [adminApi, userId, primeUserSettingsCursor]);

  useEffect(() => {
    if (loading) return;

    // If user has an active guild, redirect to the guild-scoped settings page
    if (user?.activeGuildId) {
      router.replace(`/club/${user.activeGuildId}/settings`);
    }
  }, [loading, user?.activeGuildId, router]);

  useEffect(() => {
    if (loading) return;
    if (!userId) return;
    void refreshUserSettings();
    void primeUserSettingsCursor();
  }, [loading, userId, refreshUserSettings, primeUserSettingsCursor]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onFocus = () => void refreshUserSettingsIfChanged();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshUserSettingsIfChanged]);

  // Show loading while checking session
  if (loading) {
    return (
      <Layout title="Settings">
        <div className="card" style={{ padding: "1.25rem" }}>Loading...</div>
      </Layout>
    );
  }

  // If redirecting to guild settings, show brief message
  if (user?.activeGuildId) {
    return (
      <Layout title="Settings">
        <div className="card" style={{ padding: "1.25rem" }}>Redirecting to guild settings...</div>
      </Layout>
    );
  }

  // No active guild - show personal settings only
  return (
    <Layout title="Settings">
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "1rem" }}>Personal Settings</div>
        <p style={{ opacity: 0.8, marginBottom: "1rem" }}>
          Select a guild from <a href="/guilds">/guilds</a> to access guild-specific settings.
        </p>

        {user && (
          <>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Account Info</div>
              <div style={{ display: "grid", gap: "0.5rem", fontFamily: "monospace", fontSize: "0.9rem" }}>
                <div>Username: {user.username || "(unknown)"}</div>
                <div>Discord ID: {user.discordId || "(unknown)"}</div>
                <div>Role: {user.role || "member"}</div>
              </div>
            </div>

            <div style={{ paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,.1)" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Theme & Appearance</div>
              <div style={{ opacity: 0.7 }}>Theme preferences coming soon.</div>
            </div>

            <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,.1)" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.75rem" }}>Chat</div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={Boolean(markdownState.enabled)}
                  disabled={markdownState.loading || markdownState.saving}
                  onChange={(e) => setMarkdownEnabled(e.target.checked)}
                />
                Markdown formatting
              </label>
              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                <button className="btn" onClick={refreshUserSettingsIfChanged} disabled={markdownState.loading}>
                  Refresh
                </button>
                {(markdownState.loading || markdownState.saving) && (
                  <div style={{ opacity: 0.7, paddingTop: "0.35rem" }}>
                    {markdownState.saving ? "Saving..." : "Loading..."}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Temporary debug/status area (required) */}
      <div className="card" style={{ padding: "1rem" }}>
        <div style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Debug / Status (temporary)</div>
        <div style={{ fontFamily: "monospace", fontSize: "0.9rem", display: "grid", gap: "0.35rem" }}>
          <div>adminApiBaseUrl: {adminApiBaseUrl}</div>
          <div>userId: {userId || "(none)"}</div>
          <div>activeGuildId: {user?.activeGuildId || "(none)"}</div>
          <div>lastSettingsFetch: {markdownState.lastFetchedAt || "(never)"}</div>
          <div>userChangesSinceId: {userChanges.sinceId ?? "(none)"}</div>
          <div>lastChangesCheck: {userChanges.lastCheckedAt || "(never)"}</div>
          <div>lastError: {markdownState.error ? JSON.stringify(markdownState.error) : "(none)"}</div>
        </div>
      </div>
    </Layout>
  );
}
