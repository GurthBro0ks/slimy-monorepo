"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/callout";
import { RefreshCw, Upload, Eye, AlertCircle, CheckCircle, Clock } from "lucide-react";
import {
  fetchScreenshotAnalyses,
  type ScreenshotAnalysis,
  type ScreenshotStatus,
} from "@/lib/api/screenshots";

/**
 * Screenshot Analysis Page
 *
 * Displays recent screenshot analyses with support for:
 * - Live data from Admin API
 * - Sandbox fallback mode
 * - Status filtering
 * - Refresh functionality
 */
export default function ScreenshotsPage() {
  const [items, setItems] = useState<ScreenshotAnalysis[]>([]);
  const [filteredItems, setFilteredItems] = useState<ScreenshotAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | ScreenshotStatus>(
    "all"
  );

  const loadAnalyses = useCallback(async (hardRefresh = false) => {
    if (hardRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await fetchScreenshotAnalyses();
      setItems(data);
    } catch (err) {
      console.error("[ScreenshotsPage] Failed to load analyses:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  // Filter by status
  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter((item) => item.status === statusFilter));
    }
  }, [items, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "parsed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "parsed":
        return (
          <Badge variant="default" className="bg-green-500">
            Parsed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500">
            Pending
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">Error</Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      snail_city: "City",
      club_power: "Club Power",
      snail_stats: "Stats",
      inventory: "Inventory",
    };

    return (
      <Badge variant="outline">
        {typeLabels[type] || type}
      </Badge>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Unknown";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const parsedCount = items.filter((i) => i.status === "parsed").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Screenshot Analysis</h1>
          <p className="text-muted-foreground">
            AI-powered screenshot parsing and analysis for Super Snail
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === "all" ? "neon" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All ({items.length})
            </Button>
            <Button
              variant={statusFilter === "parsed" ? "neon" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("parsed")}
            >
              Parsed ({parsedCount})
            </Button>
            <Button
              variant={statusFilter === "pending" ? "neon" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
            >
              Pending ({pendingCount})
            </Button>
            <Button
              variant={statusFilter === "error" ? "neon" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("error")}
            >
              Errors ({errorCount})
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAnalyses(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        {/* Upload Notice */}
        <Callout variant="note" className="mb-6">
          <div className="flex items-start gap-3">
            <Upload className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Upload Feature Coming Soon</p>
              <p className="text-sm">
                Direct screenshot upload and analysis will be available in a
                future update. For now, viewing recent analyses from the demo
                service.
              </p>
            </div>
          </div>
        </Callout>

        {/* TODO: Wire upload control to a future /api/screenshots/analyze endpoint for real OCR/analysis */}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            {/* Empty State */}
            {filteredItems.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Analyses Found
                  </h3>
                  <p className="text-muted-foreground">
                    {statusFilter !== "all"
                      ? `No ${statusFilter} analyses to display.`
                      : "No screenshot analyses available yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              /* Analysis List */
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">{getStatusIcon(item.status)}</div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {item.description || item.fileName || "Untitled"}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {item.fileName && (
                                <span className="font-mono text-xs">
                                  {item.fileName}
                                </span>
                              )}
                              {item.source && (
                                <span className="ml-2">
                                  • Source: {item.source}
                                </span>
                              )}
                              {item.createdAt && (
                                <span className="ml-2">
                                  • {formatDate(item.createdAt)}
                                </span>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          {getStatusBadge(item.status)}
                          {getTypeBadge(item.type)}
                        </div>
                      </div>
                    </CardHeader>

                    {/* Details */}
                    {item.details && (
                      <CardContent>
                        <div className="rounded-md bg-muted p-4">
                          <p className="text-sm font-semibold mb-2">
                            Analysis Details:
                          </p>
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(item.details, null, 2)}
                          </pre>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
