"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { apiFetch } from "../../lib/api";
import { useSession } from "../../lib/session";
import { useActiveGuild } from "../../lib/active-guild";
import { useGatedGuilds } from "../../lib/gated-guilds";

export default function ClubHome() {
  const { user, loading } = useSession();
  const router = useRouter();
  const activeGuild = useActiveGuild({ router });
  const gated = useGatedGuilds();
  const selected = activeGuild.guildId || null;
  const [health, setHealth] = useState(null);
  const [snailStats, setSnailStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading || !user) return;
    if (!selected) {
      router.replace("/guilds");
      return;
    }
  }, [loading, user, selected, router]);

  const selectedGuild = (Array.isArray(gated.guilds) ? gated.guilds : []).find(
    (g) => String(g.id) === String(selected || ""),
  );

  const hasClubAccess = Boolean(
    selectedGuild && (selectedGuild.role === "club" || selectedGuild.role === "admin"),
  );

  useEffect(() => {
    if (loading || gated.loading || !user) return;
    if (selected && !selectedGuild) {
      router.replace("/guilds");
    }
  }, [loading, gated.loading, user, selected, selectedGuild, router]);

  useEffect(() => {
    if (!selected || !hasClubAccess) {
      setHealth(null);
      setSnailStats(null);
      return;
    }
    setError(null);
    apiFetch(`/api/guilds/${selected}/health`)
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message || "Failed to load club health"));
    apiFetch(`/api/guilds/${selected}/snail/stats`)
      .then((data) => setSnailStats(data?.record || null))
      .catch(() => setSnailStats(null));
  }, [selected, hasClubAccess]);

  if (loading || gated.loading || !user) {
    return (
      <Layout title="Club Dashboard" guildId={selected || undefined}>
        <div className="card" style={{ padding: "1.25rem" }}>Loading…</div>
      </Layout>
    );
  }

  return (
    <Layout title="Club Dashboard" guildId={selected || undefined}>
      {!selected ? (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ marginTop: 0 }}>Select a guild first</h3>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Club is guild-scoped. Go to <a href="/guilds">/guilds</a> to select a guild.
          </p>
        </div>
      ) : null}

      {selected && !hasClubAccess ? (
        <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Access denied</h3>
          <p style={{ margin: 0, opacity: 0.8 }}>
            You don’t have club access for this selected guild. Pick a different guild from <a href="/guilds">/guilds</a>.
          </p>
        </div>
      ) : null}

      {error && (
        <div className="card" style={{ padding: "1rem", marginBottom: "1rem", color: "#f87171" }}>
          {error}
        </div>
      )}

      <div
        className="card"
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Club Overview</h2>
        <div style={{ opacity: 0.75, fontSize: "0.95rem" }}>
          {selectedGuild?.name || (selected ? `Guild ${selected}` : "No guild selected")}
          {" · "}
          <a href="/guilds" style={{ textDecoration: "underline" }}>Change guild</a>
          {" · "}
          selected via <span style={{ fontFamily: "monospace" }}>{activeGuild.source}</span>
        </div>
        <a className="btn outline" href={selected ? `/snail/${selected}` : "/snail"}>
          🐌 Snail Tools
        </a>
      </div>

      {hasClubAccess && health && (
        <div className="grid" style={{ gap: "1rem", marginBottom: "1.5rem" }}>
          <StatCard title="Members" value={health.members} />
          <StatCard title="Total Power" value={health.totalPower} />
          <StatCard title="SIM Power" value={health.simPower} />
          <StatCard title="Last Snapshot" value={health.lastSnapshotAt || "—"} />
        </div>
      )}

      {hasClubAccess ? (
        snailStats ? (
          <div className="card" style={{ display: "grid", gap: "0.75rem" }}>
            <h3 style={{ marginTop: 0 }}>Latest Snail Snapshot</h3>
            <div style={{ fontSize: "0.9rem", opacity: 0.75 }}>
              Captured {new Date(snailStats.uploadedAt).toLocaleString()} – prompt: {snailStats.prompt || "Default"}
            </div>
            <div className="grid" style={{ gap: "0.75rem" }}>
              {(snailStats.results || []).map((entry) => (
                <div key={entry.file?.storedAs} className="card" style={{ padding: "0.9rem" }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{entry.file?.name || "Screenshot"}</div>
                  <div style={{ fontSize: "0.85rem", opacity: 0.75 }}>Uploaded by {entry.uploadedBy?.name || "unknown"}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: "1.25rem" }}>
            <h3 style={{ marginTop: 0 }}>No Snail stats yet</h3>
            <p style={{ margin: 0, opacity: 0.75 }}>
              Run an analysis in Snail Tools to populate this panel.
            </p>
          </div>
        )
      ) : null}
    </Layout>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="card" style={{ padding: "1rem" }}>
      <div style={{ opacity: 0.65, fontSize: "0.85rem" }}>{title}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{formatNumber(value)}</div>
    </div>
  );
}

function formatNumber(value) {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString();
}
