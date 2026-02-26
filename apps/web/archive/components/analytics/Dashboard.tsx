'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, Users, MessageSquare, Image, Gamepad2, Download } from 'lucide-react';

interface StatsSummary {
  totalEvents: number;
  uniqueUsers: number;
  topEventTypes: Array<{ event_type: string; count: number }>;
  topCategories: Array<{ event_category: string; count: number }>;
}

interface SystemMetrics {
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  summary: StatsSummary;
  dailyTrends: Array<{
    period: string;
    count: number;
    unique_users: number;
    unique_guilds: number;
  }>;
  health: {
    eventsPerDay: number;
    uniqueUsersPerDay: number;
  };
}

interface DashboardProps {
  className?: string;
}

export function Dashboard({ className }: DashboardProps) {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('7');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetchSystemMetrics();
  }, [timeRange]);

  useEffect(() => {
    // Set up Server-Sent Events for real-time updates
    const eventSource = new EventSource('/api/stats/events/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'stats_update') {
          // Update the metrics with real-time data
          setSystemMetrics(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              summary: data.data
            };
          });
          setIsLive(true);
        } else if (data.type === 'connected') {
          setIsLive(true);
        }
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsLive(false);
    };

    eventSource.onopen = () => {
      setIsLive(true);
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, []);

  const fetchSystemMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/stats?action=system-metrics&days=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch system metrics');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch metrics');
      }

      setSystemMetrics(data.systemMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/stats?action=events&limit=10000`);
      if (!response.ok) {
        throw new Error('Failed to fetch data for export');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Failed to fetch export data');
      }

      const events = data.events;

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stats-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV export
        const headers = ['timestamp', 'event_type', 'event_category', 'user_id', 'guild_id', 'channel_id'];
        const csvContent = [
          headers.join(','),
          ...events.map((event: any) =>
            headers.map(header => {
              const value = event[header];
              return value ? `"${String(value).replace(/"/g, '""')}"` : '';
            }).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stats-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed');
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-1" />
                <Skeleton className="h-3 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchSystemMetrics}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!systemMetrics) {
    return null;
  }

  const { summary, dailyTrends, health } = systemMetrics;

  return (
    <div className={className}>
      {/* Time Range Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <Badge variant="secondary">{timeRange} days</Badge>
          <Badge variant={isLive ? "default" : "outline"} className={isLive ? "bg-green-500" : ""}>
            {isLive ? "● Live" : "○ Offline"}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={timeRange === '7' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7')}
          >
            7 days
          </Button>
          <Button
            variant={timeRange === '30' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30')}
          >
            30 days
          </Button>
          <Button
            variant={timeRange === '90' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90')}
          >
            90 days
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {health.eventsPerDay.toFixed(1)} per day avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.uniqueUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {health.uniqueUsersPerDay.toFixed(1)} per day avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Event Type</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.topEventTypes[0]?.event_type || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.topEventTypes[0]?.count.toLocaleString() || 0} events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.topCategories[0]?.event_category || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.topCategories[0]?.count.toLocaleString() || 0} events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Daily Trends Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Daily Event Trends</CardTitle>
            <CardDescription>
              Events per day over the last {timeRange} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Chart Placeholder</p>
                <p className="text-sm text-gray-400">
                  Install Recharts or Chart.js to display interactive charts
                </p>
                <div className="mt-4 text-left max-w-xs mx-auto">
                  <p className="text-xs text-gray-600">
                    Sample data: {dailyTrends.slice(0, 3).map(trend =>
                      `${trend.period}: ${trend.count} events`
                    ).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Types Breakdown */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Event Types</CardTitle>
            <CardDescription>
              Distribution of event types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.topEventTypes.slice(0, 8).map((eventType, index) => (
                <div key={eventType.event_type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(${(index * 360) / 8}, 70%, 50%)` }}
                    />
                    <span className="text-sm font-medium">{eventType.event_type}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {eventType.count.toLocaleString()}
                  </span>
                </div>
              ))}
              {summary.topEventTypes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No event data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        {/* Categories Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Event Categories</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.topCategories.map((category, index) => (
                <div key={category.event_category} className="flex items-center justify-between">
                  <Badge variant="secondary" className="capitalize">
                    {category.event_category.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm font-medium">
                    {category.count.toLocaleString()}
                  </span>
                </div>
              ))}
              {summary.topCategories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No category data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Events/Day</span>
                <span className="text-sm font-medium">
                  {health.eventsPerDay.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Users/Day</span>
                <span className="text-sm font-medium">
                  {health.uniqueUsersPerDay.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Period</span>
                <span className="text-sm font-medium">
                  {new Date(systemMetrics.period.startDate).toLocaleDateString()} - {new Date(systemMetrics.period.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Data Freshness</span>
                <Badge variant="outline" className="text-xs">
                  Live
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
