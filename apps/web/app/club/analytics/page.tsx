"use client";

/**
 * Club Analytics Page - Power Tracking
 *
 * Initial scaffolding for Club Analytics v1 - displays club member power snapshots
 * and provides a basic UI for viewing the latest snapshot data. Feature-flagged and safe:
 * gracefully handles missing data and API errors.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { TrendingUp, Users, Loader2, AlertCircle, Database } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface ClubMember {
  id: number;
  memberKey: string;
  totalPower: string;
  simPower: string;
  rank: number | null;
}

interface ClubSnapshot {
  id: number;
  guildId: string;
  capturedAt: string;
  metadata: any;
  memberCount: number;
  members: ClubMember[];
}

interface SnapshotResponse {
  ok: boolean;
  snapshot?: ClubSnapshot;
  error?: string;
  message?: string;
}

export default function ClubAnalyticsPage() {
  const [snapshot, setSnapshot] = useState<ClubSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Get guildId from auth context / user selection
  // For now, using a placeholder that will gracefully fail
  const guildId = process.env.NEXT_PUBLIC_DEFAULT_GUILD_ID || 'placeholder-guild-id';

  useEffect(() => {
    loadLatestSnapshot();
  }, []);

  const loadLatestSnapshot = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/club-analytics/latest?guildId=${encodeURIComponent(guildId)}`);
      const data: SnapshotResponse = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.message || data.error || 'Failed to load snapshot');
        setSnapshot(null);
      } else if (data.snapshot) {
        setSnapshot(data.snapshot);
      }
    } catch (err) {
      console.error('Failed to load club analytics:', err);
      setError('Network error - could not connect to API');
      setSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPower = (power: string): string => {
    try {
      const num = BigInt(power);
      const numStr = num.toString();

      // Format with commas
      return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } catch {
      return power;
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <ProtectedRoute requiredRole="club">
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">Club Power Analytics</h1>
            <p className="text-muted-foreground">
              Track and analyze club member power levels over time
            </p>
          </div>

          <Callout variant="note" className="mb-6 text-sm">
            Displaying the latest power snapshot for your club. Snapshots are captured periodically.
          </Callout>

          {/* Loading State */}
          {isLoading && (
            <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading club analytics...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <Card className="rounded-2xl border border-red-500/30 bg-zinc-900/40">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center max-w-md">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-500 font-semibold mb-2">Could not load snapshot</p>
                  <p className="text-muted-foreground text-sm">{error}</p>
                  <p className="text-muted-foreground text-xs mt-4">
                    This feature may not be configured yet. Check environment variables.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Snapshot Data */}
          {!isLoading && !error && snapshot && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-6 lg:grid-cols-3 mb-8">
                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                  <CardHeader>
                    <Database className="h-10 w-10 text-neon-green mb-2" />
                    <CardTitle>Snapshot Info</CardTitle>
                    <CardDescription>Latest data capture</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Snapshot ID:</span>
                        <span className="font-semibold text-neon-green">#{snapshot.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Captured:</span>
                        <span className="font-semibold text-neon-green text-xs">
                          {formatDate(snapshot.capturedAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                  <CardHeader>
                    <Users className="h-10 w-10 text-neon-green mb-2" />
                    <CardTitle>Member Count</CardTitle>
                    <CardDescription>Total members tracked</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-neon-green">
                      {snapshot.memberCount}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                  <CardHeader>
                    <TrendingUp className="h-10 w-10 text-neon-green mb-2" />
                    <CardTitle>Total Power</CardTitle>
                    <CardDescription>Combined club power</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-neon-green">
                      {formatPower(
                        snapshot.members
                          .reduce((sum, m) => sum + BigInt(m.totalPower), BigInt(0))
                          .toString()
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Member Table */}
              <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                <CardHeader>
                  <CardTitle>Member Power Breakdown</CardTitle>
                  <CardDescription>
                    Individual member statistics (sorted by rank)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-emerald-500/30">
                        <tr className="text-left">
                          <th className="pb-3 font-semibold text-emerald-500">Rank</th>
                          <th className="pb-3 font-semibold text-emerald-500">Member</th>
                          <th className="pb-3 font-semibold text-emerald-500 text-right">Total Power</th>
                          <th className="pb-3 font-semibold text-emerald-500 text-right">Sim Power</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.members.map((member, index) => (
                          <tr
                            key={member.id}
                            className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                          >
                            <td className="py-3">
                              <span className="text-muted-foreground">
                                {member.rank !== null ? `#${member.rank}` : '-'}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="font-medium">{member.memberKey}</span>
                            </td>
                            <td className="py-3 text-right font-mono text-neon-green">
                              {formatPower(member.totalPower)}
                            </td>
                            <td className="py-3 text-right font-mono text-blue-400">
                              {formatPower(member.simPower)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {snapshot.members.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No member data available in this snapshot
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Empty State */}
          {!isLoading && !error && !snapshot && (
            <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No snapshot data available yet</p>
                  <p className="text-muted-foreground text-sm mt-2">
                    Snapshots will appear here once data is ingested
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
