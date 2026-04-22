"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Clock,
  Users,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

type Member = {
  nameDisplay: string;
  simPower: number;
  totalPower: number;
  simPrev?: number | null;
  totalPrev?: number | null;
  simPctChange?: number | null;
  totalPctChange?: number | null;
  wowChange?: number;
  wowPct?: number | null;
};

type Summary = {
  totalMembers: number;
  totalSimPower: number;
  totalPower: number;
  avgSimPower: number;
  avgTotalPower: number;
  lastUpdated: string;
};

type StatsApiResponse = {
  ok: boolean;
  summary: Summary;
  topSim: Member[];
  topTotal: Member[];
  movers: Member[];
  decliners: Member[];
};

// ─── Helpers ────────────────────────────────────────────────────────────

function abbreviateNumber(num: number): string {
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return sign + (abs / 1_000_000_000).toFixed(1) + "B";
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
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function SnailStatsPage() {
  const [data, setData] = useState<StatsApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/snail/stats", { credentials: "include" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      const json: StatsApiResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Sorting ────────────────────────────────────────────────────────

  const sortedTopSim = useMemo(() => {
    if (!data) return [];
    return data.topSim.map((m, idx) => ({ ...m, _rank: idx + 1 }));
  }, [data]);

  const sortedTopTotal = useMemo(() => {
    if (!data) return [];
    return data.topTotal.map((m, idx) => ({ ...m, _rank: idx + 1 }));
  }, [data]);

  // ─── Render States ──────────────────────────────────────────────────

  if (isLoading && !data) {
    return (
      <div className="space-y-4 p-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-[#1a0b2e] border-2 border-[#8a4baf]/20 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center space-y-6">
        <AlertCircle size={64} className="mx-auto text-red-500" />
        <h2 className="text-3xl font-bold text-red-500 uppercase">Signal Lost</h2>
        <p className="text-[#d6b4fc] text-xl">{error}</p>
        <button
          onClick={fetchData}
          className="px-8 py-4 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold transition-all"
        >
          RETRY
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;

  return (
    <div className="space-y-8 font-mono p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-[#39ff14] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl font-bold text-[#39ff14] tracking-tighter drop-shadow-[0_0_10px_#39ff14]">
            🐌 Club Stats — Cormys Bar
          </h1>
          <p className="text-[#8a4baf] text-xl mt-3">Club member power rankings & week-over-week changes</p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-[#2d0b4e] border-2 border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14] hover:text-black transition-all font-bold tracking-widest shrink-0 disabled:opacity-50"
        >
          <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
          REFRESH
        </button>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Users size={24} className="text-[#8a4baf]" />}
          label="Total Members"
          value={summary.totalMembers}
          format={false}
        />
        <StatCard
          icon={<TrendingUp size={24} className="text-[#8a4baf]" />}
          label="Total SIM Power"
          value={summary.totalSimPower}
          format
        />
        <StatCard
          icon={<TrendingUp size={24} className="text-[#8a4baf]" />}
          label="Total Power"
          value={summary.totalPower}
          format
        />
        <StatCard
          icon={<TrendingUp size={24} className="text-[#8a4baf]" />}
          label="Avg SIM Power"
          value={summary.avgSimPower}
          format
        />
        <StatCard
          icon={<TrendingUp size={24} className="text-[#8a4baf]" />}
          label="Avg Total Power"
          value={summary.avgTotalPower}
          format
        />
        <StatCard
          icon={<Clock size={24} className="text-[#8a4baf]" />}
          label="Last Updated"
          value={formatRelativeTime(summary.lastUpdated)}
          format={false}
        />
      </div>

      {/* Top 10 SIM Power Table */}
      <Section title="🏆 Top 10 by SIM Power">
        <Table
          columns={[
            { key: "rank", label: "#" },
            { key: "nameDisplay", label: "Name" },
            { key: "simPower", label: "SIM Power" },
            { key: "totalPower", label: "Total Power" },
            { key: "simPctChange", label: "WoW %" },
          ]}
          data={sortedTopSim}
          renderRow={(m) => (
            <tr key={m.nameDisplay} className="border-b border-[#8a4baf]/20 hover:bg-[#1a0b2e]/50 transition-colors">
              <td className="px-4 py-3 text-[#8a4baf] font-bold">{m._rank}</td>
              <td className="px-4 py-3 text-[#d6b4fc] font-bold">{m.nameDisplay}</td>
              <td className="px-4 py-3 text-[#d6b4fc]">{abbreviateNumber(m.simPower)}</td>
              <td className="px-4 py-3 text-[#39ff14] font-bold">{abbreviateNumber(m.totalPower)}</td>
              <td className="px-4 py-3">
                {typeof m.simPctChange === "number" ? (
                  <span className="font-bold flex items-center gap-1" style={{ color: m.simPctChange >= 0 ? "#39ff14" : "#ff4444" }}>
                    {m.simPctChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {m.simPctChange >= 0 ? "+" : ""}{m.simPctChange.toFixed(1)}%
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          )}
        />
      </Section>

      {/* Top 10 Total Power Table */}
      <Section title="📊 Top 10 by Total Power">
        <Table
          columns={[
            { key: "rank", label: "#" },
            { key: "nameDisplay", label: "Name" },
            { key: "simPower", label: "SIM Power" },
            { key: "totalPower", label: "Total Power" },
            { key: "totalPctChange", label: "WoW %" },
          ]}
          data={sortedTopTotal}
          renderRow={(m) => (
            <tr key={m.nameDisplay} className="border-b border-[#8a4baf]/20 hover:bg-[#1a0b2e]/50 transition-colors">
              <td className="px-4 py-3 text-[#8a4baf] font-bold">{m._rank}</td>
              <td className="px-4 py-3 text-[#d6b4fc] font-bold">{m.nameDisplay}</td>
              <td className="px-4 py-3 text-[#d6b4fc]">{abbreviateNumber(m.simPower)}</td>
              <td className="px-4 py-3 text-[#39ff14] font-bold">{abbreviateNumber(m.totalPower)}</td>
              <td className="px-4 py-3">
                {typeof m.totalPctChange === "number" ? (
                  <span className="font-bold flex items-center gap-1" style={{ color: m.totalPctChange >= 0 ? "#39ff14" : "#ff4444" }}>
                    {m.totalPctChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {m.totalPctChange >= 0 ? "+" : ""}{m.totalPctChange.toFixed(1)}%
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          )}
        />
      </Section>

      {/* Movers Section */}
      {(data.movers.length > 0 || data.decliners.length > 0) && (
        <Section title="📈 Biggest WoW Movers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-[#39ff14] flex items-center gap-2">
                <TrendingUp size={24} /> Biggest Gainers
              </h4>
              <div className="overflow-x-auto border border-[#8a4baf]/30">
                <table className="w-full text-left">
                  <thead className="bg-[#1a0b2e] sticky top-0">
                    <tr className="border-b border-[#8a4baf]/30 text-[#8a4baf]">
                      <th className="px-4 py-3 font-bold">Rank</th>
                      <th className="px-4 py-3 font-bold">Name</th>
                      <th className="px-4 py-3 font-bold">SIM Power</th>
                      <th className="px-4 py-3 font-bold">Prev SIM</th>
                      <th className="px-4 py-3 font-bold">WoW Change</th>
                      <th className="px-4 py-3 font-bold">WoW %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.movers.map((m, idx) => (
                      <tr key={m.nameDisplay} className="border-b border-[#8a4baf]/10 hover:bg-[#1a0b2e]">
                        <td className="px-4 py-3 text-[#8a4baf] font-bold">{idx + 1}</td>
                        <td className="px-4 py-3 text-[#d6b4fc] font-bold">{m.nameDisplay}</td>
                        <td className="px-4 py-3 text-[#d6b4fc]">{abbreviateNumber(m.simPower)}</td>
                        <td className="px-4 py-3 text-[#d6b4fc]">{m.simPrev != null ? abbreviateNumber(m.simPrev) : "—"}</td>
                        <td className="px-4 py-3 text-[#39ff14] font-bold">{abbreviateNumber(m.wowChange)}</td>
                        <td className="px-4 py-3">
                          {typeof m.wowPct === "number" ? (
                            <span className="font-bold" style={{ color: "#39ff14" }}>
                              +{m.wowPct.toFixed(1)}%
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-[#ff4444] flex items-center gap-2">
                <TrendingDown size={24} /> Biggest Decliners
              </h4>
              <div className="overflow-x-auto border border-[#8a4baf]/30">
                <table className="w-full text-left">
                  <thead className="bg-[#1a0b2e] sticky top-0">
                    <tr className="border-b border-[#8a4baf]/30 text-[#8a4baf]">
                      <th className="px-4 py-3 font-bold">Rank</th>
                      <th className="px-4 py-3 font-bold">Name</th>
                      <th className="px-4 py-3 font-bold">SIM Power</th>
                      <th className="px-4 py-3 font-bold">Prev SIM</th>
                      <th className="px-4 py-3 font-bold">WoW Change</th>
                      <th className="px-4 py-3 font-bold">WoW %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.decliners.map((m, idx) => (
                      <tr key={m.nameDisplay} className="border-b border-[#8a4baf]/10 hover:bg-[#1a0b2e]">
                        <td className="px-4 py-3 text-[#8a4baf] font-bold">{idx + 1}</td>
                        <td className="px-4 py-3 text-[#d6b4fc] font-bold">{m.nameDisplay}</td>
                        <td className="px-4 py-3 text-[#d6b4fc]">{abbreviateNumber(m.simPower)}</td>
                        <td className="px-4 py-3 text-[#d6b4fc]">{m.simPrev != null ? abbreviateNumber(m.simPrev) : "—"}</td>
                        <td className="px-4 py-3 text-[#ff4444] font-bold">{abbreviateNumber(m.wowChange)}</td>
                        <td className="px-4 py-3">
                          {typeof m.wowPct === "number" ? (
                            <span className="font-bold" style={{ color: "#ff4444" }}>
                              {m.wowPct.toFixed(1)}%
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {data.movers.length === 0 && data.decliners.length === 0 && (
            <p className="text-center text-[#8a4baf] text-lg mt-4">
              Week-over-week data will appear after the next club push
            </p>
          )}
        </Section>
      )}
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────

function StatCard({ icon, label, value, format }) {
  return (
    <div className="bg-[#0a0412] border-2 border-[#8a4baf] p-6 rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <span className="text-[#8a4baf] text-lg font-bold tracking-widest uppercase">{label}</span>
      </div>
      <p className="text-4xl font-bold text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">
        {format ? abbreviateNumber(value) : value}
      </p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[#d6b4fc] tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function Table({ columns, data, renderRow }) {
  return (
    <div className="overflow-x-auto border border-[#8a4baf]/30">
      <table className="w-full">
        <thead className="bg-[#1a0b2e] sticky top-0">
          <tr className="border-b border-[#8a4baf]/30 text-[#8a4baf]">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-bold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{data.map(renderRow)}</tbody>
      </table>
    </div>
  );
}