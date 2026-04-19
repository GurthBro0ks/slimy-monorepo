"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Clock,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface StatsSummary {
  totalMembers: number;
  totalSimPower: number;
  totalPower: number;
  avgSimPower: number;
  avgTotalPower: number;
  lastUpdated: string;
}

interface TopMember {
  name: string;
  simPower: number;
  totalPower: number;
  simPrev?: number | null;
}

interface WowMember {
  name: string;
  simPower: number;
  simPrev: number;
  wowChange: number;
  wowPct: number | null;
}

interface StatsData {
  ok: boolean;
  summary: StatsSummary;
  topSim: TopMember[];
  topTotal: TopMember[];
  movers: WowMember[];
  decliners: WowMember[];
  error?: string;
}

function abbreviateNumber(num: number): string {
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return sign + (abs / 1_000_000_000).toFixed(1) + "B";
  if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return sign + Math.round(abs / 1_000) + "K";
  return num.toLocaleString("en-US");
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function rankDisplay(idx: number): React.ReactNode {
  if (idx === 0) return <span className="text-lg">🥇</span>;
  if (idx === 1) return <span className="text-lg">🥈</span>;
  if (idx === 2) return <span className="text-lg">🥉</span>;
  return <span className="text-[#8a4baf] font-bold">{idx + 1}</span>;
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/snail/stats", { credentials: "include" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      const json: StatsData = await res.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch stats data"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summaryCards = data?.summary
    ? [
        {
          label: "Total Members",
          value: String(data.summary.totalMembers),
          icon: <Users size={24} className="text-[#8a4baf]" />,
        },
        {
          label: "Total SIM Power",
          value: abbreviateNumber(data.summary.totalSimPower),
          icon: <Zap size={24} className="text-[#8a4baf]" />,
        },
        {
          label: "Total Power",
          value: abbreviateNumber(data.summary.totalPower),
          icon: <Activity size={24} className="text-[#8a4baf]" />,
        },
        {
          label: "Avg SIM Power",
          value: abbreviateNumber(data.summary.avgSimPower),
          icon: <TrendingUp size={24} className="text-[#8a4baf]" />,
        },
        {
          label: "Last Updated",
          value: formatRelativeTime(data.summary.lastUpdated),
          icon: <Clock size={24} className="text-[#8a4baf]" />,
        },
      ]
    : [];

  return (
    <div className="space-y-8 font-mono">
      <div className="border-b-2 border-[#39ff14] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-5xl font-bold text-[#39ff14] tracking-tighter drop-shadow-[0_0_10px_#39ff14]"
            style={{ fontFamily: '"Press Start 2P", cursive' }}
          >
            Club Stats
          </h1>
          <p className="text-[#8a4baf] text-xl mt-3">
            Club-wide analytics &amp; rankings
          </p>
        </div>
        {data && !error && (
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="px-6 py-3 bg-[#2d0b4e] border-2 border-[#39ff14] text-[#39ff14] font-bold hover:bg-[#39ff14] hover:text-black transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            REFRESH
          </button>
        )}
      </div>

      {isLoading && !data && (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-[#1a0b2e] border-2 border-[#8a4baf]/20 animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="border-2 border-red-500 bg-red-500/10 p-12 text-center space-y-6">
          <AlertCircle size={64} className="mx-auto text-red-500" />
          <h2 className="text-3xl font-bold text-red-500 uppercase">
            Signal Lost
          </h2>
          <p className="text-[#d6b4fc] text-xl">{error}</p>
          {error.includes("not configured") ? (
            <p className="text-[#8a4baf] text-sm">
              MySQL not configured. Add CLUB_MYSQL_* vars to .env and restart.
            </p>
          ) : (
            <button
              onClick={fetchData}
              className="px-8 py-4 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold transition-all"
            >
              RETRY
            </button>
          )}
        </div>
      )}

      {data && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="bg-[#0a0412] border-2 border-[#8a4baf] p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  {card.icon}
                  <span className="text-[#8a4baf] text-xs font-bold tracking-widest uppercase">
                    {card.label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#d6b4fc] tracking-widest flex items-center gap-3">
                <Zap size={22} className="text-[#39ff14]" />
                TOP 10 SIM POWER
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#1a0b2e] border-b-2 border-[#8a4baf]">
                      <th className="px-3 py-3 text-left text-[#d6b4fc] font-bold tracking-widest text-sm">
                        #
                      </th>
                      <th className="px-3 py-3 text-left text-[#d6b4fc] font-bold tracking-widest text-sm">
                        NAME
                      </th>
                      <th className="px-3 py-3 text-right text-[#d6b4fc] font-bold tracking-widest text-sm">
                        SIM
                      </th>
                      <th className="px-3 py-3 text-right text-[#d6b4fc] font-bold tracking-widest text-sm">
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topSim.map((m, idx) => (
                      <tr
                        key={m.name}
                        className="border-b border-[#8a4baf]/20 hover:bg-[#1a0b2e]/50 transition-colors"
                      >
                        <td className="px-3 py-3">{rankDisplay(idx)}</td>
                        <td className="px-3 py-3 text-[#d6b4fc] font-bold">
                          {m.name}
                        </td>
                        <td className="px-3 py-3 text-right text-[#39ff14] font-bold">
                          {abbreviateNumber(m.simPower)}
                        </td>
                        <td className="px-3 py-3 text-right text-[#d6b4fc]">
                          {abbreviateNumber(m.totalPower)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#d6b4fc] tracking-widest flex items-center gap-3">
                <Activity size={22} className="text-[#39ff14]" />
                TOP 10 TOTAL POWER
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#1a0b2e] border-b-2 border-[#8a4baf]">
                      <th className="px-3 py-3 text-left text-[#d6b4fc] font-bold tracking-widest text-sm">
                        #
                      </th>
                      <th className="px-3 py-3 text-left text-[#d6b4fc] font-bold tracking-widest text-sm">
                        NAME
                      </th>
                      <th className="px-3 py-3 text-right text-[#d6b4fc] font-bold tracking-widest text-sm">
                        SIM
                      </th>
                      <th className="px-3 py-3 text-right text-[#d6b4fc] font-bold tracking-widest text-sm">
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topTotal.map((m, idx) => (
                      <tr
                        key={m.name}
                        className="border-b border-[#8a4baf]/20 hover:bg-[#1a0b2e]/50 transition-colors"
                      >
                        <td className="px-3 py-3">{rankDisplay(idx)}</td>
                        <td className="px-3 py-3 text-[#d6b4fc] font-bold">
                          {m.name}
                        </td>
                        <td className="px-3 py-3 text-right text-[#d6b4fc]">
                          {abbreviateNumber(m.simPower)}
                        </td>
                        <td className="px-3 py-3 text-right text-[#39ff14] font-bold">
                          {abbreviateNumber(m.totalPower)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#d6b4fc] tracking-widest flex items-center gap-3">
                <TrendingUp size={22} className="text-green-400" />
                BIGGEST MOVERS
              </h2>
              {data.movers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#1a0b2e] border-b-2 border-green-500/40">
                        <th className="px-3 py-3 text-left text-[#d6b4fc] font-bold tracking-widest text-sm">
                          NAME
                        </th>
                        <th className="px-3 py-3 text-right text-[#d6b4fc] font-bold tracking-widest text-sm">
                          SIM
                        </th>
                        <th className="px-3 py-3 text-right text-[#d6b4fc] font-bold tracking-widest text-sm">
                          CHANGE
                        </th>
                        <th className="px-3 py-3 text-right text-[#d6b4fc] font-bold tracking-widest text-sm">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.movers.map((m) => (
                        <tr
                          key={m.name}
                          className="border-b border-green-500/10 hover:bg-[#1a0b2e]/50 transition-colors"
                        >
                          <td className="px-3 py-3 text-[#d6b4fc] font-bold flex items-center gap-1">
                            <ArrowUpRight size={14} className="text-green-400" />
                            {m.name}
                          </td>
                          <td className="px-3 py-3 text-right text-[#d6b4fc]">
                            {abbreviateNumber(m.simPower)}
                          </td>
                          <td className="px-3 py-3 text-right text-green-400 font-bold">
                            +{abbreviateNumber(m.wowChange)}
                          </td>
                          <td className="px-3 py-3 text-right text-green-400 font-bold">
                            {m.wowPct != null ? `+${m.wowPct.toFixed(1)}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-[#0a0412] border-2 border-[#8a4baf]/20 text-center">
                  <p className="text-[#8a4baf] text-sm">
                    Week-over-week data will appear after the next club push
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#d6b4fc] tracking-widest flex items-center gap-3">
                <TrendingDown size={22} className="text-red-400" />
                BIGGEST DECLINERS
              </h2>
              {data.decliners.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#1a0b2e] border-b-2 border-red-500/40">
                        <th className="px-3 py-3 text-left text-[#d6b4fc] font-bold tracking-widest text-sm">
                          NAME
                        </th>
                        <th className="px-3 py-3 text-right text-[#d6b4fc] font-bold tracking-widest text-sm">
                          SIM
                        </th>
                        <th className="px-3 py-3 text-right text-[#d6b4fc] font-bold tracking-widest text-sm">
                          CHANGE
                        </th>
                        <th className="px-3 py-3 text-right text-[#d6b4fc] font-bold tracking-widest text-sm">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.decliners.map((m) => (
                        <tr
                          key={m.name}
                          className="border-b border-red-500/10 hover:bg-[#1a0b2e]/50 transition-colors"
                        >
                          <td className="px-3 py-3 text-[#d6b4fc] font-bold flex items-center gap-1">
                            <ArrowDownRight size={14} className="text-red-400" />
                            {m.name}
                          </td>
                          <td className="px-3 py-3 text-right text-[#d6b4fc]">
                            {abbreviateNumber(m.simPower)}
                          </td>
                          <td className="px-3 py-3 text-right text-red-400 font-bold">
                            {abbreviateNumber(m.wowChange)}
                          </td>
                          <td className="px-3 py-3 text-right text-red-400 font-bold">
                            {m.wowPct != null ? `${m.wowPct.toFixed(1)}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-[#0a0412] border-2 border-[#8a4baf]/20 text-center">
                  <p className="text-[#8a4baf] text-sm">
                    Week-over-week data will appear after the next club push
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="mt-12 p-6 bg-[#0a0412] border-2 border-[#8a4baf]/20 text-center opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-xs tracking-[0.2em] uppercase">
          CLUB_STATS // NEURAL_SYNC_STABLE // SNAIL_OS_V2.4.0
        </p>
      </div>
    </div>
  );
}
