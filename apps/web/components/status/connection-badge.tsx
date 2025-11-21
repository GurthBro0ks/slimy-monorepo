"use client";

import { useEffect, useState } from "react";
import { isConfigured } from "@/lib/http-client";
import { fetchHealthStatus } from "@/lib/api/health";

type ConnectionStatus = "sandbox" | "operational" | "degraded" | "down";

export function ConnectionBadge() {
  const [status, setStatus] = useState<ConnectionStatus>(
    isConfigured() ? "down" : "sandbox",
  );

  useEffect(() => {
    if (!isConfigured()) return;

    let cancelled = false;

    (async () => {
      try {
        const result = await fetchHealthStatus();
        // Map the health response status to our internal status
        const healthStatus = result.status ?? "down";
        if (!cancelled) {
          setStatus(healthStatus);
        }
      } catch {
        if (!cancelled) {
          setStatus("down");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "sandbox") {
    return (
      <>
        <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
        <span>Sandbox – admin-api not configured</span>
      </>
    );
  }

  let dotClass = "bg-red-500";
  let text = "Admin API: down";

  if (status === "operational") {
    dotClass = "bg-emerald-400";
    text = "Admin API: operational";
  } else if (status === "degraded") {
    dotClass = "bg-amber-400";
    text = "Admin API: degraded";
  }

  return (
    <>
      <span className={`inline-flex h-2 w-2 rounded-full ${dotClass}`} />
      <span>{text}</span>
    </>
  );
}
