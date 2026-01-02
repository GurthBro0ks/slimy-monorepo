"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useSession } from "../../lib/session";
import { apiFetch } from "../../lib/api";
import { writeActiveGuildId } from "../../lib/active-guild";

export default function GuildsIndex() {
  const router = useRouter();
  const { user, loading: sessionLoading, csrfToken, refresh: refreshSession } = useSession();
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectingGuildId, setSelectingGuildId] = useState(null);
  const returnTo = useMemo(() => {
    const raw = Array.isArray(router.query?.returnTo)
      ? router.query.returnTo[0]
      : router.query?.returnTo;
    if (!raw || typeof raw !== "string") return "";
    const value = raw.trim();
    if (!value.startsWith("/")) return "";
    if (value.startsWith("//")) return "";
    if (value.includes("\\") || value.includes("\n") || value.includes("\r")) return "";
    return value;
  }, [router.query?.returnTo]);

  useEffect(() => {
    if (sessionLoading || !user) return;

    (async () => {
      try {
        const result = await apiFetch("/api/guilds");
        setGuilds(result.guilds || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch guilds:", err);
        setGuilds([]);
        setError(err.message || "Failed to load guilds");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionLoading, user]);

  useEffect(() => {
    if (sessionLoading) return;
    if (user) return;
    setLoading(false);
    const returnTo = router.asPath || "/guilds";
    router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [sessionLoading, user, router]);

  const postActiveGuild = async (guildId) => {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    if (csrfToken) headers.set("x-csrf-token", csrfToken);

    const response = await fetch("/api/auth/active-guild", {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ guildId }),
    });

    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message = payload?.error || payload?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }

    return payload;
  };

  const handleOpen = async (guild) => {
    if (!guild) return;
    // Allow opening if user is manageable (has permissions), even without bot installed
    const isManageable = guild.manageable !== false;
    if (!isManageable) return;
    const guildId = guild.id;
    setSelectingGuildId(guildId);
    setError(null);

    // 1. Call POST /api/auth/active-guild to set active guild server-side
    try {
      const result = await postActiveGuild(guildId);

      if (result && result.ok === false) {
        console.error("Failed to set active guild:", result.error);
        // Fall back to localStorage for graceful degradation
        writeActiveGuildId(guildId);
      } else {
        // Also write to localStorage for immediate client-side access
        writeActiveGuildId(guildId);
        // Refresh session to pick up new activeGuildId
        await refreshSession();
      }
    } catch (err) {
      console.error("Failed to set active guild:", err);
      writeActiveGuildId(guildId);
    } finally {
      setSelectingGuildId(null);
    }

    // 2. Navigate based on role
    if (returnTo) {
      router.push(returnTo);
      return;
    }
    router.push(`/club/${guildId}`);
  };

  if (sessionLoading || loading) {
    return (
      <Layout title="Loading Guilds">
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading your guilds…</div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="No Session">
        <div style={{ textAlign: "center", padding: "2rem" }}>Please log in again.</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Error Loading Guilds">
        <div className="card" style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
          <div style={{ textAlign: "center", display: "grid", gap: "1.25rem" }}>
            <div style={{ fontSize: "3rem" }}>⚠️</div>
            <h2 style={{ margin: 0, color: "#f87171" }}>Failed to Load Guilds</h2>
            <p style={{ opacity: 0.8 }}>{error}</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                className="btn"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  window.location.reload();
                }}
              >
                Retry
              </button>
              <a href="/" className="btn outline">
                Go Home
              </a>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (guilds.length === 0) {
    return (
      <Layout title="No Guilds Available">
        <div style={{ textAlign: "center", padding: "2rem", display: "grid", gap: "1.25rem" }}>
          <div>No guilds available. Make sure you're in at least one Discord server.</div>
          <button
            className="btn outline"
            disabled
            title="Coming soon"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              background: "linear-gradient(135deg, rgb(109,40,217), rgb(34,197,94))",
              color: "white",
              fontWeight: 600,
            }}
          >
            Add Bot to Server (coming soon)
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Select a Guild">
      <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "flex-end" }}>
        <button
          disabled
          title="Coming soon"
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid rgba(56,189,248,0.3)",
            background: "rgba(56,189,248,0.1)",
            color: "rgb(56,189,248)",
            fontSize: "0.875rem",
            cursor: "not-allowed",
            opacity: 0.7,
          }}
        >
          + Add Bot to Another Server
        </button>
      </div>

      <div className="card" style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
        <h2 style={{ margin: 0 }}>Choose a guild</h2>
        <p style={{ opacity: 0.75 }}>Pick a server below. Access level is applied after selection.</p>
        {error && <div style={{ color: "#f87171" }}>{error}</div>}
        <div style={{ display: "grid", gap: "1rem" }}>
          {guilds.map((guild) => {
            const botInstalled = Boolean(
              guild.botInstalled ?? guild.installed ?? guild.botInGuild ?? guild.connectable,
            );
            const isManageable = guild.manageable !== false; // UNAVAILABLE === not manageable
            const canSelect = isManageable;
            return (
              <div
                key={guild.id}
                className="card"
                style={{
                  padding: "1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>{guild.name}</div>
                  <div style={{ opacity: 0.7, fontSize: "0.85rem" }}>
                    Role: {((guild.roleLabel || guild.role || "member") + "").toUpperCase()}
                  </div>
                  <div style={{ opacity: 0.6, fontSize: "0.8rem" }}>
                    {botInstalled ? "Bot installed" : "Bot not installed"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <button
                    className="btn"
                    onClick={() => handleOpen(guild)}
                    disabled={selectingGuildId === guild.id || !canSelect}
                  >
                    {!isManageable
                      ? "UNAVAILABLE"
                      : selectingGuildId === guild.id
                        ? "Selecting…"
                        : botInstalled
                          ? "OPEN"
                          : "INVITE BOT"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TEMP debug/status area (removable later) */}
      <div className="card" style={{ padding: "1rem", marginTop: "1rem" }}>
        <div style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Debug / Status (temporary)</div>
        <pre style={{ margin: 0, fontSize: "0.85rem", overflowX: "auto" }}>
          {JSON.stringify(
            {
              total: guilds.length,
              sample: guilds.slice(0, 5).map((g) => ({
                id: g.id,
                name: g.name,
                roleLabel: g.roleLabel,
                role: g.role,
                manageable: g.manageable,
                botInstalled: g.botInstalled,
                installed: g.installed,
                botInGuild: g.botInGuild,
                connectable: g.connectable,
                keys: Object.keys(g).sort(),
              })),
            },
            null,
            2,
          )}
        </pre>
      </div>
    </Layout>
  );
}
