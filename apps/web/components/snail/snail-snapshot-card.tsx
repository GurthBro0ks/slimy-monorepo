"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { adminApiClient } from "@/lib/api/admin-client";
import {
  fetchLatestScreenshots,
  getSandboxScreenshots,
  pickBestSnailFromAnalysis,
  type SnailAnalysisPayload,
  type SnailScreenshotResult,
} from "@/lib/api/snail-screenshots";

type SnapshotState = {
  loading: boolean;
  analysis: SnailAnalysisPayload | null;
  usingSandbox: boolean;
  error: string | null;
};

const initialState: SnapshotState = {
  loading: false,
  analysis: null,
  usingSandbox: false,
  error: null,
};

function getTierBadgeClasses(tier?: string): string {
  if (!tier) {
    return "border-zinc-700 bg-zinc-800 text-zinc-200";
  }

  const tierUpper = tier.toUpperCase();

  if (tierUpper.includes("S+")) {
    return "border-purple-400/50 bg-purple-500/10 text-purple-300";
  }
  if (tierUpper.includes("S")) {
    return "border-pink-400/50 bg-pink-500/10 text-pink-300";
  }
  if (tierUpper.includes("A")) {
    return "border-emerald-400/50 bg-emerald-500/10 text-emerald-300";
  }
  if (tierUpper.includes("B")) {
    return "border-blue-400/50 bg-blue-500/10 text-blue-300";
  }
  if (tierUpper.includes("C")) {
    return "border-yellow-400/50 bg-yellow-500/10 text-yellow-300";
  }
  if (tierUpper.includes("D")) {
    return "border-orange-400/50 bg-orange-500/10 text-orange-300";
  }

  return "border-red-400/50 bg-red-500/10 text-red-300";
}

export function SnailSnapshotCard() {
  const { user, loading: authLoading, login } = useAuth();
  const [state, setState] = useState<SnapshotState>(initialState);

  useEffect(() => {
    if (!user) {
      setState(initialState);
      return;
    }

    let cancelled = false;

    async function loadSnapshot() {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        if (!adminApiClient.isConfigured()) {
          if (!cancelled) {
            setState({
              loading: false,
              analysis: getSandboxScreenshots(),
              usingSandbox: true,
              error: null,
            });
          }
          return;
        }

        const response = await fetchLatestScreenshots();

        if (cancelled) return;

        if (response.ok) {
          setState({
            loading: false,
            analysis: response.data,
            usingSandbox: false,
            error: null,
          });
        } else {
          setState({
            loading: false,
            analysis: null,
            usingSandbox: false,
            error: response.message || "Could not load snapshot.",
          });
        }
      } catch (error) {
        console.error("Failed to load snail snapshot", error);
        if (!cancelled) {
          setState({
            loading: false,
            analysis: null,
            usingSandbox: false,
            error: "Could not load snapshot.",
          });
        }
      }
    }

    loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const bestSnail = useMemo<SnailScreenshotResult | null>(() => pickBestSnailFromAnalysis(state.analysis), [state.analysis]);
  const analysisDate = state.analysis?.timestamp ? new Date(state.analysis.timestamp) : null;
  const formattedDate = analysisDate
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(analysisDate)
    : null;

  return (
    <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl">My Snail Snapshot</CardTitle>
          <CardDescription>Quick view of your best snail tier and score.</CardDescription>
        </div>
        <Sparkles className="h-5 w-5 text-neon-green" />
      </CardHeader>
      <CardContent className="space-y-4">
        {authLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your profile...
          </div>
        ) : !user ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Log in with Discord to see your current snail tier and slimy score.
            </p>
            <Button variant="purple" onClick={login} className="rounded-full">
              Login with Discord
            </Button>
          </div>
        ) : state.loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your latest analysis...
          </div>
        ) : state.error ? (
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{state.error} Try again later.</span>
          </div>
        ) : bestSnail ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <span
                className={`inline-flex items-center rounded-full border px-4 py-1 text-sm font-semibold ${getTierBadgeClasses(
                  bestSnail.stats?.suggestedTier
                )}`}
              >
                {bestSnail.stats?.suggestedTier ?? "N/A"} Tier
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Slimy Score</p>
                <p className="text-3xl font-bold">
                  {typeof bestSnail.stats?.suggestedScore === "number"
                    ? Math.round(bestSnail.stats.suggestedScore)
                    : "N/A"}
                </p>
              </div>
            </div>

            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                <dt className="text-muted-foreground">Snail Level</dt>
                <dd className="text-lg font-semibold">{bestSnail.stats?.snailLevel ?? "—"}</dd>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                <dt className="text-muted-foreground">City Level</dt>
                <dd className="text-lg font-semibold">{bestSnail.stats?.cityLevel ?? "—"}</dd>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                <dt className="text-muted-foreground">Sim Power</dt>
                <dd className="text-lg font-semibold">
                  {typeof bestSnail.stats?.simPower === "number"
                    ? bestSnail.stats.simPower.toLocaleString()
                    : "—"}
                </dd>
              </div>
            </dl>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                {formattedDate ? `From your latest analysis on ${formattedDate}.` : "Latest analysis shown."}
                {state.usingSandbox && " Sandbox data shown—connect admin API for live stats."}
              </p>
              <Button asChild variant="outline" size="sm" className="border-emerald-500/40 text-emerald-200">
                <Link href="/screenshots">View full analysis</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p>No snapshot yet. Run a screenshot analysis to see your best snail here.</p>
            <Button asChild variant="outline" size="sm" className="border-emerald-500/40 text-emerald-200">
              <Link href="/screenshots">Go to Screenshot Analysis</Link>
            </Button>
            {state.usingSandbox && (
              <p className="text-xs text-muted-foreground">
                Snapshot unavailable in sandbox mode. Connect the admin API to load real runs.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SnailSnapshotCard;
