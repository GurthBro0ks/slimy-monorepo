"use client";

import { useState, useEffect } from "react";

/**
 * Server status response shape
 * This matches the expected response from /api/bedrock-status
 */
export interface ServerStatus {
  online: boolean;
  players?: {
    online: number;
    max: number;
  };
  version?: string;
  motd?: string;
  latency?: number;
}

/**
 * Hook to fetch Minecraft server status
 *
 * TODO: The /api/bedrock-status endpoint is referenced in the Caddyfile
 * (infra/docker/Caddyfile.slimy-nuc2:10) but has not been implemented yet.
 *
 * Once implemented, this hook will fetch real-time server status.
 * Expected endpoint: GET /api/bedrock-status
 *
 * For now, this returns mock data. To implement the real endpoint:
 * 1. Create apps/web/app/api/bedrock-status/route.ts
 * 2. Use a library like 'minecraft-server-util' to query mc.slimyai.xyz
 * 3. Return ServerStatus shape
 */
export function useBedrockStatus() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        setIsLoading(true);
        setError(null);

        // TODO: Replace with actual API call when endpoint is implemented
        // const response = await fetch('/api/bedrock-status');
        // if (!response.ok) {
        //   throw new Error(`HTTP error! status: ${response.status}`);
        // }
        // const data = await response.json();
        // setStatus(data);

        // Mock data for now
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

        setStatus({
          online: true,
          players: {
            online: 0,
            max: 20,
          },
          version: "1.21.x (Java + Bedrock)",
          motd: "Welcome to slime.craft!",
          latency: 42,
        });

        setError("Using mock data - API endpoint not yet implemented");
      } catch (err) {
        console.error("Failed to fetch server status:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch server status");
        setStatus(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();

    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  return { status, isLoading, error };
}
