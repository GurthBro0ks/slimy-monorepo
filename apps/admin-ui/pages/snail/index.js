"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useSession } from "../../lib/session";

export default function SnailHome() {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <Layout title="Personal Snail">
        <div className="card" style={{ padding: "1.25rem" }}>Loading session…</div>
      </Layout>
    );
  }

  return (
    <Layout title="Personal Snail">
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ margin: "0 0 0.5rem" }}>Personal Snail</h2>
        <p style={{ margin: 0, opacity: 0.75 }}>
          Coming soon. This page is reserved for your personal snail (not guild-scoped).
        </p>
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
