"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, Heart, FileText, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import type {
  ArtifactApiResponse,
  ShadowSummary,
  ShadowHealth,
  JournalPreview,
} from "@/lib/trader/artifacts/types";

export default function TraderArtifactsPage() {
  const [summary, setSummary] = useState<ArtifactApiResponse<ShadowSummary> | null>(null);
  const [health, setHealth] = useState<ArtifactApiResponse<ShadowHealth> | null>(null);
  const [journal, setJournal] = useState<ArtifactApiResponse<JournalPreview> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);

    try {
      const [sumRes, healthRes, journalRes] = await Promise.all([
        fetch("/api/trader/artifacts/summary"),
        fetch("/api/trader/artifacts/health"),
        fetch("/api/trader/artifacts/journal_preview?limit=10"),
      ]);

      // Check for auth/access errors
      if (sumRes.status === 401 || healthRes.status === 401) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }

      if (sumRes.status === 403 || healthRes.status === 403) {
        setError("Access denied. You are not authorized to view artifacts.");
        setLoading(false);
        return;
      }

      const [sumData, healthData, journalData] = await Promise.all([
        sumRes.json(),
        healthRes.json(),
        journalRes.json(),
      ]);

      setSummary(sumData);
      setHealth(healthData);
      setJournal(journalData);
      setLastRefresh(new Date().toISOString());
    } catch (err) {
      console.error("[Artifacts] Fetch error:", err);
      setError("Failed to fetch artifacts. Please try again.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-mono text-red-400 mb-2">Access Error</h2>
          <p className="text-gray-500 font-mono text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-['VT323'] text-[var(--neon-green)] tracking-widest uppercase">
          Artifacts
        </h1>
        <div className="text-xs font-mono text-gray-500 flex items-center gap-4">
          {summary?.last_pull_utc && (
            <span>
              Pull: {new Date(summary.last_pull_utc).toLocaleTimeString()}
            </span>
          )}
          {lastRefresh && (
            <span>
              Refresh: {new Date(lastRefresh).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mode */}
        <Card className="bg-black/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-gray-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-8 bg-gray-800 rounded" />
            ) : (
              <span className="text-2xl font-['VT323'] text-amber-400 uppercase">
                {summary?.data?.mode || "unknown"}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Health Status */}
        <Card className="bg-black/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-gray-400 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-8 bg-gray-800 rounded" />
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    health?.data?.ok ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                />
                <span className="text-2xl font-['VT323'] text-white">
                  {health?.data?.ok ? "HEALTHY" : "DEGRADED"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Positions */}
        <Card className="bg-black/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-8 bg-gray-800 rounded" />
            ) : (
              <span className="text-2xl font-['VT323'] text-[var(--neon-green)]">
                {summary?.data?.positions ?? 0}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Signals Today */}
        <Card className="bg-black/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-gray-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Signals Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-8 bg-gray-800 rounded" />
            ) : (
              <span className="text-2xl font-['VT323'] text-cyan-400">
                {summary?.data?.signals_today ?? 0}
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* P&L Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/30 border border-gray-800 rounded p-4">
          <div className="text-xs font-mono text-gray-500 uppercase flex items-center gap-2">
            <DollarSign className="w-3 h-3" />
            Unrealized P&L
          </div>
          {loading ? (
            <div className="animate-pulse h-8 bg-gray-800 rounded mt-2" />
          ) : (
            <div
              className={`text-xl font-['VT323'] mt-1 ${
                (summary?.data?.pnl_unrealized ?? 0) >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {(summary?.data?.pnl_unrealized ?? 0) >= 0 ? "+" : ""}$
              {(summary?.data?.pnl_unrealized ?? 0).toFixed(2)}
            </div>
          )}
        </div>
        <div className="bg-black/30 border border-gray-800 rounded p-4">
          <div className="text-xs font-mono text-gray-500 uppercase flex items-center gap-2">
            <DollarSign className="w-3 h-3" />
            Daily P&L
          </div>
          {loading ? (
            <div className="animate-pulse h-8 bg-gray-800 rounded mt-2" />
          ) : (
            <div
              className={`text-xl font-['VT323'] mt-1 ${
                (summary?.data?.pnl_daily ?? 0) >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {(summary?.data?.pnl_daily ?? 0) >= 0 ? "+" : ""}$
              {(summary?.data?.pnl_daily ?? 0).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Health Components */}
      {health?.data && (
        <Card className="bg-black/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm font-mono text-gray-400">
              System Components
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(health.data.components).map(([name, ok]) => (
                <div
                  key={name}
                  className="flex items-center gap-2 font-mono text-sm"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      ok ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-gray-400 uppercase">{name}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800 text-xs font-mono text-gray-500">
              Version: {health.data.version} | Last heartbeat:{" "}
              {new Date(health.data.last_heartbeat).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Journal Preview */}
      <Card className="bg-black/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm font-mono text-gray-400 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Recent Journal Entries
            {journal?.data && (
              <span className="text-gray-600 ml-2">
                ({journal.data.entries.length} of {journal.data.total_count})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-6 bg-gray-800 rounded" />
              ))}
            </div>
          ) : journal?.data?.entries?.length ? (
            <div className="space-y-2 font-mono text-sm">
              {journal.data.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 py-2 border-b border-gray-800/50 last:border-0"
                >
                  <span className="text-gray-500 shrink-0 text-xs">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`shrink-0 uppercase text-xs px-1.5 py-0.5 rounded ${
                      entry.type === "signal"
                        ? "bg-blue-900/50 text-blue-400"
                        : entry.type === "position"
                        ? "bg-green-900/50 text-green-400"
                        : entry.type === "risk"
                        ? "bg-amber-900/50 text-amber-400"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {entry.type}
                  </span>
                  <span className="text-gray-300 flex-1">{entry.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8 font-mono">
              {journal?.status === "MISSING"
                ? "No journal file found"
                : journal?.status === "STALE"
                ? "Journal data is stale"
                : "No journal entries available"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Artifact Status Footer */}
      <div className="text-xs font-mono text-gray-600 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>
            Summary:{" "}
            <span
              className={
                summary?.status === "OK"
                  ? "text-green-500"
                  : summary?.status === "STALE"
                  ? "text-amber-500"
                  : "text-red-500"
              }
            >
              {summary?.status || "UNKNOWN"}
            </span>
          </span>
          <span>
            Health:{" "}
            <span
              className={
                health?.status === "OK"
                  ? "text-green-500"
                  : health?.status === "STALE"
                  ? "text-amber-500"
                  : "text-red-500"
              }
            >
              {health?.status || "UNKNOWN"}
            </span>
          </span>
          <span>
            Journal:{" "}
            <span
              className={
                journal?.status === "OK"
                  ? "text-green-500"
                  : journal?.status === "STALE"
                  ? "text-amber-500"
                  : "text-red-500"
              }
            >
              {journal?.status || "UNKNOWN"}
            </span>
          </span>
        </div>
        {summary?.artifact_age_sec !== null && (
          <span>
            Artifact age:{" "}
            <span
              className={
                (summary?.artifact_age_sec ?? 0) > 120
                  ? "text-amber-500"
                  : "text-green-500"
              }
            >
              {summary?.artifact_age_sec}s
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
