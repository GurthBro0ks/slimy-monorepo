import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createAdminApiClient } from "@slimy/admin-api-client";
import Layout from "../../../components/Layout";
import { apiFetch } from "../../../lib/api";
import { useSession } from "../../../lib/session";

/**
 * Club Settings Page with Personal/Guild tabs.
 * - Personal tab: always visible (theme prefs, account info)
 * - Guild tab: visible only if user has admin/club role for this guild
 */
export default function GuildSettingsPage() {
  const router = useRouter();
  const { user, csrfToken } = useSession();
  const guildId = router.query.guildId?.toString() || "";

  // Determine if user can access guild settings
  const activeGuildId = user?.activeGuildId ? String(user.activeGuildId) : "";
  const activeGuildAppRole = user?.activeGuildAppRole
    ? String(user.activeGuildAppRole).toLowerCase()
    : "";
  const baseRole = user?.role || "member";
  const isAdmin = baseRole === "admin";
  const canAccessGuildSettings =
    isAdmin ||
    (activeGuildId === guildId &&
      (activeGuildAppRole === "admin" || activeGuildAppRole === "club"));

  const userId = user?.discordId || user?.id || "";
  const adminApiBaseUrl = "/api/admin-api";
  const adminApi = useMemo(
    () =>
      createAdminApiClient({
        baseUrl: adminApiBaseUrl,
        defaultHeaders: {
          "x-slimy-client": "admin-ui",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : null),
        },
      }),
    [csrfToken],
  );

  const [guildChanges, setGuildChanges] = useState({
    sinceId: null,
    lastCheckedAt: null,
    lastEventCount: 0,
    error: null,
  });

  const [centralGuildState, setCentralGuildState] = useState({
    loading: false,
    saving: false,
    widgetEnabled: false,
    lastFetchedAt: null,
    error: null,
  });

  const primeGuildSettingsCursor = useCallback(async () => {
    if (!guildId || !canAccessGuildSettings) return;
    const res = await adminApi.listSettingsChangesV0({ scopeType: "guild", scopeId: guildId, limit: 1 });
    if (!res.ok) {
      setGuildChanges((s) => ({ ...s, error: res.error, lastCheckedAt: new Date().toISOString() }));
      return;
    }
    setGuildChanges((s) => ({
      ...s,
      sinceId: res.data.nextSinceId,
      lastEventCount: res.data.events.length,
      lastCheckedAt: new Date().toISOString(),
      error: null,
    }));
  }, [adminApi, guildId, canAccessGuildSettings]);

  const refreshCentralGuildSettings = useCallback(async () => {
    if (!guildId || !canAccessGuildSettings) return;
    setCentralGuildState((s) => ({ ...s, loading: true, error: null }));
    const res = await adminApi.getGuildSettings(guildId);
    if (!res.ok) {
      setCentralGuildState((s) => ({ ...s, loading: false, error: res.error, lastFetchedAt: new Date().toISOString() }));
      return;
    }

    const widgetEnabled = Boolean(res.data?.settings?.prefs?.widget?.enabled);
    setCentralGuildState((s) => ({
      ...s,
      loading: false,
      widgetEnabled,
      lastFetchedAt: new Date().toISOString(),
      error: null,
    }));
  }, [adminApi, guildId, canAccessGuildSettings]);

  const refreshCentralGuildSettingsIfChanged = useCallback(async () => {
    if (!guildId || !canAccessGuildSettings) return;
    const res = await adminApi.listSettingsChangesV0({
      scopeType: "guild",
      scopeId: guildId,
      sinceId: guildChanges.sinceId,
      limit: 1,
    });
    if (!res.ok) {
      setGuildChanges((s) => ({ ...s, error: res.error, lastCheckedAt: new Date().toISOString() }));
      return;
    }

    setGuildChanges((s) => ({
      ...s,
      sinceId: res.data.nextSinceId,
      lastEventCount: res.data.events.length,
      lastCheckedAt: new Date().toISOString(),
      error: null,
    }));

    if (res.data.events.length) {
      await refreshCentralGuildSettings();
    }
  }, [adminApi, guildId, canAccessGuildSettings, guildChanges.sinceId, refreshCentralGuildSettings]);

  const setWidgetEnabled = useCallback(async (nextEnabled) => {
    if (!guildId || !canAccessGuildSettings) return;
    setCentralGuildState((s) => ({ ...s, saving: true, error: null }));
    const res = await adminApi.patchGuildSettings(guildId, {
      prefs: { widget: { enabled: Boolean(nextEnabled) } },
    });
    if (!res.ok) {
      setCentralGuildState((s) => ({ ...s, saving: false, error: res.error }));
      return;
    }

    setCentralGuildState((s) => ({
      ...s,
      saving: false,
      widgetEnabled: Boolean(res.data?.settings?.prefs?.widget?.enabled),
      lastFetchedAt: new Date().toISOString(),
      error: null,
    }));

    void primeGuildSettingsCursor();
  }, [adminApi, guildId, canAccessGuildSettings, primeGuildSettingsCursor]);

  useEffect(() => {
    void refreshCentralGuildSettings();
    void primeGuildSettingsCursor();
  }, [refreshCentralGuildSettings, primeGuildSettingsCursor]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onFocus = () => void refreshCentralGuildSettingsIfChanged();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshCentralGuildSettingsIfChanged]);

  // Tab state - default to "personal", but switch to "guild" if user came from guild nav
  const [activeTab, setActiveTab] = useState("personal");

  // Guild settings state
  const [state, setState] = useState({
    loading: true,
    error: null,
    settings: null,
    saving: false,
  });

  // Theme preferences (localStorage for now)
  const [themePrefs, setThemePrefs] = useState({
    darkMode: true,
    compactView: false,
  });

  // Load theme prefs from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("slimy_theme_prefs");
      if (stored) {
        try {
          setThemePrefs(JSON.parse(stored));
        } catch {
          // Ignore invalid JSON in localStorage
        }
      }
    }
  }, []);

  // Save theme prefs to localStorage
  function saveThemePref(key, value) {
    setThemePrefs((prev) => {
      const next = { ...prev, [key]: value };
      if (typeof window !== "undefined") {
        localStorage.setItem("slimy_theme_prefs", JSON.stringify(next));
      }
      return next;
    });
  }

  // Load guild settings
  useEffect(() => {
    if (!guildId || !canAccessGuildSettings) return;
    (async () => {
      try {
        const res = await apiFetch(`/api/guilds/${guildId}/settings`);
        setState({ loading: false, error: null, settings: res.settings, saving: false });
      } catch (e) {
        setState({ loading: false, error: e.message || "failed", settings: null, saving: false });
      }
    })();
  }, [guildId, canAccessGuildSettings]);

  const s = state.settings || {};

  async function save(patch) {
    setState((x) => ({ ...x, saving: true }));
    try {
      const res = await apiFetch(`/api/guilds/${guildId}/settings`, {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      setState({ loading: false, error: null, settings: res.settings, saving: false });
    } catch (e) {
      setState((x) => ({ ...x, saving: false, error: e.message || "save_failed" }));
    }
  }

  // Tab button style
  const tabStyle = (isActive) => ({
    padding: "10px 20px",
    borderRadius: "8px 8px 0 0",
    background: isActive ? "rgba(61, 255, 140, 0.12)" : "transparent",
    border: isActive ? "1px solid var(--glass-border)" : "1px solid transparent",
    borderBottom: isActive ? "1px solid transparent" : "1px solid rgba(255,255,255,.1)",
    cursor: "pointer",
    fontWeight: isActive ? 600 : 400,
    color: isActive ? "rgba(61, 255, 140, 1)" : "rgba(255,255,255,.7)",
    marginBottom: "-1px",
  });

  return (
    <Layout guildId={guildId} title="Settings">
      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          borderBottom: "1px solid rgba(255,255,255,.1)",
          marginBottom: "1rem",
        }}
      >
        <button style={tabStyle(activeTab === "personal")} onClick={() => setActiveTab("personal")}>
          Personal
        </button>
        {canAccessGuildSettings && (
          <button style={tabStyle(activeTab === "guild")} onClick={() => setActiveTab("guild")}>
            Guild
          </button>
        )}
      </div>

      {/* Personal Tab Content */}
      {activeTab === "personal" && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "1rem" }}>
            Personal Settings
          </div>

          {/* Account Info (read-only) */}
          {user && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.75rem" }}>Account Info</div>
              <div
                style={{
                  display: "grid",
                  gap: "0.5rem",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                  background: "rgba(0,0,0,.2)",
                  padding: "1rem",
                  borderRadius: "8px",
                }}
              >
                <div>
                  <span style={{ opacity: 0.6 }}>Username:</span> {user.username || "(unknown)"}
                </div>
                <div>
                  <span style={{ opacity: 0.6 }}>Discord ID:</span> {user.discordId || "(unknown)"}
                </div>
                <div>
                  <span style={{ opacity: 0.6 }}>Global Role:</span> {user.role || "member"}
                </div>
                {activeGuildId && (
                  <div>
                    <span style={{ opacity: 0.6 }}>Active Guild Role:</span>{" "}
                    {activeGuildAppRole || "(none)"}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Theme & Appearance */}
          <div
            style={{
              paddingTop: "1rem",
              borderTop: "1px solid rgba(255,255,255,.1)",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "0.75rem" }}>Theme & Appearance</div>
            <div className="grid cols-2">
              <div className="form-row">
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={themePrefs.darkMode}
                    onChange={(e) => saveThemePref("darkMode", e.target.checked)}
                  />
                  Dark Mode
                </label>
                <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                  Currently always enabled
                </span>
              </div>
              <div className="form-row">
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={themePrefs.compactView}
                    onChange={(e) => saveThemePref("compactView", e.target.checked)}
                  />
                  Compact View
                </label>
                <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                  Reduce spacing in lists
                </span>
              </div>
            </div>
          </div>

          {/* Session Info */}
          {user?.sessionGuilds && (
            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(255,255,255,.1)",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "0.75rem" }}>Your Guilds</div>
              <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                {Array.isArray(user.sessionGuilds) && user.sessionGuilds.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                    {user.sessionGuilds.slice(0, 5).map((g) => (
                      <li key={g.id}>
                        {g.name || g.id}{" "}
                        <span style={{ opacity: 0.5 }}>({g.role || "member"})</span>
                      </li>
                    ))}
                    {user.sessionGuilds.length > 5 && (
                      <li style={{ opacity: 0.5 }}>
                        +{user.sessionGuilds.length - 5} more...
                      </li>
                    )}
                  </ul>
                ) : (
                  <span style={{ opacity: 0.5 }}>No guilds available</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guild Tab Content */}
      {activeTab === "guild" && canAccessGuildSettings && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "1rem" }}>
            Guild Settings
            {state.saving && (
              <span style={{ marginLeft: "1rem", fontSize: "0.8rem", opacity: 0.6 }}>
                Saving...
              </span>
            )}
          </div>
          {state.loading && <div>Loading...</div>}
          {state.error && (
            <div style={{ color: "#f88", marginBottom: "1rem" }}>Error: {state.error}</div>
          )}

          <div
            style={{
              marginBottom: "1rem",
              padding: "1rem",
              borderRadius: "10px",
              background: "rgba(0,0,0,.25)",
              border: "1px solid rgba(255,255,255,.08)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Central Settings (v0)</div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={Boolean(centralGuildState.widgetEnabled)}
                disabled={centralGuildState.loading || centralGuildState.saving}
                onChange={(e) => setWidgetEnabled(e.target.checked)}
              />
              Widget enabled
            </label>
            <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
              <button className="btn" onClick={() => refreshCentralGuildSettingsIfChanged()} disabled={centralGuildState.loading}>
                Refresh
              </button>
              {(centralGuildState.loading || centralGuildState.saving) && (
                <div style={{ opacity: 0.7, paddingTop: "0.35rem" }}>
                  {centralGuildState.saving ? "Saving..." : "Loading..."}
                </div>
              )}
            </div>
            {centralGuildState.error && (
              <div style={{ marginTop: "0.75rem", color: "#f88" }}>
                Error: {JSON.stringify(centralGuildState.error)}
              </div>
            )}
          </div>

          {!state.loading && !state.error && (
            <>
              <div className="grid cols-2">
                <div className="form-row">
                  <label>Sheet ID</label>
                  <input
                    type="text"
                    className="input"
                    defaultValue={s.sheet_id || ""}
                    onBlur={(e) => save({ sheet_id: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <label>Default Tab (e.g., Baseline (10-24-25))</label>
                  <input
                    type="text"
                    className="input"
                    defaultValue={s.sheet_tab || ""}
                    onBlur={(e) => save({ sheet_tab: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <label>Default View</label>
                  <select
                    className="select"
                    defaultValue={s.view_mode || "baseline"}
                    onChange={(e) => save({ view_mode: e.target.value })}
                  >
                    <option value="baseline">Baseline</option>
                    <option value="latest">Latest</option>
                  </select>
                </div>

                <div className="form-row">
                  <label>Allow Public Stats (/stats)</label>
                  <input
                    type="checkbox"
                    defaultChecked={!!s.allow_public}
                    onChange={(e) => save({ allow_public: e.target.checked })}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: "1.5rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid rgba(255,255,255,.1)",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>
                  Screenshot Upload Settings
                </div>
                <div className="grid cols-2">
                  <div className="form-row">
                    <label>Screenshot Channel ID</label>
                    <input
                      type="text"
                      className="input"
                      defaultValue={s.screenshot_channel_id || ""}
                      onBlur={(e) => save({ screenshot_channel_id: e.target.value })}
                      placeholder="Pick from Channels tab or paste ID"
                    />
                  </div>

                  <div className="form-row">
                    <label>Enable Uploads</label>
                    <input
                      type="checkbox"
                      defaultChecked={s.uploads_enabled !== undefined ? !!s.uploads_enabled : true}
                      onChange={(e) => save({ uploads_enabled: e.target.checked })}
                    />
                  </div>

                  <div className="form-row" style={{ gridColumn: "1 / -1" }}>
                    <label>Notes</label>
                    <textarea
                      className="textarea"
                      defaultValue={s.notes || ""}
                      onBlur={(e) => save({ notes: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Access denied message for guild tab */}
      {activeTab === "guild" && !canAccessGuildSettings && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ marginTop: 0 }}>Access Denied</h3>
          <p style={{ margin: 0, opacity: 0.8 }}>
            You need admin or club role to access guild settings. Your current role:{" "}
            <code>{activeGuildAppRole || baseRole}</code>
          </p>
        </div>
      )}

      {/* Temporary debug/status area (required) */}
      <div className="card" style={{ padding: "1rem" }}>
        <div style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Debug / Status (temporary)</div>
        <div style={{ fontFamily: "monospace", fontSize: "0.9rem", display: "grid", gap: "0.35rem" }}>
          <div>adminApiBaseUrl: {adminApiBaseUrl}</div>
          <div>userId: {userId || "(none)"}</div>
          <div>guildId: {guildId || "(none)"}</div>
          <div>activeGuildId: {activeGuildId || "(none)"}</div>
          <div>lastCentralFetch: {centralGuildState.lastFetchedAt || "(never)"}</div>
          <div>guildChangesSinceId: {guildChanges.sinceId ?? "(none)"}</div>
          <div>lastChangesCheck: {guildChanges.lastCheckedAt || "(never)"}</div>
          <div>lastCentralError: {centralGuildState.error ? JSON.stringify(centralGuildState.error) : "(none)"}</div>
        </div>
      </div>
    </Layout>
  );
}
