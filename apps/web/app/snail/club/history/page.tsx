"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";

interface LogEntry {
  id: number;
  guild_id: string;
  action_type: string;
  user_email: string;
  user_role: string;
  member_count: number;
  members_json: string;
  provider: string;
  source_info: string;
  errors_json: string;
  created_at: string;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ACTION_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  screenshot_push: { bg: "bg-green-500/10", border: "border-green-500", text: "text-green-500", label: "PUSH" },
  screenshot_scan: { bg: "bg-cyan-500/10", border: "border-cyan-500", text: "text-cyan-500", label: "SCAN" },
  xlsx_import: { bg: "bg-purple-500/10", border: "border-purple-500", text: "text-purple-500", label: "XLSX" },
  sheet_upload: { bg: "bg-yellow-500/10", border: "border-yellow-500", text: "text-yellow-500", label: "SHEET" },
};

export default function ClubHistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMembers, setExpandedMembers] = useState<Set<number>>(new Set());
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());

  const isOwner =
    user?.role === "owner" ||
    (process.env.NEXT_PUBLIC_OWNER_USER_ID &&
      user?.id === process.env.NEXT_PUBLIC_OWNER_USER_ID);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/snail/club/history", { credentials: "include" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isOwner) {
      return;
    }
    if (!authLoading && isOwner) {
      fetchHistory();
    }
  }, [authLoading, isOwner, fetchHistory]);

  const toggleMembers = (id: number) => {
    setExpandedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleErrors = (id: number) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const parseJson = (json: string): string[] => {
    try {
      return JSON.parse(json || "[]");
    } catch {
      return [];
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-[#39ff14] animate-spin" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <p className="text-red-500 text-xl font-bold">OWNER ACCESS REQUIRED</p>
          <Link href="/snail/club" className="text-[#8a4baf] hover:text-[#39ff14] underline">
            Back to Club Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-mono">
      <div className="border-b-2 border-[#39ff14] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-3xl md:text-5xl font-bold text-[#39ff14] tracking-tighter drop-shadow-[0_0_10px_#39ff14]"
            style={{ fontFamily: '"Press Start 2P", cursive' }}
          >
            IMPORT HISTORY
          </h1>
          <p className="text-[#8a4baf] text-xl mt-3">Log of all club data import and push operations</p>
        </div>
        <Link
          href="/snail/club"
          className="flex items-center gap-2 px-6 py-3 border-2 border-[#8a4baf] text-[#8a4baf] hover:bg-[#8a4baf] hover:text-black transition-all font-bold tracking-widest shrink-0"
        >
          <ArrowLeft size={20} />
          BACK TO CLUB
        </Link>
      </div>

      {isLoading && (
        <div className="border-2 border-[#8a4baf]/30 bg-[#0a0412] p-12 text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-[#39ff14] animate-spin" />
          <p className="text-[#8a4baf] text-lg">Loading history...</p>
        </div>
      )}

      {error && (
        <div className="border-2 border-red-500 bg-red-500/10 p-8 text-center space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <p className="text-red-500 font-bold">Failed to load history: {error}</p>
        </div>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <div className="border-2 border-dashed border-[#8a4baf]/30 bg-[#0a0412] p-12 text-center space-y-4">
          <History size={48} className="mx-auto text-[#8a4baf]/50" />
          <p className="text-[#8a4baf] text-2xl font-bold">NO HISTORY ENTRIES YET</p>
          <p className="text-[#8a4baf]/70 text-sm">Import operations will appear here after you scan screenshots or import data.</p>
        </div>
      )}

      {!isLoading && !error && entries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[#8a4baf] text-sm">{entries.length} entries (most recent first)</p>
            <button
              onClick={fetchHistory}
              className="px-4 py-2 border-2 border-[#8a4baf] text-[#8a4baf] hover:bg-[#8a4baf] hover:text-black transition-all font-bold text-sm tracking-widest"
            >
              REFRESH
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#1a0b2e] border-b-2 border-[#8a4baf]">
                  <th className="px-4 py-4 text-left text-[#d6b4fc] font-bold text-sm tracking-widest uppercase">Date/Time</th>
                  <th className="px-4 py-4 text-left text-[#d6b4fc] font-bold text-sm tracking-widest uppercase">Action</th>
                  <th className="px-4 py-4 text-left text-[#d6b4fc] font-bold text-sm tracking-widest uppercase">User</th>
                  <th className="px-4 py-4 text-left text-[#d6b4fc] font-bold text-sm tracking-widest uppercase">Members</th>
                  <th className="px-4 py-4 text-left text-[#d6b4fc] font-bold text-sm tracking-widest uppercase">Provider</th>
                  <th className="px-4 py-4 text-left text-[#d6b4fc] font-bold text-sm tracking-widest uppercase">Details</th>
                  <th className="px-4 py-4 text-left text-[#d6b4fc] font-bold text-sm tracking-widest uppercase">Errors</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const style = ACTION_STYLES[entry.action_type] || ACTION_STYLES.screenshot_scan;
                  const memberList = parseJson(entry.members_json);
                  const errorList = parseJson(entry.errors_json);
                  const isMembersExpanded = expandedMembers.has(entry.id);
                  const isErrorsExpanded = expandedErrors.has(entry.id);

                  return (
                    <React.Fragment key={entry.id}>
                      <tr className="border-b border-[#8a4baf]/20 hover:bg-[#1a0b2e]/50 transition-colors">
                        <td className="px-4 py-3 text-[#d6b4fc] text-sm whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-[#8a4baf]" />
                            {formatDateTime(entry.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-bold border ${style.bg} ${style.border} ${style.text}`}>
                            {style.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#d6b4fc] text-sm">
                          <div>{entry.user_email}</div>
                          <div className="text-[#8a4baf] text-xs">{entry.user_role}</div>
                        </td>
                        <td className="px-4 py-3 text-[#d6b4fc] text-sm">
                          <button
                            onClick={() => toggleMembers(entry.id)}
                            className="flex items-center gap-1 hover:text-[#39ff14] transition-colors"
                          >
                            <span className="font-bold">{entry.member_count}</span>
                            {memberList.length > 0 && (
                              isMembersExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-[#d6b4fc] text-sm">{entry.provider || "—"}</td>
                        <td className="px-4 py-3 text-[#8a4baf] text-sm max-w-[200px] truncate">{entry.source_info || "—"}</td>
                        <td className="px-4 py-3 text-sm">
                          {errorList.length > 0 ? (
                            <button
                              onClick={() => toggleErrors(entry.id)}
                              className="flex items-center gap-1 text-[#ff6b00] hover:text-[#ff4444] transition-colors"
                            >
                              <span className="font-bold">{errorList.length}</span>
                              {isErrorsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          ) : (
                            <span className="text-[#8a4baf]/50">—</span>
                          )}
                        </td>
                      </tr>
                      {isMembersExpanded && memberList.length > 0 && (
                        <tr className="bg-[#0d0618] border-b border-[#8a4baf]/10">
                          <td colSpan={7} className="px-8 py-3">
                            <div className="flex flex-wrap gap-2">
                              {memberList.map((name, i) => (
                                <span key={i} className="px-2 py-1 bg-[#1a0b2e] border border-[#8a4baf]/30 text-[#d6b4fc] text-xs">
                                  {name}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                      {isErrorsExpanded && errorList.length > 0 && (
                        <tr className="bg-[#0d0618] border-b border-[#8a4baf]/10">
                          <td colSpan={7} className="px-8 py-3">
                            <ul className="space-y-1">
                              {errorList.map((err, i) => (
                                <li key={i} className="text-[#ff6b00] text-xs">&bull; {err}</li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-12 p-6 bg-[#0a0412] border-2 border-[#8a4baf]/20 text-center opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-xs tracking-[0.2em] uppercase">
          IMPORT_HISTORY // CLUB_LOG_VIEWER // SNAIL_OS_V2.6.0
        </p>
      </div>
    </div>
  );
}
