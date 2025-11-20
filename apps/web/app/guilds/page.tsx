"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Shield, RefreshCw, ExternalLink } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import Link from "next/link";

interface Guild {
  id: string;
  discordId: string;
  name: string;
  iconUrl?: string | null;
  ownerId?: string | null;
  settings?: Record<string, any>;
  memberCount?: number;
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function GuildsPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ syncedCount: number; total: number } | null>(null);

  const fetchGuilds = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/guilds");
      if (!response.ok) {
        throw new Error("Failed to fetch guilds");
      }

      const data = await response.json();
      setGuilds(data.guilds || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load guilds");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSyncResult(null);

      const response = await fetch("/api/guilds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to sync guilds");
      }

      const result = await response.json();
      setSyncResult({
        syncedCount: result.syncedCount,
        total: result.total,
      });

      // Refresh the guild list
      await fetchGuilds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync guilds");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchGuilds();
  }, []);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-10 w-10 text-neon-purple" />
              <div>
                <h1 className="text-4xl font-bold">Guild Management</h1>
                <p className="text-muted-foreground">
                  Manage Discord guilds and bot configuration
                </p>
              </div>
            </div>
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              Sync from Discord
            </Button>
          </div>

          {error && (
            <Callout variant="error" className="mb-8">
              {error}
            </Callout>
          )}

          {syncResult && (
            <Callout variant="success" className="mb-8">
              Successfully synced {syncResult.syncedCount} of {syncResult.total} guilds from Discord
            </Callout>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Connected Guilds ({guilds.length})</CardTitle>
              <CardDescription>
                Guilds where the Slimy bot is installed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading guilds...</p>
              ) : guilds.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No guilds found. Click "Sync from Discord" to import guilds.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {guilds.map((guild) => (
                    <div
                      key={guild.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {guild.iconUrl ? (
                          <img
                            src={guild.iconUrl}
                            alt={guild.name}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Shield className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{guild.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ID: {guild.discordId}
                            {guild.memberCount !== undefined && ` • ${guild.memberCount} members`}
                          </p>
                        </div>
                      </div>
                      <Link href={`/guilds/${guild.id}`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                          View Details
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
