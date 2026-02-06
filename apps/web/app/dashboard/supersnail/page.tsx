"use client";

import { useEffect, useState, useCallback } from "react";

interface PlayerScore {
  rank: number;
  player: string;
  score: number;
  boosts: string;
  dailyGain: string;
  trend: "up" | "down" | "flat";
  streak: number;
  club: string;
}

interface ScoreResponse {
  scores: PlayerScore[];
  yourScore: PlayerScore | null;
  lastUpdated: string;
  message: string;
}

const RANK_COLORS: Record<number, string> = {
  1: "text-yellow-300",
  2: "text-gray-300",
  3: "text-orange-400",
};

const TREND_ICONS: Record<string, string> = {
  up: "\u25B2",
  down: "\u25BC",
  flat: "\u25C6",
};

const TREND_COLORS: Record<string, string> = {
  up: "text-green-400",
  down: "text-red-400",
  flat: "text-gray-500",
};

function formatScore(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function StatCard({
  label,
  value,
  sub,
  accent = "#00ff00",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-[#10002b] border border-[#5a189a] p-3 sm:p-4 flex flex-col gap-1 min-w-0">
      <span className="text-[10px] sm:text-xs font-mono text-[#e0aaff] uppercase tracking-wider truncate">
        {label}
      </span>
      <span
        className="text-lg sm:text-2xl font-bold font-mono truncate"
        style={{ color: accent }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[10px] sm:text-xs text-gray-500 font-mono truncate">
          {sub}
        </span>
      )}
    </div>
  );
}

export default function SupersnailDashboard() {
  const [data, setData] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const fetchScores = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/supersnail/scores");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastFetch(new Date());
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch scores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchScores, 60_000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchScores]);

  const you = data?.yourScore;
  const scores = data?.scores ?? [];

  return (
    <div className="min-h-screen bg-[#0a0014] text-white">
      {/* Header bar */}
      <header className="sticky top-0 z-50 bg-[#10002b]/95 backdrop-blur border-b border-[#5a189a] px-3 sm:px-6 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#00ff00] font-mono text-sm sm:text-base font-bold whitespace-nowrap">
            SUPERSNAIL
          </span>
          <span className="hidden sm:inline text-[#5a189a] font-mono">|</span>
          <span className="hidden sm:inline text-xs text-[#9d4edd] font-mono truncate">
            QCPlay Club Dashboard
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-[10px] sm:text-xs font-mono px-2 py-1 border transition-colors ${
              autoRefresh
                ? "border-green-500 text-green-400 bg-green-900/20"
                : "border-gray-600 text-gray-500"
            }`}
          >
            {autoRefresh ? "LIVE" : "PAUSED"}
          </button>
          <button
            onClick={fetchScores}
            disabled={loading}
            className="text-[10px] sm:text-xs font-mono px-2 py-1 border border-[#9d4edd] text-[#e0aaff] hover:bg-[#9d4edd]/20 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "REFRESH"}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Error banner */}
        {error && (
          <div className="bg-red-900/30 border border-red-600 text-red-300 text-xs font-mono p-3">
            ERROR: {error}
          </div>
        )}

        {/* Your stats — high-density stat cards */}
        {you && (
          <section>
            <h2 className="text-xs font-mono text-[#9d4edd] mb-2 uppercase tracking-widest">
              Your Position
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <StatCard
                label="Score"
                value={formatScore(you.score)}
                sub={`Raw: ${you.score.toLocaleString()}`}
                accent="#00ff00"
              />
              <StatCard
                label="Rank"
                value={`#${you.rank}`}
                sub={`of ${scores.length > 0 ? scores.length * 6 : 60}`}
                accent="#d400ff"
              />
              <StatCard
                label="Boosts"
                value={you.boosts}
                sub={`${you.streak > 0 ? you.streak + "d streak" : "no streak"}`}
                accent="#fbbf24"
              />
              <StatCard
                label="Daily Gain"
                value={you.dailyGain}
                sub={`Trend: ${TREND_ICONS[you.trend] || "-"}`}
                accent={
                  you.trend === "up"
                    ? "#4ade80"
                    : you.trend === "down"
                      ? "#f87171"
                      : "#9ca3af"
                }
              />
            </div>
          </section>
        )}

        {/* Leaderboard */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-mono text-[#9d4edd] uppercase tracking-widest">
              Leaderboard &mdash; Top {scores.length}
            </h2>
            {lastFetch && (
              <span className="text-[10px] text-gray-600 font-mono">
                {lastFetch.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm font-mono border-collapse">
              <thead>
                <tr className="text-[#9d4edd] text-xs uppercase border-b border-[#5a189a]">
                  <th className="text-left py-2 px-2 w-12">#</th>
                  <th className="text-left py-2 px-2">Player</th>
                  <th className="text-right py-2 px-2">Score</th>
                  <th className="text-center py-2 px-2 w-16">Trend</th>
                  <th className="text-right py-2 px-2">Daily</th>
                  <th className="text-right py-2 px-2">Boosts</th>
                  <th className="text-center py-2 px-2 w-16">Streak</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((p) => {
                  const isYou = you && p.player === you.player;
                  return (
                    <tr
                      key={p.rank}
                      className={`border-b border-[#240046] transition-colors ${
                        isYou
                          ? "bg-[#00ff00]/5 border-l-2 border-l-[#00ff00]"
                          : "hover:bg-[#240046]/60"
                      }`}
                    >
                      <td
                        className={`py-2 px-2 font-bold ${RANK_COLORS[p.rank] || "text-gray-500"}`}
                      >
                        {p.rank <= 3 ? ["", "\u{1F947}", "\u{1F948}", "\u{1F949}"][p.rank] : p.rank}
                      </td>
                      <td className="py-2 px-2">
                        <span className={isYou ? "text-[#00ff00] font-bold" : "text-[#e0aaff]"}>
                          {p.player}
                        </span>
                        {isYou && (
                          <span className="ml-2 text-[10px] bg-[#00ff00]/20 text-[#00ff00] px-1 py-0.5 border border-[#00ff00]/30">
                            YOU
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right text-white font-bold tabular-nums">
                        {formatScore(p.score)}
                      </td>
                      <td className={`py-2 px-2 text-center ${TREND_COLORS[p.trend] || ""}`}>
                        {TREND_ICONS[p.trend] || "-"}
                      </td>
                      <td className="py-2 px-2 text-right text-green-400 tabular-nums">
                        {p.dailyGain}
                      </td>
                      <td className="py-2 px-2 text-right text-yellow-300 tabular-nums">
                        {p.boosts}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {p.streak > 0 ? (
                          <span className="text-orange-400">{p.streak}d</span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-1">
            {scores.map((p) => {
              const isYou = you && p.player === you.player;
              const isExpanded = expandedRow === p.rank;
              return (
                <div
                  key={p.rank}
                  onClick={() => setExpandedRow(isExpanded ? null : p.rank)}
                  className={`p-2 border transition-colors cursor-pointer ${
                    isYou
                      ? "bg-[#00ff00]/5 border-[#00ff00]/30"
                      : "bg-[#10002b] border-[#240046]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-xs font-bold w-6 text-center flex-shrink-0 ${RANK_COLORS[p.rank] || "text-gray-500"}`}
                      >
                        {p.rank <= 3
                          ? ["", "\u{1F947}", "\u{1F948}", "\u{1F949}"][p.rank]
                          : `#${p.rank}`}
                      </span>
                      <span
                        className={`text-sm font-mono truncate ${isYou ? "text-[#00ff00] font-bold" : "text-[#e0aaff]"}`}
                      >
                        {p.player}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs ${TREND_COLORS[p.trend]}`}>
                        {TREND_ICONS[p.trend]}
                      </span>
                      <span className="text-sm font-bold font-mono text-white tabular-nums">
                        {formatScore(p.score)}
                      </span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-[#5a189a]/50 grid grid-cols-3 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-gray-500">DAILY</span>
                        <br />
                        <span className="text-green-400">{p.dailyGain}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">BOOSTS</span>
                        <br />
                        <span className="text-yellow-300">{p.boosts}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">STREAK</span>
                        <br />
                        <span className="text-orange-400">
                          {p.streak > 0 ? `${p.streak}d` : "-"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bot Alerts stub */}
        <section className="bg-[#10002b] border border-[#5a189a] p-3 sm:p-4">
          <h2 className="text-xs font-mono text-[#9d4edd] uppercase tracking-widest mb-2">
            Bot Alerts
          </h2>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#e0aaff]">
              <span className="text-green-400">[INFO]</span>
              <span>Score milestone tracking active</span>
            </div>
            <div className="flex items-center gap-2 text-[#e0aaff]">
              <span className="text-yellow-400">[STUB]</span>
              <span>Telegram push: &quot;1M reached &rarr; Edge market?&quot;</span>
            </div>
            <div className="flex items-center gap-2 text-[#e0aaff]">
              <span className="text-yellow-400">[STUB]</span>
              <span>Daily digest &rarr; Club leaderboard diff</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-[10px] text-gray-600 font-mono py-4 border-t border-[#240046]">
          Private club MVP &middot; Proof-gated &middot; @GurthBr00ks
        </footer>
      </main>
    </div>
  );
}
