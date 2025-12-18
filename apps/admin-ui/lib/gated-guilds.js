"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import { useSession } from "./session";

export function useGatedGuilds() {
  const { user, loading: sessionLoading } = useSession();
  const [state, setState] = useState({ guilds: [], loading: true, error: null });

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      setState({ guilds: [], loading: false, error: null });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const data = await apiFetch("/api/guilds");
        const guilds = Array.isArray(data?.guilds) ? data.guilds : [];
        if (!cancelled) setState({ guilds, loading: false, error: null });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!cancelled) setState({ guilds: [], loading: false, error: message || "Failed to load guilds" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionLoading, user]);

  return state;
}

