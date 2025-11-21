"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/callout";
import { RefreshCw, Upload, CheckCircle, Clock, XCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  fetchScreenshotAnalyses,
  type ScreenshotAnalysis,
} from "@/lib/api/screenshots";

export default function ScreenshotsPage() {
  const [items, setItems] = useState<ScreenshotAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchScreenshotAnalyses();
        if (!cancelled) {
          setItems(data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const data = await fetchScreenshotAnalyses();
      setItems(data);
    } finally {
      setRefreshing(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "parsed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "parsed":
        return <Badge variant="default">Parsed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      snail_city: "City Overview",
      club_power: "Club Power",
      snail_stats: "Snail Stats",
      other: "Other",
    };

    return <Badge variant="outline">{typeLabels[type] || type}</Badge>;
  };

  const getSourceBadge = (source?: string) => {
    if (!source) return null;

    const sourceLabels: Record<string, string> = {
      upload: "Upload",
      discord: "Discord",
      manual: "Manual",
    };

    return <Badge variant="secondary">{sourceLabels[source] || source}</Badge>;
  };

  return (
    <ProtectedRoute>
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">Screenshot Analysis</h1>
            <p className="text-muted-foreground">
              Recent screenshot analyses and parsing results
            </p>
          </div>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="neon"
              size="sm"
              disabled
            >
              <Upload className="h-4 w-4" />
              <span className="ml-2">Upload Screenshot</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="ml-2">Refresh</span>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              {items.length === 0 ? (
                <Callout variant="info">
                  No screenshot analyses found. Upload a screenshot to get started.
                </Callout>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(item.status)}
                              <CardTitle className="text-lg">
                                {item.description || item.fileName || "Untitled"}
                              </CardTitle>
                            </div>
                            <CardDescription className="mt-1">
                              {item.fileName && (
                                <>
                                  File: {item.fileName}
                                  {item.createdAt && (
                                    <> • Uploaded {new Date(item.createdAt).toLocaleDateString()}</>
                                  )}
                                </>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-2">
                          {getStatusBadge(item.status)}
                          {getTypeBadge(item.type)}
                          {getSourceBadge(item.source)}
                        </div>

                        {item.details && (
                          <div className="mt-4 rounded-md bg-muted p-3">
                            <h4 className="mb-2 text-sm font-semibold">Details</h4>
                            <pre className="text-xs">
                              {JSON.stringify(item.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Upload UI placeholder */}
          <div className="mt-8">
            <Callout variant="warn">
              <strong>TODO:</strong> Screenshot upload and analysis will hook into future endpoints.
              Currently showing demo data from the service.
            </Callout>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
