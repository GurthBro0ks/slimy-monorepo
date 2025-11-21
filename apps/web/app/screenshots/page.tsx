"use client";

import { useEffect, useState } from "react";
import {
  fetchLatestSnailAnalysis,
  type SnailAnalysisPayload,
  type SnailScreenshotResult,
} from "@/lib/api/snail-screenshots";

/**
 * Screenshot Analysis Viewer
 *
 * Displays the latest analyzed Supersnail screenshots with normalized stats.
 * Supports both live mode (admin-api configured) and sandbox mode.
 */
export default function ScreenshotsPage() {
  const [analysis, setAnalysis] = useState<SnailAnalysisPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load latest analysis from API
   * Handles both live and sandbox modes automatically
   */
  async function loadAnalysis() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLatestSnailAnalysis();
      setAnalysis(data);
    } catch (err) {
      console.error("Failed to fetch latest snail analysis", err);
      setError(
        "Failed to load screenshot analysis. Showing sandbox data if available."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAnalysis();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖼️</span>
            <div>
              <h1 className="text-lg font-semibold">Screenshot Analysis</h1>
              <p className="text-xs text-slate-400">
                View the latest analyzed Supersnail screenshots and normalized
                stats.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadAnalysis}
            disabled={isLoading}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-slate-900 disabled:opacity-50 hover:bg-emerald-400 transition-colors"
          >
            {isLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-3 rounded-md border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && !analysis && (
          <div className="text-xs text-slate-400">
            Loading latest analysis…
          </div>
        )}

        {/* No Results */}
        {!isLoading && (!analysis || analysis.results.length === 0) && (
          <div className="text-xs text-slate-400">
            No screenshot analysis found yet. Run <code className="rounded bg-slate-800 px-1 py-0.5">/snail analyze</code> in Discord to generate data.
          </div>
        )}

        {/* Results */}
        {analysis && analysis.results.length > 0 && (
          <>
            {/* Run Info Card */}
            <div className="mb-4 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div>
                  <div className="text-[10px] text-slate-500">Run ID</div>
                  <div className="font-mono text-slate-300">
                    {analysis.runId ?? "unknown"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Guild</div>
                  <div className="font-mono text-slate-300">
                    {analysis.guildId ?? "unknown"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">User</div>
                  <div className="font-mono text-slate-300">
                    {analysis.userId ?? "unknown"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Results</div>
                  <div className="font-mono text-slate-300">
                    {analysis.results.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Screenshot Grid */}
            <div className="grid gap-3 md:grid-cols-2">
              {analysis.results.map((result, index) => (
                <div
                  key={result.fileUrl + (result.analyzedAt ?? index)}
                  className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs hover:border-slate-700 transition-colors"
                >
                  {/* Header */}
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <a
                      href={result.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-emerald-400 underline hover:text-emerald-300"
                    >
                      View screenshot
                    </a>
                    {result.analyzedAt && (
                      <span className="whitespace-nowrap text-[10px] text-slate-500">
                        {new Date(result.analyzedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Uploader */}
                  {result.uploadedBy && (
                    <div className="mb-2 text-[11px] text-slate-400">
                      Uploaded by:{" "}
                      <span className="text-slate-300">
                        {result.uploadedBy}
                      </span>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {"simPower" in result.stats && (
                      <div>
                        <div className="text-[10px] text-slate-500">
                          Sim Power
                        </div>
                        <div className="text-xs font-semibold text-slate-200">
                          {result.stats.simPower.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {"snailLevel" in result.stats && (
                      <div>
                        <div className="text-[10px] text-slate-500">
                          Snail Level
                        </div>
                        <div className="text-xs font-semibold text-slate-200">
                          {result.stats.snailLevel}
                        </div>
                      </div>
                    )}
                    {"cityLevel" in result.stats && (
                      <div>
                        <div className="text-[10px] text-slate-500">
                          City Level
                        </div>
                        <div className="text-xs font-semibold text-slate-200">
                          {result.stats.cityLevel}
                        </div>
                      </div>
                    )}
                    {"tier" in result.stats && (
                      <div>
                        <div className="text-[10px] text-slate-500">Tier</div>
                        <div className="text-xs font-semibold text-slate-200">
                          {String(result.stats.tier)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
