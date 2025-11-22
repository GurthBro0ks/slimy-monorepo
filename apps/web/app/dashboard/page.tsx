"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageShell } from "@/components/layout/page-shell";
import { ConnectionBadge } from "@/components/layout/connection-badge";
import { SnailSnapshotCard } from "@/components/snail/snail-snapshot-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/context";
import { getUsageSummary, getUsageTimeseries, type UsageSummary, type UsageTimeseriesPoint } from "@/lib/api/usage";
import { getActiveSnailCodes, type SnailCode } from "@/lib/api/snail-codes";
import {
  LayoutDashboard,
  Zap,
  DollarSign,
  Activity,
  Code,
  Image as ImageIcon,
  Calculator,
  BarChart3,
  Users,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [usageTimeseries, setUsageTimeseries] = useState<UsageTimeseriesPoint[]>([]);
  const [activeCodes, setActiveCodes] = useState<SnailCode[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [loadingTimeseries, setLoadingTimeseries] = useState(true);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const isSandbox = !process.env.NEXT_PUBLIC_ADMIN_API_BASE;

  useEffect(() => {
    const fetchData = async () => {
      // Fetch usage summary
      try {
        const summary = await getUsageSummary();
        setUsageSummary(summary);
      } catch (error) {
        console.error("Failed to fetch usage summary:", error);
      } finally {
        setLoadingUsage(false);
      }

      // Fetch usage timeseries
      try {
        const timeseries = await getUsageTimeseries(7);
        setUsageTimeseries(timeseries);
      } catch (error) {
        console.error("Failed to fetch usage timeseries:", error);
      } finally {
        setLoadingTimeseries(false);
      }

      // Fetch active codes
      try {
        const codes = await getActiveSnailCodes();
        setActiveCodes(codes.slice(0, 5)); // Top 5
      } catch (error) {
        console.error("Failed to fetch active codes:", error);
      } finally {
        setLoadingCodes(false);
      }
    };

    fetchData();
  }, []);

  return (
    <ProtectedRoute>
      <PageShell
        icon={LayoutDashboard}
        title="Dashboard"
        subtitle="Overview of your Slimy usage, snail stats, and club tools"
        status={<ConnectionBadge />}
      >
        {/* Top Row: Snapshot + Usage Summary + Status */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Col 1: My Snail Snapshot */}
          <SnailSnapshotCard />

          {/* Col 2: Usage Summary */}
          <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
            <CardHeader>
              <Activity className="h-8 w-8 text-neon-green mb-2" />
              <CardTitle className="text-lg">Usage Summary</CardTitle>
              <CardDescription className="text-sm">
                {isSandbox ? "Sandbox data" : "Live usage data"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsage ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : usageSummary ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">Tokens</span>
                    </div>
                    <span className="font-semibold text-neon-green">
                      {usageSummary.tokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm text-muted-foreground">Cost</span>
                    </div>
                    <span className="font-semibold text-neon-green">
                      ${usageSummary.cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Requests</span>
                    </div>
                    <span className="font-semibold text-neon-green">
                      {usageSummary.requests.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Failed to load usage data</p>
              )}
            </CardContent>
          </Card>

          {/* Col 3: Status / Info */}
          <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-neon-green mb-2" />
              <CardTitle className="text-lg">Status</CardTitle>
              <CardDescription className="text-sm">System information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Connection Status */}
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Connection</span>
                  <ConnectionBadge />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isSandbox
                    ? "Sandbox mode - using mock data. Configure NEXT_PUBLIC_ADMIN_API_BASE to enable live mode."
                    : "Connected to admin-api - using live data"}
                </p>
              </div>

              {/* User Info */}
              {user && (
                <div className="p-3 rounded-lg bg-zinc-800/50 border border-emerald-500/20">
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-1">Logged in as</p>
                    <p className="font-semibold text-neon-green">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-1">Role: {user.role}</p>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              {usageSummary && (
                <div className="text-xs text-muted-foreground">
                  <p>• {usageSummary.images} images processed</p>
                  <p>• {activeCodes.length} active codes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Link href="/snail/codes">
              <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm hover:bg-zinc-900/60 hover:border-emerald-500/50 transition-all cursor-pointer h-full">
                <CardContent className="pt-6 pb-4 text-center">
                  <Code className="h-8 w-8 text-neon-green mx-auto mb-3" />
                  <p className="font-semibold text-sm">Snail Codes</p>
                  <p className="text-xs text-muted-foreground mt-1">Active codes</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/snail">
              <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm hover:bg-zinc-900/60 hover:border-emerald-500/50 transition-all cursor-pointer h-full">
                <CardContent className="pt-6 pb-4 text-center">
                  <ImageIcon className="h-8 w-8 text-neon-green mx-auto mb-3" />
                  <p className="font-semibold text-sm">Screenshot Analysis</p>
                  <p className="text-xs text-muted-foreground mt-1">Analyze snails</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/snail">
              <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm hover:bg-zinc-900/60 hover:border-emerald-500/50 transition-all cursor-pointer h-full">
                <CardContent className="pt-6 pb-4 text-center">
                  <Calculator className="h-8 w-8 text-neon-green mx-auto mb-3" />
                  <p className="font-semibold text-sm">Tier Calculator</p>
                  <p className="text-xs text-muted-foreground mt-1">Calculate upgrades</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/analytics">
              <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm hover:bg-zinc-900/60 hover:border-emerald-500/50 transition-all cursor-pointer h-full">
                <CardContent className="pt-6 pb-4 text-center">
                  <BarChart3 className="h-8 w-8 text-neon-green mx-auto mb-3" />
                  <p className="font-semibold text-sm">Usage Dashboard</p>
                  <p className="text-xs text-muted-foreground mt-1">View analytics</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/club">
              <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm hover:bg-zinc-900/60 hover:border-emerald-500/50 transition-all cursor-pointer h-full">
                <CardContent className="pt-6 pb-4 text-center">
                  <Users className="h-8 w-8 text-neon-green mx-auto mb-3" />
                  <p className="font-semibold text-sm">Club Analytics</p>
                  <p className="text-xs text-muted-foreground mt-1">Track performance</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Bottom Row: Mini Usage Chart + Codes Preview */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mini Usage Chart */}
          <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-neon-green mb-2" />
              <CardTitle className="text-lg">Usage Trend (Last 7 Days)</CardTitle>
              <CardDescription className="text-sm">
                {isSandbox ? "Sandbox usage data" : "Live usage data"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTimeseries ? (
                <Skeleton className="h-48 w-full" />
              ) : usageTimeseries.length > 0 ? (
                <div className="space-y-3">
                  {/* Simple SVG Chart */}
                  <svg viewBox="0 0 400 150" className="w-full h-40">
                    {/* Background grid */}
                    <line x1="0" y1="0" x2="0" y2="150" stroke="#333" strokeWidth="1" />
                    <line x1="0" y1="150" x2="400" y2="150" stroke="#333" strokeWidth="1" />

                    {/* Data points and line */}
                    {usageTimeseries.map((point, index) => {
                      const maxTokens = Math.max(...usageTimeseries.map((p) => p.tokens));
                      const x = (index / (usageTimeseries.length - 1)) * 380 + 10;
                      const y = 140 - (point.tokens / maxTokens) * 120;
                      const nextPoint = usageTimeseries[index + 1];
                      const nextX = nextPoint ? ((index + 1) / (usageTimeseries.length - 1)) * 380 + 10 : x;
                      const nextY = nextPoint ? 140 - (nextPoint.tokens / maxTokens) * 120 : y;

                      return (
                        <g key={index}>
                          {/* Line to next point */}
                          {nextPoint && (
                            <line
                              x1={x}
                              y1={y}
                              x2={nextX}
                              y2={nextY}
                              stroke="#10b981"
                              strokeWidth="2"
                            />
                          )}
                          {/* Point */}
                          <circle cx={x} cy={y} r="4" fill="#10b981" />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-muted-foreground">Avg Tokens</p>
                      <p className="font-semibold text-neon-green">
                        {Math.round(
                          usageTimeseries.reduce((sum, p) => sum + p.tokens, 0) / usageTimeseries.length
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Cost</p>
                      <p className="font-semibold text-neon-green">
                        $
                        {(
                          usageTimeseries.reduce((sum, p) => sum + p.cost, 0) / usageTimeseries.length
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Requests</p>
                      <p className="font-semibold text-neon-green">
                        {usageTimeseries.reduce((sum, p) => sum + p.requests, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No usage data available</p>
              )}
            </CardContent>
          </Card>

          {/* Active Codes Preview */}
          <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
            <CardHeader>
              <Code className="h-8 w-8 text-neon-green mb-2" />
              <CardTitle className="text-lg">Active Codes</CardTitle>
              <CardDescription className="text-sm">Latest secret codes for Super Snail</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCodes ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : activeCodes.length > 0 ? (
                <div className="space-y-2">
                  {activeCodes.map((code, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-zinc-800/50 border border-emerald-500/20 hover:bg-zinc-800/70 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-neon-green">{code.code}</code>
                        <span className="text-xs text-muted-foreground">{code.source}</span>
                      </div>
                      {code.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{code.notes}</p>
                      )}
                    </div>
                  ))}
                  <Link href="/snail/codes">
                    <p className="text-sm text-center text-emerald-500 hover:text-emerald-400 mt-3 cursor-pointer">
                      View all codes →
                    </p>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active codes right now</p>
              )}
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
