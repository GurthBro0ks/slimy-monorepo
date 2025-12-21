"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "../lib/session";
import Layout from "../components/Layout";

/**
 * Standalone settings page. Redirects to /club/<guildId>/settings if a guild is active,
 * otherwise shows personal settings only.
 */
export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (loading) return;

    // If user has an active guild, redirect to the guild-scoped settings page
    if (user?.activeGuildId) {
      router.replace(`/club/${user.activeGuildId}/settings`);
    }
  }, [loading, user?.activeGuildId, router]);

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
          </>
        )}
      </div>
    </Layout>
  );
}
