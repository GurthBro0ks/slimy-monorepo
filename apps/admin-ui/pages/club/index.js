"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useSession } from "../../lib/session";

export default function ClubIndex() {
  const { user, loading } = useSession();
  const router = useRouter();
  const activeGuildId = user?.activeGuildId ? String(user.activeGuildId) : "";

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!activeGuildId) {
      router.replace("/guilds");
      return;
    }
    router.replace(`/club/${activeGuildId}`);
  }, [loading, user, activeGuildId, router]);

  return (
    <Layout title="Club">
      <div className="card" style={{ padding: "1.25rem" }}>
        {loading ? "Loading…" : "Redirecting…"}
      </div>
    </Layout>
  );
}
