"use client";

import Layout from "../../components/Layout";
import { useSession } from "../../lib/session";

export default function SnailHome() {
  const { user, loading } = useSession();

  if (loading || !user) {
    return (
      <Layout title="Personal Snail">
        <div className="card" style={{ padding: "1.25rem" }}>
          {loading ? "Loading session…" : "Redirecting to login…"}
        </div>
      </Layout>
    );
  }

  const activeGuildId = user?.activeGuildId ? String(user.activeGuildId) : "";
  const activeGuildRole = user?.activeGuildAppRole ? String(user.activeGuildAppRole) : "";

  return (
    <Layout title="Personal Snail">
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ margin: "0 0 0.5rem" }}>Personal Snail</h2>
        <p style={{ margin: 0, opacity: 0.75 }}>
          Coming soon. This page is reserved for your personal snail (not guild-scoped).
        </p>
        <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", opacity: 0.75 }}>
          Active guild:{" "}
          <span style={{ fontFamily: "monospace" }}>
            {activeGuildId ? `${activeGuildId}${activeGuildRole ? ` (${activeGuildRole})` : ""}` : "none"}
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: "1.25rem", display: "grid", gap: "0.5rem" }}>
        <div style={{ fontWeight: 700 }}>Planned</div>
        <div style={{ opacity: 0.8 }}>- Personal capture history</div>
        <div style={{ opacity: 0.8 }}>- Personal prompts and presets</div>
        <div style={{ opacity: 0.8 }}>- Personal analytics</div>
        <div style={{ opacity: 0.8 }}>- Personal notifications</div>
      </div>
    </Layout>
  );
}
