"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Users, TrendingUp, TrendingDown, RefreshCw, AlertCircle, Clock } from "lucide-react";

interface ClubMember {
  name: string;
  sim_power: number;
  total_power: number;
  change_pct: number;
}

interface ClubApiResponse {
  members: ClubMember[];
  lastUpdated: string;
  totalMembers: number;
  avgTotalPower: number;
  error?: string;
}

type SortKey = "rank" | "name" | "sim_power" | "total_power" | "change_pct";
type SortDir = "asc" | "desc";

function formatNumber(num: number): string {
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

export default function ClubDashboardPage() {
  const [data, setData] = useState<ClubApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/snail/club", { credentials: "include" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      const json: ClubApiResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch club data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" ? "asc" : "desc");
    }
  };

  const sortedMembers = React.useMemo(() => {
    if (!data?.members) return [];

    const members = [...data.members];
    return members.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "rank":
          // rank by total_power desc by default
          cmp = b.total_power - a.total_power;
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "sim_power":
          cmp = a.sim_power - b.sim_power;
          break;
        case "total_power":
          cmp = a.total_power - b.total_power;
          break;
        case "change_pct":
          cmp = a.change_pct - b.change_pct;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data?.members, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) {
      return <span className="text-[#8a4baf]/40 ml-1">↕</span>;
    }
    return (
      <span className="text-[#39ff14] ml-1">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const Th = ({ col, children }: { col: SortKey; children: React.ReactNode }) => (
    <th
      className="px-4 py-4 text-left cursor-pointer select-none hover:bg-[#1a0b2e] transition-colors"
      onClick={() => handleSort(col)}
    >
      <span className="font-['VT323'] text-xl tracking-wider text-[#d6b4fc]">
        {children}
      </span>
      <SortIcon col={col} />
    </th>
  );

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="border-b-2 border-[#39ff14] pb-6">
        <h1
          className="text-5xl font-bold text-[#39ff14] tracking-tighter drop-shadow-[0_0_10px_#39ff14]"
          style={{ fontFamily: '"Press Start 2P", cursive' }}
        >
          🐌 Club Dashboard — Cormys Bar
        </h1>
        <p className="text-[#8a4baf] text-xl mt-3">
          Club member power rankings &amp; trends
        </p>
      </div>

      {/* Loading State */}
      {isLoading && !data && (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[#1a0b2e] border-2 border-[#8a4baf]/20 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="border-2 border-red-500 bg-red-500/10 p-12 text-center space-y-6">
          <AlertCircle size={64} className="mx-auto text-red-500" />
          <h2 className="text-3xl font-bold text-red-500 uppercase">Signal Lost</h2>
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

      {/* Stats Bar */}
      {data && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0a0412] border-2 border-[#8a4baf] p-6">
              <div className="flex items-center gap-3 mb-3">
                <Users size={24} className="text-[#8a4baf]" />
                <span className="text-[#8a4baf] text-lg font-bold tracking-widest uppercase">
                  Total Members
                </span>
              </div>
              <p className="text-4xl font-bold text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">
                {data.totalMembers}
              </p>
            </div>

            <div className="bg-[#0a0412] border-2 border-[#8a4baf] p-6">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp size={24} className="text-[#8a4baf]" />
                <span className="text-[#8a4baf] text-lg font-bold tracking-widest uppercase">
                  Avg Total Power
                </span>
              </div>
              <p className="text-4xl font-bold text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">
                {formatNumber(data.avgTotalPower)}
              </p>
            </div>

            <div className="bg-[#0a0412] border-2 border-[#8a4baf] p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock size={24} className="text-[#8a4baf]" />
                <span className="text-[#8a4baf] text-lg font-bold tracking-widest uppercase">
                  Last Updated
                </span>
              </div>
              <p className="text-2xl font-bold text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">
                {formatRelativeTime(data.lastUpdated)}
              </p>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-end">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="px-6 py-3 bg-[#2d0b4e] border-2 border-[#39ff14] text-[#39ff14] font-bold hover:bg-[#39ff14] hover:text-black transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
              REFRESH
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#1a0b2e] border-b-2 border-[#8a4baf]">
                  <Th col="rank">#</Th>
                  <Th col="name">Name</Th>
                  <Th col="sim_power">SIM Power</Th>
                  <Th col="total_power">Total Power</Th>
                  <Th col="change_pct">WoW Change %</Th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((member, idx) => {
                  const rank = sortKey === "rank" && sortDir === "asc"
                    ? idx + 1
                    : sortedMembers.length - idx;
                  const isPositive = member.change_pct > 0;
                  const isNegative = member.change_pct < 0;
                  const changeColor = isPositive
                    ? "#39ff14"
                    : isNegative
                    ? "#ff4444"
                    : "#8a4baf";

                  return (
                    <tr
                      key={member.name}
                      className="border-b border-[#8a4baf]/20 hover:bg-[#1a0b2e]/50 transition-colors"
                    >
                      <td className="px-4 py-4 text-[#8a4baf] font-bold">
                        {sortKey === "rank" ? rank : idx + 1}
                      </td>
                      <td className="px-4 py-4 text-[#d6b4fc] font-bold text-lg">
                        {member.name}
                      </td>
                      <td className="px-4 py-4 text-[#d6b4fc]">
                        {formatNumber(member.sim_power)}
                      </td>
                      <td className="px-4 py-4 text-[#39ff14] font-bold">
                        {formatNumber(member.total_power)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="font-bold flex items-center gap-1"
                          style={{ color: changeColor }}
                        >
                          {isPositive ? (
                            <TrendingUp size={16} />
                          ) : isNegative ? (
                            <TrendingDown size={16} />
                          ) : null}
                          {member.change_pct > 0 ? "+" : ""}
                          {member.change_pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedMembers.length === 0 && !isLoading && (
            <div className="p-20 text-center border-2 border-dashed border-[#8a4baf]/30 bg-[#0a0412]">
              <p className="text-[#8a4baf] text-2xl font-bold italic">
                NO_MEMBERS_FOUND
              </p>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="mt-12 p-6 bg-[#0a0412] border-2 border-[#8a4baf]/20 text-center opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-xs tracking-[0.2em] uppercase">
          CLUB_DASHBOARD // NEURAL_SYNC_STABLE // SNAIL_OS_V2.4.0
        </p>
      </div>
    </div>
  );
}
