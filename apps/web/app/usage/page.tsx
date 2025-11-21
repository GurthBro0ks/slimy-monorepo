"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Activity,
  DollarSign,
  Image as ImageIcon,
  Zap
} from "lucide-react";
import { isConfigured } from "@/lib/http-client";
import { fetchHealthStatus, type HealthResponse } from "@/lib/api/health";
import { fetchUsageSummary, type UsageSummary } from "@/lib/api/usage";

// Mock data for sandbox mode
const MOCK_USAGE: UsageSummary = {
  totalTokens: 1247893,
  totalCostUsd: 24.56,
  totalImages: 342,
  totalRequests: 1856,
};

export default function UsagePage() {
  // Health check state
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);

  // Usage metrics state
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Check if admin API is configured
  const apiConfigured = isConfigured();

  // Fetch health status
  const checkHealth = useCallback(async () => {
    setIsHealthLoading(true);
    try {
      const result = await fetchHealthStatus();
      setHealth(result);
    } catch (error) {
      setHealth({
        ok: false,
        ts: new Date().toISOString(),
        status: 'down',
        message: error instanceof Error ? error.message : 'Health check failed',
      });
    } finally {
      setIsHealthLoading(false);
    }
  }, []);

  // Fetch usage metrics
  const loadUsage = useCallback(async () => {
    // Don't fetch if not configured
    if (!apiConfigured) {
      return;
    }

    setIsUsageLoading(true);
    setUsageError(null);

    try {
      const result = await fetchUsageSummary();
      setUsage(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load usage metrics';
      setUsageError(errorMessage);
      console.error('[UsagePage] Failed to fetch usage:', error);
    } finally {
      setIsUsageLoading(false);
    }
  }, [apiConfigured]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      checkHealth(),
      loadUsage(),
    ]);
    setRefreshing(false);
  }, [checkHealth, loadUsage]);

  // Initial load
  useEffect(() => {
    checkHealth();
    loadUsage();
  }, [checkHealth, loadUsage]);

  // Determine which data to display
  const displayUsage = (apiConfigured && usage !== null) ? usage : MOCK_USAGE;
  const isShowingMockData = !apiConfigured || usage === null;
  const dataSource = apiConfigured
    ? (usage !== null ? 'live admin-api' : 'mock (failed to load)')
    : 'mock (sandbox)';

  // Health status helpers
  const getHealthIcon = (status?: HealthResponse['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'sandbox':
        return <Activity className="h-5 w-5 text-blue-500" />;
      default:
        return <Skeleton className="h-5 w-5" />;
    }
  };

  const getHealthBadge = (status?: HealthResponse['status']) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-green-600">Operational</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-600">Degraded</Badge>;
      case 'down':
        return <Badge variant="destructive">Down</Badge>;
      case 'sandbox':
        return <Badge variant="secondary">Sandbox</Badge>;
      default:
        return <Skeleton className="h-5 w-16" />;
    }
  };

  return (
    <div className="container px-4 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold">Usage Metrics</h1>
            <p className="text-muted-foreground">
              Monitor your API usage and spending
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Health Status Card */}
        <Card className="mb-6 rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getHealthIcon(health?.status)}
                <div>
                  <CardTitle className="text-lg">Admin API Health</CardTitle>
                  {isHealthLoading ? (
                    <Skeleton className="h-4 w-48 mt-1" />
                  ) : (
                    health?.message && (
                      <CardDescription className="text-xs sm:text-sm">
                        {health.message}
                      </CardDescription>
                    )
                  )}
                </div>
              </div>
              {getHealthBadge(health?.status)}
            </div>
          </CardHeader>
        </Card>

        {/* Data Source Indicator */}
        <div className="mb-4 text-xs text-muted-foreground">
          Data source: <span className="font-mono">{dataSource}</span>
          {isShowingMockData && usageError && (
            <span className="ml-2 text-yellow-500">
              ({usageError})
            </span>
          )}
        </div>

        {/* Usage Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Tokens Card */}
          <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isUsageLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {displayUsage.totalTokens.toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Across all requests
              </p>
            </CardContent>
          </Card>

          {/* Total Cost Card */}
          <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isUsageLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  ${displayUsage.totalCostUsd.toFixed(2)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                USD spent
              </p>
            </CardContent>
          </Card>

          {/* Total Images Card */}
          <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Images</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isUsageLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {displayUsage.totalImages.toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Images generated
              </p>
            </CardContent>
          </Card>

          {/* Total Requests Card */}
          <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isUsageLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {displayUsage.totalRequests.toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                API calls made
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Help */}
        {!apiConfigured && (
          <Card className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-900/10 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Running in Sandbox Mode</CardTitle>
              <CardDescription>
                To view real usage metrics, configure the Admin API base URL:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code className="block rounded bg-zinc-900 px-3 py-2 text-xs">
                NEXT_PUBLIC_ADMIN_API_BASE=https://your-admin-api.example.com
              </code>
              <p className="mt-2 text-xs text-muted-foreground">
                Add this environment variable to your <code>.env.local</code> file and restart the development server.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
