"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/slimecraft/StatusPill";
import { Section } from "@/components/slimecraft/Section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, Server, Users, Gauge, Globe, Gamepad2, AlertCircle } from "lucide-react";

interface ServerStatus {
  online: boolean;
  hostname?: string;
  port?: number;
  version?: string;
  protocol?: number;
  players?: {
    online: number;
    max: number;
  };
  motd?: string;
  gamemode?: string;
  latency?: number;
  error?: string;
}

export default function StatusPage() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/bedrock-status");
      const data = await response.json();
      setStatus(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch server status:", error);
      setStatus({
        online: false,
        error: "Failed to fetch server status. Please try again later.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            Server <span className="text-neon-green">Status</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Real-time information about slime.craft
          </p>
        </div>

        {/* Main Status Card */}
        <Card className="border-emerald-500/30 bg-zinc-900/40 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">Server Status</CardTitle>
                {lastUpdated && (
                  <CardDescription>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </CardDescription>
                )}
              </div>
              <Button
                onClick={fetchStatus}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-neon-green mx-auto mb-4" />
                <p className="text-muted-foreground">Loading server status...</p>
              </div>
            ) : status ? (
              <div className="space-y-6">
                {/* Status Indicator */}
                <div className="flex items-center justify-center py-4">
                  <StatusPill online={status.online} className="text-lg px-6 py-3" />
                </div>

                {/* Error Message */}
                {status.error && (
                  <Alert className="border-red-500/30 bg-red-500/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{status.error}</AlertDescription>
                  </Alert>
                )}

                {/* Server Details Grid */}
                {status.online && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {status.hostname && (
                      <div className="p-4 rounded-lg border border-emerald-500/20 bg-zinc-950/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Globe className="h-5 w-5 text-neon-green" />
                          <span className="text-sm text-muted-foreground">Address</span>
                        </div>
                        <p className="text-lg font-mono font-semibold">
                          {status.hostname}:{status.port}
                        </p>
                      </div>
                    )}

                    {status.players && (
                      <div className="p-4 rounded-lg border border-emerald-500/20 bg-zinc-950/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="h-5 w-5 text-neon-green" />
                          <span className="text-sm text-muted-foreground">Players</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {status.players.online} / {status.players.max}
                        </p>
                      </div>
                    )}

                    {status.version && (
                      <div className="p-4 rounded-lg border border-emerald-500/20 bg-zinc-950/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Server className="h-5 w-5 text-neon-green" />
                          <span className="text-sm text-muted-foreground">Version</span>
                        </div>
                        <p className="text-lg font-semibold">{status.version}</p>
                      </div>
                    )}

                    {status.latency !== undefined && (
                      <div className="p-4 rounded-lg border border-emerald-500/20 bg-zinc-950/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Gauge className="h-5 w-5 text-neon-green" />
                          <span className="text-sm text-muted-foreground">Latency</span>
                        </div>
                        <p className="text-lg font-semibold">{status.latency}ms</p>
                      </div>
                    )}

                    {status.gamemode && (
                      <div className="p-4 rounded-lg border border-emerald-500/20 bg-zinc-950/50 md:col-span-2">
                        <div className="flex items-center gap-3 mb-2">
                          <Gamepad2 className="h-5 w-5 text-neon-green" />
                          <span className="text-sm text-muted-foreground">Game Mode</span>
                        </div>
                        <p className="text-lg font-semibold">{status.gamemode}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* MOTD */}
                {status.motd && (
                  <div className="p-4 rounded-lg border border-emerald-500/20 bg-zinc-950/50">
                    <p className="text-sm text-muted-foreground mb-2">Message of the Day</p>
                    <p className="text-base italic">{status.motd}</p>
                  </div>
                )}
              </div>
            ) : (
              <Alert className="border-red-500/30 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Unable to Load Status</AlertTitle>
                <AlertDescription>
                  Could not retrieve server status. Please try refreshing the page.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Server Information */}
        <Section title="About This Page">
          <Card className="border-emerald-500/30 bg-zinc-900/40">
            <CardContent className="pt-6">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  This page shows real-time information about the slime.craft Minecraft Bedrock
                  server. The status is updated automatically when you visit this page, and you can
                  manually refresh it using the button above.
                </p>
                <p>
                  <strong className="text-foreground">Having trouble connecting?</strong> If the
                  server shows as online but you can't connect, try the following:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Verify you're using the correct server address and port</li>
                  <li>Make sure your Minecraft version matches the server version</li>
                  <li>Check your internet connection</li>
                  <li>Restart your Minecraft client</li>
                  <li>Ask for help in our Discord server</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2 mt-8">
          <Card className="border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">Need Connection Help?</CardTitle>
              <CardDescription>
                Learn how to connect to slime.craft on any device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <a href="/slime.craft/how-to-join">View Connection Guide</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">Review Server Rules</CardTitle>
              <CardDescription>
                Make sure you understand our community guidelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <a href="/slime.craft/rules">Read the Rules</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
