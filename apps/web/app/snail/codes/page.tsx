"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyBox } from "@/components/ui/copy-box";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/callout";
import { RefreshCw, Search, Filter } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  fetchSnailCodes,
  isConfigured,
  type SnailCode,
  type SnailCodeSource,
  type SnailCodeStatus,
} from "@/lib/api/snail-codes";

/**
 * Snail Codes Page
 *
 * Displays aggregated Super Snail codes from multiple sources.
 * Features:
 * - Live data from admin-api when configured
 * - Sandbox mode with mock data when admin-api is not available
 * - Filtering by source and status
 * - Summary statistics
 * - Connection status badge
 */
export default function CodesPage() {
  // State management
  const [codes, setCodes] = useState<SnailCode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SnailCodeSource | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SnailCodeStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Check if admin-api is configured
  const apiConfigured = isConfigured();

  /**
   * Load codes from API with current filters
   */
  const loadCodes = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const filters: {
        source?: SnailCodeSource;
        status?: SnailCodeStatus;
      } = {};

      if (sourceFilter !== "all") {
        filters.source = sourceFilter;
      }
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }

      const data = await fetchSnailCodes(filters);
      setCodes(data);
    } catch (err) {
      console.error("Failed to load snail codes", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load codes";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [sourceFilter, statusFilter]);

  /**
   * Load codes when component mounts or filters change
   */
  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  /**
   * Handle refresh button click
   */
  const handleRefresh = () => {
    loadCodes(true);
  };

  /**
   * Client-side search filtering
   */
  const filteredCodes = codes.filter((code) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      code.code.toLowerCase().includes(query) ||
      code.notes?.toLowerCase().includes(query) ||
      code.source.toLowerCase().includes(query)
    );
  });

  /**
   * Calculate summary statistics
   */
  const stats = {
    total: filteredCodes.length,
    active: filteredCodes.filter((c) => c.status === "active").length,
    expired: filteredCodes.filter((c) => c.status === "expired").length,
    unknown: filteredCodes.filter((c) => c.status === "unknown").length,
  };

  /**
   * Get all codes as text for copy-all feature
   */
  const allCodesText = filteredCodes.map((c) => c.code).join("\n");

  /**
   * Get badge variant for source
   */
  const getSourceBadge = (source: SnailCodeSource) => {
    switch (source) {
      case "snelp":
        return <Badge variant="default">Snelp</Badge>;
      case "reddit":
        return <Badge variant="secondary">Reddit</Badge>;
      case "discord":
        return <Badge className="bg-indigo-500">Discord</Badge>;
      case "twitter":
        return <Badge className="bg-blue-400">Twitter</Badge>;
      case "other":
        return <Badge variant="outline">Other</Badge>;
    }
  };

  /**
   * Get badge variant for status
   */
  const getStatusBadge = (status: SnailCodeStatus) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "unknown":
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <ProtectedRoute>
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="mb-2 text-4xl font-bold">📜 Snail Codes</h1>
                <p className="text-muted-foreground">
                  Aggregated Super Snail codes from Snelp, Reddit, Discord, and more
                </p>
              </div>
              {/* Connection Status Badge */}
              <div>
                {apiConfigured ? (
                  <Badge className="bg-emerald-500">
                    Live • Admin API Connected
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    Sandbox • Admin API Not Configured
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <Callout variant="error" className="mb-6">
              <p className="font-semibold">Error loading codes</p>
              <p className="text-sm">{error}</p>
              {!apiConfigured && (
                <p className="mt-2 text-sm">
                  Using sandbox data. Configure NEXT_PUBLIC_ADMIN_API_BASE to
                  connect to live data.
                </p>
              )}
            </Callout>
          )}

          {/* Summary Stats */}
          {!isLoading && (
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Total Codes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-500">
                    {stats.active}
                  </div>
                  <p className="text-xs text-muted-foreground">Active</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-500">
                    {stats.expired}
                  </div>
                  <p className="text-xs text-muted-foreground">Expired</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-gray-500">
                    {stats.unknown}
                  </div>
                  <p className="text-xs text-muted-foreground">Unknown</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Actions */}
          <div className="mb-6 flex flex-col gap-4">
            {/* Source and Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Source:</span>
              <Button
                variant={sourceFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSourceFilter("all")}
              >
                All
              </Button>
              <Button
                variant={sourceFilter === "snelp" ? "default" : "outline"}
                size="sm"
                onClick={() => setSourceFilter("snelp")}
              >
                Snelp
              </Button>
              <Button
                variant={sourceFilter === "reddit" ? "default" : "outline"}
                size="sm"
                onClick={() => setSourceFilter("reddit")}
              >
                Reddit
              </Button>
              <Button
                variant={sourceFilter === "discord" ? "default" : "outline"}
                size="sm"
                onClick={() => setSourceFilter("discord")}
              >
                Discord
              </Button>
              <Button
                variant={sourceFilter === "twitter" ? "default" : "outline"}
                size="sm"
                onClick={() => setSourceFilter("twitter")}
              >
                Twitter
              </Button>
              <Button
                variant={sourceFilter === "other" ? "default" : "outline"}
                size="sm"
                onClick={() => setSourceFilter("other")}
              >
                Other
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Status:</span>
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "expired" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("expired")}
              >
                Expired
              </Button>
              <Button
                variant={statusFilter === "unknown" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("unknown")}
              >
                Unknown
              </Button>
            </div>
          </div>

          {/* Search and Refresh */}
          <div className="mb-6 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search codes or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="ml-2">Refresh</span>
            </Button>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              {/* Copy All Codes */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Copy All Codes</CardTitle>
                  <CardDescription>
                    {filteredCodes.length} code
                    {filteredCodes.length !== 1 ? "s" : ""} available
                    {searchQuery && ` (filtered from ${codes.length})`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CopyBox content={allCodesText} label="Copy All" />
                </CardContent>
              </Card>

              {/* No Results */}
              {filteredCodes.length === 0 ? (
                <Callout variant="warn">
                  {searchQuery ? (
                    <>No codes found matching &quot;{searchQuery}&quot;</>
                  ) : (
                    <>No codes available with the selected filters</>
                  )}
                </Callout>
              ) : (
                /* Codes List */
                <div className="space-y-4">
                  {filteredCodes.map((code, index) => (
                    <Card key={`${code.code}-${index}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="font-mono text-lg">
                              {code.code}
                            </CardTitle>
                            <CardDescription>
                              {code.notes || "No additional notes"}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            {getSourceBadge(code.source)}
                            {getStatusBadge(code.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {code.discoveredAt && (
                            <span>
                              Discovered:{" "}
                              {new Date(code.discoveredAt).toLocaleDateString()}
                            </span>
                          )}
                          {code.discoveredAt && code.lastCheckedAt && (
                            <span>•</span>
                          )}
                          {code.lastCheckedAt && (
                            <span>
                              Last checked:{" "}
                              {new Date(code.lastCheckedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
