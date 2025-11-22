"use client";

import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * ConnectionBadge - Shows admin-api connection status
 */
export function ConnectionBadge() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE;

      if (!adminApiBase) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${adminApiBase}/api/health`, {
          credentials: "include",
        });
        setIsConnected(response.ok);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();

    // Recheck every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-1">
        <Wifi className="h-3 w-3" />
        Checking...
      </Badge>
    );
  }

  if (isConnected) {
    return (
      <Badge variant="outline" className="gap-1 border-emerald-500/50 text-emerald-500">
        <Wifi className="h-3 w-3" />
        Live
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 border-orange-500/50 text-orange-500">
      <WifiOff className="h-3 w-3" />
      Sandbox
    </Badge>
  );
}
