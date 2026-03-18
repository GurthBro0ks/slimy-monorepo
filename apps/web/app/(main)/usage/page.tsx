"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/callout";
import { AlertTriangle, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { UsageData } from "@/lib/usage-thresholds";
import { fetchUsageData } from "@/lib/api/usage";

const statusIcons: Record<NonNullable<UsageData["modelProbeStatus"]>, React.ReactElement> = {
  ok: <CheckCircle className="h-5 w-5 text-green-500" />,
  soft_cap: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  hard_cap: <XCircle className="h-5 w-5 text-red-500" />,
};

const statusText: Record<NonNullable<UsageData["modelProbeStatus"]>, string> = {
  ok: "Operating normally",
  soft_cap: "Approaching limit - consider upgrading",
  hard_cap: "Limit reached - actions disabled",
};

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsage() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchUsageData();
        setUsage(data);
      } catch (err) {
        console.error("Failed to fetch usage:", err);
        setError(err instanceof Error ? err.message : "Failed to load usage data");
      } finally {
        setLoading(false);
      }
    }

    loadUsage();
    // Refresh every 30 seconds
    const interval = setInterval(loadUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl" data-testid="usage-page">
        <h1 className="text-3xl font-bold mb-6">Usage Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <Card data-testid="usage-skeleton-card">
            <CardHeader>
              <Skeleton className="h-6 w-32" data-testid="usage-skeleton" />
              <Skeleton className="h-4 w-48 mt-2" data-testid="usage-skeleton" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-full" data-testid="usage-skeleton" />
            </CardContent>
          </Card>
          <Card data-testid="usage-skeleton-card">
            <CardHeader>
              <Skeleton className="h-6 w-32" data-testid="usage-skeleton" />
              <Skeleton className="h-4 w-48 mt-2" data-testid="usage-skeleton" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-full" data-testid="usage-skeleton" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl" data-testid="usage-page">
        <h1 className="text-3xl font-bold mb-6">Usage Dashboard</h1>
        <Callout variant="error" data-testid="usage-error">
          <div>
            <p className="font-bold">Error loading usage data</p>
            <p>{error}</p>
            <p className="mt-2 text-sm">
              Please try refreshing the page. If the problem persists, contact support.
            </p>
          </div>
        </Callout>
      </div>
    );
  }

  // Data not available (shouldn't happen, but defensive)
  if (!usage) {
    return (
      <div className="container mx-auto p-6 max-w-4xl" data-testid="usage-page">
        <h1 className="text-3xl font-bold mb-6">Usage Dashboard</h1>
        <Callout variant="warn">
          <div>
            <p className="font-bold">No usage data available</p>
            <p>Usage data is currently unavailable. Please try again later.</p>
          </div>
        </Callout>
      </div>
    );
  }

  // Calculate percentage, ensuring we don't divide by zero
  const percentage = usage.limit > 0
    ? Math.min(100, Math.max(0, Math.round((usage.currentSpend / usage.limit) * 100)))
    : 0;

  const remaining = Math.max(0, usage.limit - usage.currentSpend);
  const isNearLimit = percentage >= 90;
  const isOverLimit = percentage >= 100;

  // Defensive: ensure modelProbeStatus is valid
  const safeModelProbeStatus = (["ok", "soft_cap", "hard_cap"].includes(usage.modelProbeStatus)
    ? usage.modelProbeStatus
    : "ok") as NonNullable<UsageData["modelProbeStatus"]>;

  // Defensive: ensure level is a string
  const safeLevel = usage.level || "unknown";

  return (
    <div className="container mx-auto p-6 max-w-4xl" data-testid="usage-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Usage Dashboard</h1>
        <Badge variant={isOverLimit ? "destructive" : isNearLimit ? "secondary" : "default"}>
          {safeLevel.replace("_", " ").toUpperCase()}
        </Badge>
      </div>

      {/* Status callout */}
      {safeModelProbeStatus === "soft_cap" && (
        <Callout variant="warn" className="mb-6">
          <div>
            <p className="font-bold">Approaching Usage Limit</p>
            <p>You&apos;re at {percentage}% of your usage limit. Consider upgrading to avoid service interruption.</p>
          </div>
        </Callout>
      )}
      {safeModelProbeStatus === "hard_cap" && (
        <Callout variant="error" className="mb-6">
          <div>
            <p className="font-bold">Usage Limit Reached</p>
            <p>You&apos;ve reached your usage limit. Model probe actions are disabled until the next billing cycle.</p>
          </div>
        </Callout>
      )}

      {/* Summary cards */}
      <div className="grid gap-6 md:grid-cols-2 mb-6" data-testid="usage-summary-grid">
        <Card data-testid="usage-card-current">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Usage
            </CardTitle>
            <CardDescription>Your spend this billing cycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${usage.currentSpend.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">
              of ${usage.limit.toLocaleString()} limit
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isOverLimit ? "bg-red-500" : isNearLimit ? "bg-yellow-500" : "bg-green-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="text-sm text-muted-foreground mt-1">{percentage}% used</div>
          </CardContent>
        </Card>

        <Card data-testid="usage-card-status">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {statusIcons[safeModelProbeStatus]}
              Service Status
            </CardTitle>
            <CardDescription>Model probe availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {statusText[safeModelProbeStatus]}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Remaining: ${remaining.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details card */}
      <Card data-testid="usage-card-details">
        <CardHeader>
          <CardTitle>Usage Details</CardTitle>
          <CardDescription>Breakdown of your current usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Tier</span>
              <span className="text-sm">{safeLevel.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Current Spend</span>
              <span className="text-sm">${usage.currentSpend.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Usage Limit</span>
              <span className="text-sm">${usage.limit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Remaining</span>
              <span className="text-sm">${remaining.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Percentage Used</span>
              <span className="text-sm">{percentage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Data refreshes automatically every 30 seconds
      </p>
    </div>
  );
}
