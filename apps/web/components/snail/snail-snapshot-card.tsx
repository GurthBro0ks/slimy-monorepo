"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getLatestSnailAnalysis, type SnailAnalysis } from "@/lib/api/snail-screenshots";
import { Sparkles, TrendingUp, Shield, Heart } from "lucide-react";

/**
 * SnailSnapshotCard - Displays latest snail analysis with stats
 */
export function SnailSnapshotCard() {
  const [analysis, setAnalysis] = useState<SnailAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const data = await getLatestSnailAnalysis();
        setAnalysis(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch snail analysis:", err);
        setError("Failed to load snail data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
        <CardHeader>
          <Sparkles className="h-8 w-8 text-neon-green mb-2" />
          <CardTitle className="text-lg">My Snail Snapshot</CardTitle>
          <CardDescription className="text-sm">
            {error || "No snail data available"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upload a screenshot to track your snail's progress
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier.toUpperCase()) {
      case "SSR":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "SR":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "R":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  return (
    <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm hover:bg-zinc-900/60 transition-colors">
      <CardHeader>
        <Sparkles className="h-8 w-8 text-neon-green mb-2" />
        <CardTitle className="text-lg">My Snail Snapshot</CardTitle>
        <CardDescription className="text-sm">
          Latest analysis from {new Date(analysis.timestamp).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tier and Level */}
        <div className="flex items-center gap-3">
          <Badge className={getTierColor(analysis.tier)}>{analysis.tier}</Badge>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="h-4 w-4 text-neon-green" />
            <span className="font-semibold">Level {analysis.level}</span>
          </div>
        </div>

        {/* Stats */}
        {analysis.stats && (
          <div className="space-y-2 text-sm">
            {analysis.stats.attack && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Attack
                </span>
                <span className="font-semibold text-neon-green">
                  {analysis.stats.attack.toLocaleString()}
                </span>
              </div>
            )}
            {analysis.stats.defense && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Defense
                </span>
                <span className="font-semibold text-neon-green">
                  {analysis.stats.defense.toLocaleString()}
                </span>
              </div>
            )}
            {analysis.stats.hp && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  HP
                </span>
                <span className="font-semibold text-neon-green">
                  {analysis.stats.hp.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Confidence */}
        <div className="pt-2 border-t border-emerald-500/20">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Confidence</span>
            <span className="text-emerald-400">{(analysis.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
