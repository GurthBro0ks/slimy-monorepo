"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { Users, TrendingUp, Trophy, Activity, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { fetchClubLatest, getSandboxStatus, type ClubMemberMetrics } from "@/lib/api/club";
import { CommandShell } from "@/components/CommandShell";

export default function ClubPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<ClubMemberMetrics[]>([]);
  const guildId = "guild-123"; // TODO: Get from auth context
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadClubMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchClubLatest(guildId);

      if (response.ok) {
        setMembers(response.members);
      } else {
        setError('Failed to load club metrics');
        setMembers([]);
      }
    } catch (err) {
      console.error('Error loading club metrics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  // Load club metrics on mount
  useEffect(() => {
    loadClubMetrics();
  }, [loadClubMetrics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadClubMetrics();
    setIsRefreshing(false);
  };

  // Calculate summary statistics
  const totalMembers = members.length;
  const totalClubPower = members.reduce((sum, m) => sum + (m.totalPower || 0), 0);
  const avgChangePercent = members.length > 0
    ? members.reduce((sum, m) => sum + (m.changePercent || 0), 0) / members.length
    : 0;
  const topMember = members.length > 0
    ? members.reduce((top, m) => (m.totalPower || 0) > (top.totalPower || 0) ? m : top, members[0])
    : null;

  // Sort members by total power (descending)
  const sortedMembers = [...members].sort((a, b) => (b.totalPower || 0) - (a.totalPower || 0));

  // Check if we're in sandbox mode
  const sandboxStatus = getSandboxStatus();

  return (
    <ProtectedRoute requiredRole="club">
      <CommandShell title="Club Analytics" breadcrumbs="Home / Club" statusText="Window: Fri–Sun">
        <div className="container px-4 py-8 mx-auto">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="mb-2 text-4xl font-bold flex items-center gap-3">
                  <Users className="h-10 w-10 text-neon-green" />
                  Club Analytics
                </h1>
                <p className="text-muted-foreground">
                  Latest power metrics for your club members
                </p>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Sandbox Mode Indicator */}
            {sandboxStatus.isSandbox && (
              <Callout variant="note" className="mb-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    <strong>Sandbox Mode:</strong> Showing example data. Configure NEXT_PUBLIC_ADMIN_API_BASE to connect to live data.
                  </span>
                </div>
              </Callout>
            )}

            {/* Error State */}
            {error && !loading && (
              <Callout variant="error" className="mb-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    <strong>Error loading club metrics</strong>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </Callout>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
                <span className="ml-3 text-muted-foreground">Loading club metrics...</span>
              </div>
            )}

            {/* Summary Cards */}
            {!loading && members.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {/* Total Members */}
                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-neon-green" />
                      Total Members
                    </CardDescription>
                    <CardTitle className="text-3xl font-bold text-neon-green">
                      {totalMembers}
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* Total Club Power */}
                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-neon-green" />
                      Total Club Power
                    </CardDescription>
                    <CardTitle className="text-3xl font-bold text-neon-green">
                      {totalClubPower.toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* Average Change */}
                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-neon-green" />
                      Average Change
                    </CardDescription>
                    <CardTitle className={`text-3xl font-bold ${avgChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {avgChangePercent >= 0 ? '+' : ''}{avgChangePercent.toFixed(1)}%
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* Top Member */}
                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-neon-green" />
                      Top Member
                    </CardDescription>
                    <CardTitle className="text-xl font-bold text-neon-green truncate">
                      {topMember?.name || 'N/A'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {topMember?.totalPower?.toLocaleString() || '0'} power
                    </p>
                  </CardHeader>
                </Card>
              </div>
            )}

            {/* Members Table */}
            {!loading && members.length > 0 && (
              <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                <CardHeader>
                  <CardTitle>Member Rankings</CardTitle>
                  <CardDescription>
                    Ranked by total power (descending)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Rank</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Name</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">SIM Power</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Total Power</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Change</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Last Seen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedMembers.map((member, index) => (
                          <tr
                            key={member.memberKey}
                            className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                                {index === 1 && <Trophy className="h-4 w-4 text-gray-400" />}
                                {index === 2 && <Trophy className="h-4 w-4 text-amber-700" />}
                                <span className="font-semibold">{index + 1}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium">{member.name}</td>
                            <td className="py-3 px-4 text-right font-mono">
                              {member.simPower?.toLocaleString() ?? 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-neon-green">
                              {member.totalPower?.toLocaleString() ?? 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {member.changePercent !== null ? (
                                <span
                                  className={`font-semibold ${
                                    member.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                                  }`}
                                >
                                  {member.changePercent >= 0 ? '+' : ''}
                                  {member.changePercent.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {member.lastSeenAt
                                ? new Date(member.lastSeenAt).toLocaleString()
                                : 'Unknown'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!loading && members.length === 0 && !error && (
              <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                <CardContent className="py-12 text-center">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Club Metrics Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Upload and process screenshots to populate club analytics.
                  </p>
                  <Button asChild variant="outline">
                    <a href="/screenshots">Go to Screenshots</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </CommandShell>
    </ProtectedRoute>
  );
}
