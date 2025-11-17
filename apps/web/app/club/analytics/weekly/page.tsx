"use client";

/**
 * Club Analytics v2: Weekly View Page
 *
 * Displays weekly deltas, tiers, and badges for all club members.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Award, RefreshCw, Calendar } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface MemberDelta {
  memberKey: string;
  displayName: string | null;
  rank: number | null;
  totalPower: string;
  powerDelta: string;
  simBalance: string | null;
  simDelta: string | null;
  tier: string | null;
  badges: string[];
}

interface WeeklyAnalytics {
  guildId: string;
  guildName: string;
  weekStart: string;
  weekEnd: string;
  members: MemberDelta[];
  totalMembers: number;
  message?: string;
}

const BADGE_METADATA: Record<string, { label: string; emoji: string; color: string }> = {
  top_gainer: { label: "Top Gainer", emoji: "📈", color: "text-green-500" },
  biggest_drop: { label: "Biggest Drop", emoji: "📉", color: "text-red-500" },
  most_powerful: { label: "Most Powerful", emoji: "⭐", color: "text-yellow-500" },
  rising_star: { label: "Rising Star", emoji: "🌟", color: "text-purple-500" },
  consistent: { label: "Consistent", emoji: "🎯", color: "text-blue-500" },
  whale: { label: "Whale", emoji: "🐋", color: "text-cyan-500" },
  new_member: { label: "New Member", emoji: "🆕", color: "text-orange-500" },
};

const TIER_COLORS: Record<string, string> = {
  I: "text-yellow-500 font-bold",
  II: "text-blue-500 font-semibold",
  III: "text-green-500",
  IV: "text-gray-500",
};

export default function WeeklyAnalyticsPage() {
  const [analytics, setAnalytics] = useState<WeeklyAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock guild ID - in real app this would come from auth context or URL params
  const guildId = "guild-123"; // Replace with actual guild ID from context

  useEffect(() => {
    loadWeeklyAnalytics();
  }, []);

  const loadWeeklyAnalytics = async (compute = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("guildId", guildId);
      if (compute) params.set("compute", "true");

      const response = await fetch(`/api/club-analytics/weekly?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load analytics");
      }

      const data: WeeklyAnalytics = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error loading weekly analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComputeAnalytics = async () => {
    setIsComputing(true);
    await loadWeeklyAnalytics(true);
    setIsComputing(false);
  };

  const formatNumber = (value: string | number): string => {
    const num = typeof value === "string" ? parseInt(value, 10) : value;
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(2)}B`;
    } else if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }
    return num.toString();
  };

  const formatDelta = (delta: string): { text: string; color: string; icon: JSX.Element } => {
    const num = parseInt(delta, 10);
    if (num > 0) {
      return {
        text: `+${formatNumber(num)}`,
        color: "text-green-500",
        icon: <TrendingUp className="h-4 w-4" />,
      };
    } else if (num < 0) {
      return {
        text: formatNumber(num),
        color: "text-red-500",
        icon: <TrendingDown className="h-4 w-4" />,
      };
    }
    return {
      text: "0",
      color: "text-gray-500",
      icon: <span className="h-4 w-4" />,
    };
  };

  const formatDate = (isoDate: string): string => {
    return new Date(isoDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ProtectedRoute requiredRole="club">
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold">Weekly Club Analytics</h1>
              <p className="text-muted-foreground">
                Track member power deltas, tiers, and performance badges
              </p>
            </div>
            <Button
              onClick={handleComputeAnalytics}
              disabled={isLoading || isComputing}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isComputing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Computing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recompute Analytics
                </>
              )}
            </Button>
          </div>

          {/* Week Info Card */}
          {analytics && (
            <Card className="mb-6 bg-zinc-900/40 border-emerald-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                  <CardTitle className="text-lg">Week Overview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Guild</p>
                    <p className="text-lg font-semibold">{analytics.guildName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Week Start</p>
                    <p className="text-lg font-semibold">{formatDate(analytics.weekStart)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Week End</p>
                    <p className="text-lg font-semibold">{formatDate(analytics.weekEnd)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Members</p>
                    <p className="text-lg font-semibold text-emerald-500">{analytics.totalMembers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && !analytics && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="bg-red-900/20 border-red-500/30">
              <CardContent className="pt-6">
                <p className="text-red-500">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* No Data State */}
          {analytics && analytics.members.length === 0 && (
            <Card className="bg-zinc-900/40 border-yellow-500/30">
              <CardContent className="pt-6">
                <p className="text-yellow-500">
                  {analytics.message || "No analytics data available for this week."}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Click "Recompute Analytics" to generate data from snapshots.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Members Table */}
          {analytics && analytics.members.length > 0 && (
            <Card className="bg-zinc-900/40 border-emerald-500/30">
              <CardHeader>
                <CardTitle>Member Performance</CardTitle>
                <CardDescription>
                  Showing {analytics.members.length} members with weekly power deltas and tier assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="py-3 px-4 text-left text-sm font-semibold">Rank</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold">Member</th>
                        <th className="py-3 px-4 text-right text-sm font-semibold">Current Power</th>
                        <th className="py-3 px-4 text-right text-sm font-semibold">Weekly Δ</th>
                        <th className="py-3 px-4 text-center text-sm font-semibold">Tier</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold">Badges</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.members.map((member, index) => {
                        const delta = formatDelta(member.powerDelta);
                        return (
                          <tr
                            key={member.memberKey}
                            className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                          >
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {member.rank || index + 1}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium">
                              {member.displayName || member.memberKey}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-mono">
                              {formatNumber(member.totalPower)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right">
                              <div className={`flex items-center justify-end gap-1 ${delta.color}`}>
                                {delta.icon}
                                <span className="font-mono">{delta.text}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`text-sm font-semibold ${TIER_COLORS[member.tier || "IV"]}`}>
                                {member.tier || "IV"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {member.badges.map((badgeId) => {
                                  const badge = BADGE_METADATA[badgeId];
                                  if (!badge) return null;
                                  return (
                                    <span
                                      key={badgeId}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-zinc-800/50"
                                      title={badge.label}
                                    >
                                      <span>{badge.emoji}</span>
                                      <span className={badge.color}>{badge.label}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Badge Legend */}
          <Card className="mt-6 bg-zinc-900/40 border-emerald-500/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-500" />
                <CardTitle className="text-lg">Badge Legend</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(BADGE_METADATA).map(([id, badge]) => (
                  <div key={id} className="flex items-center gap-2 text-sm">
                    <span>{badge.emoji}</span>
                    <span className={badge.color}>{badge.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
