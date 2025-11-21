"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/callout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth/context";
import {
  Gauge,
  Code,
  Image as ImageIcon,
  Calculator,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Code {
  code: string;
  source: "snelp" | "reddit";
  ts: string;
  tags: string[];
  expires: string | null;
  region: string;
  description?: string;
}

interface SnailEvent {
  event: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

interface CodesResponse {
  codes: Code[];
  count: number;
  timestamp: string;
}

interface SnailHistoryResponse {
  ok: boolean;
  events: SnailEvent[];
  count: number;
}

export default function SnailHubPage() {
  const { user } = useAuth();
  const [codesLoading, setCodesLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeCodes, setActiveCodes] = useState<Code[]>([]);
  const [recentEvents, setRecentEvents] = useState<SnailEvent[]>([]);
  const [adminApiConfigured, setAdminApiConfigured] = useState(false);

  // Check if Admin API is configured
  useEffect(() => {
    const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE;
    setAdminApiConfigured(!!adminApiBase);
  }, []);

  // Fetch active codes
  const fetchActiveCodes = useCallback(async () => {
    setCodesLoading(true);
    try {
      const response = await fetch("/api/codes?scope=active");
      if (response.ok) {
        const data: CodesResponse = await response.json();
        // Take top 5 codes
        setActiveCodes(data.codes.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to fetch codes:", error);
    } finally {
      setCodesLoading(false);
    }
  }, []);

  // Fetch snail history
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch("/api/snail/history");
      if (response.ok) {
        const data: SnailHistoryResponse = await response.json();
        // Take latest 3 events
        setRecentEvents(data.events.slice(0, 3));
      }
    } catch (error) {
      console.error("Failed to fetch snail history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveCodes();
    fetchHistory();
  }, [fetchActiveCodes, fetchHistory]);

  const getSourceBadge = (source: Code["source"]) => {
    switch (source) {
      case "snelp":
        return <Badge variant="default" className="text-xs">Snelp</Badge>;
      case "reddit":
        return <Badge variant="secondary" className="text-xs">Reddit</Badge>;
    }
  };

  const getStatusIndicator = () => {
    if (adminApiConfigured) {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-500">Admin API Connected</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <span className="text-sm text-yellow-500">Sandbox Mode</span>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 mb-2">
                <Gauge className="h-8 w-8 text-neon-green" />
                <h1 className="text-4xl font-bold">Snail Hub</h1>
              </div>
              {getStatusIndicator()}
            </div>
            <p className="text-muted-foreground">
              Central hub for your Supersnail stats, codes, and analysis
            </p>
          </div>

          {/* Main Grid Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Snapshot & Latest Activity */}
            <div className="space-y-6 lg:col-span-2">
              {/* My Snail Snapshot */}
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  My Snail Snapshot
                </h2>
                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-neon-green" />
                      <CardTitle>Snail Status</CardTitle>
                    </div>
                    <CardDescription>
                      {user ? `Welcome back, ${user.displayName || user.username}!` : "Welcome!"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {adminApiConfigured ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Your snail data is synced with the Admin API.
                        </p>
                        <div className="flex gap-2">
                          <Link href="/snail/codes">
                            <Button variant="neon" size="sm">
                              View Secret Codes
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Callout variant="note" className="text-sm">
                          Running in sandbox mode. Connect Admin API to sync your snail data.
                        </Callout>
                        <p className="text-sm text-muted-foreground">
                          You can still access codes, timeline, and other tools.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Latest Activity */}
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Latest Activity
                </h2>
                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-neon-green" />
                      <CardTitle>Recent Events</CardTitle>
                    </div>
                    <CardDescription>
                      Latest updates from your snail timeline
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {historyLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : recentEvents.length > 0 ? (
                      <div className="space-y-3">
                        {recentEvents.map((event, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-zinc-900/60 p-3"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{event.event}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <Link href="/snail">
                          <Button variant="ghost" size="sm" className="w-full text-neon-green">
                            View Full Timeline →
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">
                          No activity yet. Start using snail features to see your timeline.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Right Column - Quick Actions & Active Codes */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Quick Actions
                </h2>
                <div className="grid gap-3">
                  <Link href="/snail/codes">
                    <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors shadow-sm cursor-pointer">
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-3">
                          <Code className="h-6 w-6 text-neon-green" />
                          <div>
                            <CardTitle className="text-base">Secret Codes</CardTitle>
                            <CardDescription className="text-xs">
                              View all active codes
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>

                  <Link href="/snail">
                    <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors shadow-sm cursor-pointer">
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-3">
                          <Clock className="h-6 w-6 text-neon-green" />
                          <div>
                            <CardTitle className="text-base">Timeline</CardTitle>
                            <CardDescription className="text-xs">
                              View event history
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>

                  <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm opacity-60">
                    <CardHeader className="p-4">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="h-6 w-6 text-neon-green" />
                        <div>
                          <CardTitle className="text-base">Screenshot Analysis</CardTitle>
                          <CardDescription className="text-xs">
                            Coming soon
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm opacity-60">
                    <CardHeader className="p-4">
                      <div className="flex items-center gap-3">
                        <Calculator className="h-6 w-6 text-neon-green" />
                        <div>
                          <CardTitle className="text-base">Tier Calculator</CardTitle>
                          <CardDescription className="text-xs">
                            Coming soon
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              </section>

              {/* Active Codes Preview */}
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Active Codes
                </h2>
                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent Secret Codes</CardTitle>
                    <CardDescription className="text-xs">
                      Top 5 active codes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {codesLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : activeCodes.length > 0 ? (
                      <div className="space-y-2">
                        {activeCodes.map((code, index) => (
                          <div
                            key={`${code.code}-${index}`}
                            className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-zinc-900/60 p-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-mono truncate">{code.code}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {code.description || `Added ${new Date(code.ts).toLocaleDateString()}`}
                              </p>
                            </div>
                            {getSourceBadge(code.source)}
                          </div>
                        ))}
                        <Link href="/snail/codes">
                          <Button variant="ghost" size="sm" className="w-full text-neon-green mt-2">
                            View All Codes →
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <XCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No active codes found
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
