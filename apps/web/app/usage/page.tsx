"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { checkHealth } from "@/lib/api/health";
import { isConfigured } from "@/lib/http-client";

/**
 * Connection status type
 * - sandbox: API not configured, using mock data
 * - connected: API configured and healthy
 * - degraded: API configured but reporting issues
 * - offline: API configured but unreachable
 */
type ConnectionStatus = "sandbox" | "connected" | "degraded" | "offline";

/**
 * Status indicator component with colored dot and message
 */
function StatusIndicator({ status }: { status: ConnectionStatus }) {
  const config = {
    sandbox: {
      dotColor: "bg-amber-400",
      text: "Sandbox mode – admin-api base URL not configured",
    },
    connected: {
      dotColor: "bg-emerald-400",
      text: "Connected to admin-api",
    },
    degraded: {
      dotColor: "bg-amber-400",
      text: "Degraded – admin-api responding with issues",
    },
    offline: {
      dotColor: "bg-red-500",
      text: "Offline – unable to reach admin-api",
    },
  };

  const { dotColor, text } = config[status];

  return (
    <>
      <span className={`inline-flex h-2 w-2 rounded-full ${dotColor}`} />
      <span className="text-muted-foreground">{text}</span>
    </>
  );
}

export default function UsagePage() {
  // Initialize status based on whether API is configured
  const [status, setStatus] = useState<ConnectionStatus>(
    () => isConfigured() ? "offline" : "sandbox"
  );

  useEffect(() => {
    // Only run health check if API is configured
    if (!isConfigured()) {
      return;
    }

    let cancelled = false;

    const runHealthCheck = async () => {
      try {
        const result = await checkHealth();
        if (!cancelled) {
          setStatus(result.status);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("offline");
        }
      }
    };

    runHealthCheck();

    // Cleanup function to prevent state updates after unmount
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell
      title="Usage"
      description="Monitor your API usage and quota limits"
      status={<StatusIndicator status={status} />}
    >
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
          <CardHeader className="pb-2">
            <CardDescription>Total Requests</CardDescription>
            <CardTitle className="text-3xl">12,345</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
          <CardHeader className="pb-2">
            <CardDescription>Successful</CardDescription>
            <CardTitle className="text-3xl">12,103</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              98.0% success rate
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl">242</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              2.0% error rate
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
          <CardHeader className="pb-2">
            <CardDescription>Avg Response Time</CardDescription>
            <CardTitle className="text-3xl">145ms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              -12% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart Placeholder */}
      <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
        <CardHeader>
          <CardTitle>Request Volume</CardTitle>
          <CardDescription>
            API requests over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-emerald-500/30">
            <p className="text-sm text-muted-foreground">
              Chart visualization coming soon
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quota Information */}
      <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
        <CardHeader>
          <CardTitle>Quota Status</CardTitle>
          <CardDescription>
            Current usage against your plan limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monthly Requests</span>
                <span className="font-medium">12,345 / 100,000</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: "12.3%" }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rate Limit</span>
                <span className="font-medium">45 / 100 req/min</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: "45%" }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Storage Used</span>
                <span className="font-medium">2.1 GB / 10 GB</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: "21%" }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note about mock data */}
      {status === "sandbox" && (
        <Card className="rounded-2xl border border-amber-500/30 bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-lg">Demo Data</CardTitle>
            <CardDescription>
              You're viewing mock usage data. Configure NEXT_PUBLIC_ADMIN_API_BASE
              in your environment to connect to the real admin-api and see actual metrics.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </PageShell>
  );
}
