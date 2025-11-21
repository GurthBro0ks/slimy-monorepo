/**
 * ConnectionBadge Component
 *
 * Displays the connection status to the admin API.
 * Shows "Live" when connected, "Sandbox" when running locally without admin API.
 */

"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { adminApiClient } from "@/lib/api/admin-client";
import { Wifi, WifiOff } from "lucide-react";

export function ConnectionBadge() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      setChecking(true);
      const configured = adminApiClient.isConfigured();
      setIsConfigured(configured);

      if (configured) {
        // Try to ping the health endpoint
        try {
          const response = await adminApiClient.get("/api/health");
          setIsLive(response.ok);
        } catch {
          setIsLive(false);
        }
      } else {
        setIsLive(false);
      }

      setChecking(false);
    };

    checkConnection();

    // Recheck every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  if (checking) {
    return (
      <Badge variant="outline" className="gap-1">
        <span className="h-2 w-2 animate-pulse rounded-full bg-gray-400" />
        Checking...
      </Badge>
    );
  }

  if (isLive) {
    return (
      <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
        <Wifi className="h-3 w-3" />
        Live
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <WifiOff className="h-3 w-3" />
      Sandbox
    </Badge>
  );
}
