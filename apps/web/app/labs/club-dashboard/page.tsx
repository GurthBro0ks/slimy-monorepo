"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Zap,
  Activity,
  Award,
  BarChart3,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  MOCK_CLUB_SUMMARY,
  calculateDashboardStats,
  formatPower,
  formatPercentChange,
  getChangeColorClass,
  type ClubSummary,
  type ClubMember,
  type ClubDashboardStats,
} from "./mock-data";

export default function ClubDashboardPage() {
  const [clubData, setClubData] = useState<ClubSummary | null>(null);
  const [stats, setStats] = useState<ClubDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real API call
    // const response = await fetch('/api/labs/club-summary?clubId=your-club-id');
    // const data = await response.json();
    // setClubData(data);

    // Simulate API call delay
    setTimeout(() => {
      setClubData(MOCK_CLUB_SUMMARY);
      setStats(calculateDashboardStats(MOCK_CLUB_SUMMARY));
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading || !clubData || !stats) {
    return (
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Activity className="h-12 w-12 animate-pulse text-emerald-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Loading club dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">{clubData.clubName}</h1>
            <Badge variant="outline" className="text-sm">
              Labs Demo
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Week {clubData.currentWeek.weekNumber} • {clubData.currentWeek.weekStart} to {clubData.currentWeek.weekEnd}
          </p>
        </div>

        <Callout variant="info" className="mb-6">
          <strong>Demo Mode:</strong> This dashboard uses mock data. See TODO comments in the code for
          integration points with real APIs.
        </Callout>

        {/* Summary Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Power */}
          <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Power
                </CardTitle>
                <Zap className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-green">
                {formatPower(stats.totalPower)}
              </div>
              <div className={`flex items-center text-sm mt-1 ${getChangeColorClass(stats.totalPowerChange)}`}>
                {stats.totalPowerChange >= 0 ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                {formatPercentChange(stats.totalPowerChange)} from last week
              </div>
            </CardContent>
          </Card>

          {/* Sim Power */}
          <Card className="rounded-2xl border border-blue-500/30 bg-zinc-900/40 shadow-sm hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sim Power
                </CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {formatPower(stats.simPower)}
              </div>
              <div className={`flex items-center text-sm mt-1 ${getChangeColorClass(stats.simPowerChange)}`}>
                {stats.simPowerChange >= 0 ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                {formatPercentChange(stats.simPowerChange)} from last week
              </div>
            </CardContent>
          </Card>

          {/* Active Members */}
          <Card className="rounded-2xl border border-purple-500/30 bg-zinc-900/40 shadow-sm hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Members
                </CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">
                {stats.activeMembers}/{clubData.currentWeek.totalMemberCount}
              </div>
              <div className={`flex items-center text-sm mt-1 ${getChangeColorClass(stats.activeMembersChange)}`}>
                {stats.activeMembersChange >= 0 ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                {stats.activeMembersChange > 0 && '+'}{stats.activeMembersChange} from last week
              </div>
            </CardContent>
          </Card>

          {/* Average Power */}
          <Card className="rounded-2xl border border-amber-500/30 bg-zinc-900/40 shadow-sm hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Member Power
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">
                {formatPower(stats.averagePower)}
              </div>
              <div className={`flex items-center text-sm mt-1 ${getChangeColorClass(stats.averagePowerChange)}`}>
                {stats.averagePowerChange >= 0 ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                {formatPercentChange(stats.averagePowerChange)} from last week
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Member Contributions Table */}
        <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Member Contributions</CardTitle>
                <CardDescription>
                  Current week performance and rankings
                </CardDescription>
              </div>
              <Award className="h-6 w-6 text-neon-green" />
            </div>
          </CardHeader>
          <CardContent>
            {/* TODO: Replace with sortable, filterable table component in production */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Rank
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Member
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Sim Power
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Total Power
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Weekly Contribution
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Change
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clubData.members.map((member: ClubMember) => (
                    <tr
                      key={member.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3 px-2 text-center">
                        {member.rank <= 3 ? (
                          <div className="flex items-center justify-center">
                            <Award
                              className={`h-5 w-5 ${
                                member.rank === 1
                                  ? 'text-yellow-500'
                                  : member.rank === 2
                                  ? 'text-gray-400'
                                  : 'text-amber-700'
                              }`}
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{member.rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium">{member.name}</td>
                      <td className="py-3 px-4 text-right text-blue-400">
                        {formatPower(member.simPower)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400">
                        {formatPower(member.totalPower)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {formatPower(member.weeklyContribution)}
                      </td>
                      <td className={`py-3 px-4 text-right ${getChangeColorClass(member.weeklyChange)}`}>
                        <div className="flex items-center justify-end">
                          {member.weeklyChange >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {formatPercentChange(member.weeklyChange)}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {member.isActive ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                            Inactive
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Weekly History Chart Placeholder */}
        <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly Power Trend</CardTitle>
                <CardDescription>
                  Last 4 weeks performance overview
                </CardDescription>
              </div>
              <BarChart3 className="h-6 w-6 text-neon-green" />
            </div>
          </CardHeader>
          <CardContent>
            {/* TODO: Integrate a chart library (recharts, chart.js, etc.) for production */}
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
                <p className="font-medium">Chart Placeholder</p>
                <p className="text-sm mt-1">
                  Install a chart library (e.g., recharts) to visualize weekly trends
                </p>
                <div className="mt-4 text-xs space-y-1">
                  {clubData.weeklyHistory.map((week) => (
                    <div key={week.weekNumber} className="flex justify-between max-w-md mx-auto">
                      <span>Week {week.weekNumber}:</span>
                      <span className="text-emerald-500">{formatPower(week.totalPower)}</span>
                      <span className="text-blue-500">{formatPower(week.totalSimPower)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Notes */}
        <Callout variant="note" className="mt-8">
          <div className="space-y-2">
            <p className="font-semibold">Implementation TODOs:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Replace mock data with API call to <code>/api/labs/club-summary</code></li>
              <li>Add real authentication and guild ID from user context</li>
              <li>Implement chart library for weekly trends visualization</li>
              <li>Add data export functionality (CSV/Google Sheets)</li>
              <li>Add member detail view/modal on row click</li>
              <li>Implement real-time updates with polling or WebSockets</li>
              <li>Add filters and sorting for member table</li>
              <li>Connect to actual database using ClubAnalyticsRepository pattern</li>
            </ul>
          </div>
        </Callout>
      </div>
    </div>
  );
}
