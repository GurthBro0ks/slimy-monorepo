'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface EventCount {
  type: string;
  count: number;
}

interface StatsSummary {
  success: boolean;
  since: string;
  counts: EventCount[];
  total: number;
}

type TimeRange = '24h' | '7d' | '30d';

export default function StatsPage() {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  useEffect(() => {
    fetchStats(timeRange);
  }, [timeRange]);

  const fetchStats = async (range: TimeRange) => {
    setLoading(true);
    setError(null);

    try {
      // Calculate the "since" date based on the selected time range
      const now = new Date();
      let since: Date;

      switch (range) {
        case '24h':
          since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const response = await fetch(`/api/stats/summary?since=${since.toISOString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case '24h': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
    }
  };

  // Event type display names
  const eventTypeLabels: Record<string, string> = {
    'chat_message': 'Chat Messages',
    'club_snapshot_created': 'Club Snapshots',
    'codes_lookup': 'Code Lookups',
    'command_used': 'Commands Used',
    'api_call': 'API Calls',
    'image_generated': 'Images Generated',
    'memory_updated': 'Memory Updates',
    'screenshot_analyzed': 'Screenshots Analyzed',
    'user_login': 'User Logins',
    'guild_joined': 'Guilds Joined',
  };

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold">Stats Dashboard</h1>
            <p className="text-muted-foreground">
              Event tracking and analytics for Slimy.ai
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {loading ? 'Loading...' : getTimeRangeLabel(timeRange)}
          </Badge>
        </div>

        {/* Time range selector */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={timeRange === '24h' ? 'default' : 'outline'}
            onClick={() => setTimeRange('24h')}
          >
            24 Hours
          </Button>
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-red-500">
            <CardContent className="p-4">
              <p className="text-red-500">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {loading && !summary && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading stats...</p>
            </CardContent>
          </Card>
        )}

        {!loading && summary && (
          <>
            {/* Summary card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Events</p>
                    <p className="text-3xl font-bold">{summary.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Event Types</p>
                    <p className="text-3xl font-bold">{summary.counts.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Since</p>
                    <p className="text-sm font-mono">{formatDate(summary.since)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event breakdown */}
            <div className="mb-6">
              <h2 className="mb-4 text-2xl font-bold">Event Breakdown</h2>
              {summary.counts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No events tracked in this time period
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {summary.counts.map((eventCount) => (
                    <Card key={eventCount.type}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          {eventTypeLabels[eventCount.type] || eventCount.type}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {eventCount.count.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {eventCount.type}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Event type table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.counts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No data available
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left font-medium">Event Type</th>
                          <th className="pb-2 text-right font-medium">Count</th>
                          <th className="pb-2 text-right font-medium">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.counts.map((eventCount) => (
                          <tr key={eventCount.type} className="border-b">
                            <td className="py-3">
                              <div>
                                <div className="font-medium">
                                  {eventTypeLabels[eventCount.type] || eventCount.type}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {eventCount.type}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-right font-semibold">
                              {eventCount.count.toLocaleString()}
                            </td>
                            <td className="py-3 text-right text-muted-foreground">
                              {((eventCount.count / summary.total) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold">
                          <td className="pt-3">Total</td>
                          <td className="pt-3 text-right">{summary.total.toLocaleString()}</td>
                          <td className="pt-3 text-right">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
