"use client";

import { createAdminApiClient } from "@slimy/admin-api-client";

export function createWebCentralSettingsClient(opts?: { csrfToken?: string | null }) {
  const headers: Record<string, string> = {
    "x-slimy-client": "web",
  };

  if (opts?.csrfToken) {
    headers["x-csrf-token"] = String(opts.csrfToken);
  }

  return createAdminApiClient({
    baseUrl: "/api",
    defaultHeaders: headers,
  });
}

