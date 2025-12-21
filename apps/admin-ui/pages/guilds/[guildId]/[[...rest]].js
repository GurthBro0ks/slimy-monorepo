"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../../components/Layout";

export default function GuildRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const rawGuildId = router.query.guildId;
    const guildId = Array.isArray(rawGuildId) ? rawGuildId[0] : rawGuildId;
    if (!guildId) return;

    const rawRest = router.query.rest;
    const rest = Array.isArray(rawRest) ? rawRest : rawRest ? [rawRest] : [];
    const suffix = rest.length ? `/${rest.join("/")}` : "";
    router.replace(`/club/${guildId}${suffix}`);
  }, [router.isReady, router.query.guildId, router.query.rest, router]);

  return (
    <Layout title="Redirecting…">
      <div className="card" style={{ padding: "1.25rem" }}>Redirecting to club…</div>
    </Layout>
  );
}
