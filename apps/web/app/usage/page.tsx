"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Zap,
  Image as ImageIcon,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  getUsageSummary,
  getUsageBreakdown,
  getUsageTimeseries,
  type UsageSummary,
  type UsageBreakdown,
  type UsageTimeseriesPoint,
  type GetUsageOptions,
} from "@/lib/api/usage";
import { adminApiClient } from "@/lib/api/admin-client";

type TimeRange = "24h" | "7d" | "30d";

export default function UsagePage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [breakdown, setBreakdown] = useState<UsageBreakdown[]>([]);
  const [timeseries, setTimeseries] = useState<UsageTimeseriesPoint[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingBreakdown, setLoadingBreakdown] = useState(true);
  const [loadingTimeseries, setLoadingTimeseries] = useState(true);

  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [errorBreakdown, setErrorBreakdown] = useState<string | null>(null);
  const [errorTimeseries, setErrorTimeseries] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const isSandbox = !adminApiClient.isConfigured();

  // Fetch summary data
  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      setErrorSummary(null);
      const data = await getUsageSummary();
      setSummary(data);
    } catch (error) {
      console.error("Failed to fetch usage summary:", error);
      setErrorSummary("Failed to load usage summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch breakdown data
  const fetchBreakdown = async () => {
    try {
      setLoadingBreakdown(true);
      setErrorBreakdown(null);
      const data = await getUsageBreakdown();
      setBreakdown(data);
    } catch (error) {
      console.error("Failed to fetch usage breakdown:", error);
      setErrorBreakdown("Failed to load usage breakdown");
    } finally {
      setLoadingBreakdown(false);
    }
  };

  // Fetch timeseries data
  const fetchTimeseries = async (range: TimeRange) => {
    try {
      setLoadingTimeseries(true);
      setErrorTimeseries(null);
      const data = await getUsageTimeseries({ timeRange: range });
      setTimeseries(data);
    } catch (error) {
      console.error("Failed to fetch usage timeseries:", error);
      setErrorTimeseries("Failed to load usage timeseries");
    } finally {
      setLoadingTimeseries(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSummary();
    fetchBreakdown();
    fetchTimeseries(timeRange);
  }, []);

  // Refetch timeseries when time range changes
  useEffect(() => {
    fetchTimeseries(timeRange);
  }, [timeRange]);

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSummary(),
      fetchBreakdown(),
      fetchTimeseries(timeRange),
    ]);
    setRefreshing(false);
  };

  // Format numbers
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatCurrency = (num: number): string => {
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="container px-4 py-16">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold">Usage Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your API usage, costs, and trends
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isSandbox ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Sandbox Mode
              </Badge>
            ) : (
              <Badge className="flex items-center gap-1 bg-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Live Data
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Tokens"
            value={summary ? formatNumber(summary.totalTokens) : null}
            icon={<Zap className="h-5 w-5 text-yellow-500" />}
            loading={loadingSummary}
            error={errorSummary}
          />
          <SummaryCard
            title="Total Cost"
            value={summary ? formatCurrency(summary.totalCostUsd) : null}
            icon={<DollarSign className="h-5 w-5 text-green-500" />}
            loading={loadingSummary}
            error={errorSummary}
          />
          <SummaryCard
            title="Total Requests"
            value={summary ? formatNumber(summary.totalRequests) : null}
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
            loading={loadingSummary}
            error={errorSummary}
          />
          <SummaryCard
            title="Total Images"
            value={summary ? formatNumber(summary.totalImages) : null}
            icon={<ImageIcon className="h-5 w-5 text-purple-500" />}
            loading={loadingSummary}
            error={errorSummary}
          />
        </div>

        {/* Usage Breakdown */}
        <Card className="mb-8 rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle>Usage Breakdown</CardTitle>
            </div>
            <CardDescription>Usage distribution across features</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBreakdown ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : errorBreakdown ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                {errorBreakdown}
              </div>
            ) : breakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No usage data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium text-right">Tokens</th>
                      <th className="pb-3 font-medium text-right">Requests</th>
                      <th className="pb-3 font-medium text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((item, index) => (
                      <tr
                        key={item.category}
                        className={index !== breakdown.length - 1 ? "border-b border-border/50" : ""}
                      >
                        <td className="py-3">
                          <span className="font-medium capitalize">{item.category}</span>
                        </td>
                        <td className="py-3 text-right font-mono text-sm">
                          {formatNumber(item.tokens)}
                        </td>
                        <td className="py-3 text-right font-mono text-sm">
                          {formatNumber(item.requests)}
                        </td>
                        <td className="py-3 text-right font-mono text-sm">
                          {formatCurrency(item.costUsd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Over Time */}
        <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <CardTitle>Usage Over Time</CardTitle>
                </div>
                <CardDescription>Token usage and cost trends</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={timeRange === "24h" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("24h")}
                >
                  24h
                </Button>
                <Button
                  variant={timeRange === "7d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("7d")}
                >
                  7d
                </Button>
                <Button
                  variant={timeRange === "30d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("30d")}
                >
                  30d
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTimeseries ? (
              <Skeleton className="h-64 w-full" />
            ) : errorTimeseries ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                {errorTimeseries}
              </div>
            ) : timeseries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No timeseries data available</p>
            ) : (
              <TimeseriesChart data={timeseries} timeRange={timeRange} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// Summary Card Component
// ============================================================================

interface SummaryCardProps {
  title: string;
  value: string | null;
  icon: React.ReactNode;
  loading: boolean;
  error: string | null;
}

function SummaryCard({ title, value, icon, loading, error }: SummaryCardProps) {
  return (
    <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : error ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          <div className="text-2xl font-bold">{value || "0"}</div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Timeseries Chart Component
// ============================================================================

interface TimeseriesChartProps {
  data: UsageTimeseriesPoint[];
  timeRange: TimeRange;
}

function TimeseriesChart({ data, timeRange }: TimeseriesChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  // Calculate max values for scaling
  const maxTokens = Math.max(...data.map(d => d.tokens));
  const maxCost = Math.max(...data.map(d => d.costUsd));

  // Chart dimensions
  const width = 100; // percentage
  const height = 256; // pixels
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };

  const chartWidth = width;
  const chartHeight = height - padding.top - padding.bottom;

  // Format date labels
  const formatDate = (ts: string) => {
    const date = new Date(ts);
    if (timeRange === "24h") {
      return date.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Tokens</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Cost (USD)</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: `${height}px` }}>
        <svg width="100%" height={height} className="overflow-visible">
          {/* Y-axis labels (Tokens) */}
          <text
            x={padding.left - 10}
            y={padding.top - 5}
            className="fill-muted-foreground text-xs"
            textAnchor="end"
          >
            {(maxTokens / 1000).toFixed(0)}K
          </text>
          <text
            x={padding.left - 10}
            y={height - padding.bottom + 5}
            className="fill-muted-foreground text-xs"
            textAnchor="end"
          >
            0
          </text>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2="100%"
            y2={padding.top}
            className="stroke-border"
            strokeWidth="1"
            strokeDasharray="4"
          />
          <line
            x1={padding.left}
            y1={height / 2}
            x2="100%"
            y2={height / 2}
            className="stroke-border"
            strokeWidth="1"
            strokeDasharray="4"
          />
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2="100%"
            y2={height - padding.bottom}
            className="stroke-border"
            strokeWidth="1"
          />

          {/* Bars */}
          {data.map((point, index) => {
            const barWidth = (chartWidth - padding.left - padding.right) / data.length * 0.8;
            const x = padding.left + (index / data.length) * (chartWidth - padding.left - padding.right) + barWidth * 0.1;
            const tokenHeight = (point.tokens / maxTokens) * chartHeight;
            const y = height - padding.bottom - tokenHeight;

            return (
              <g key={point.ts}>
                {/* Token bar */}
                <rect
                  x={`${x}%`}
                  y={y}
                  width={`${barWidth}%`}
                  height={tokenHeight}
                  className="fill-emerald-500/80 hover:fill-emerald-500"
                  rx="2"
                >
                  <title>
                    {formatDate(point.ts)}: {point.tokens.toLocaleString()} tokens, ${point.costUsd.toFixed(2)}
                  </title>
                </rect>

                {/* X-axis label */}
                {(index % Math.ceil(data.length / 6) === 0 || index === data.length - 1) && (
                  <text
                    x={`${x + barWidth / 2}%`}
                    y={height - padding.bottom + 20}
                    className="fill-muted-foreground text-xs"
                    textAnchor="middle"
                  >
                    {formatDate(point.ts)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Data summary */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border/50 bg-card/50 p-4 text-sm md:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Total Tokens</p>
          <p className="font-mono font-semibold">
            {data.reduce((sum, d) => sum + d.tokens, 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Avg Tokens</p>
          <p className="font-mono font-semibold">
            {Math.round(data.reduce((sum, d) => sum + d.tokens, 0) / data.length).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Total Cost</p>
          <p className="font-mono font-semibold">
            ${data.reduce((sum, d) => sum + d.costUsd, 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Avg Cost</p>
          <p className="font-mono font-semibold">
            ${(data.reduce((sum, d) => sum + d.costUsd, 0) / data.length).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
