"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Clock,
  Upload,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  Minus,
  Filter,
} from "lucide-react";

interface ClubMember {
  name: string;
  sim_power: number;
  total_power: number;
  sim_prev: number;
  total_prev: number;
  sim_pct_change: number;
  total_pct_change: number;
  latest_at: string;
}

interface ClubApiResponse {
  members: ClubMember[];
  lastUpdated: string;
  totalMembers: number;
  avgTotalPower: number;
  error?: string;
}

interface ParsedMember {
  name: string;
  simPower: number | null;
  totalPower: number | null;
  issues: string[];
  rowIndex: number;
}

interface ImportResult {
  ok: boolean;
  imported: number;
  updated: number;
  new: number;
  mode?: string;
}

type SortKey = "rank" | "name" | "sim_power" | "total_power" | "sim_pct_change" | "total_pct_change";
type SortDir = "asc" | "desc";
type PowerFilter = "all" | "10M+" | "5M+" | "1M+";

function abbreviateNumber(num: number): string {
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return sign + (abs / 1_000_000_000).toFixed(1) + "B";
  if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return sign + Math.round(abs / 1_000) + "K";
  return num.toLocaleString("en-US");
}

function formatFullNumber(num: number): string {
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

const MEDALS = ["🥇", "🥈", "🥉"];

const POWER_FILTERS: { label: PowerFilter; min: number }[] = [
  { label: "All", min: 0 },
  { label: "10M+", min: 10_000_000 },
  { label: "5M+", min: 5_000_000 },
  { label: "1M+", min: 1_000_000 },
];

export default function ClubDashboardPage() {
  const [data, setData] = useState<ClubApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("sim_power");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [powerFilter, setPowerFilter] = useState<PowerFilter>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedMember[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" || key === "name" ? "asc" : "desc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    if (!data?.members) return [];
    let members = [...data.members];

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      members = members.filter((m) => m.name.toLowerCase().includes(q));
    }

    const filterCfg = POWER_FILTERS.find((f) => f.label === powerFilter);
    if (filterCfg && filterCfg.min > 0) {
      members = members.filter((m) => m.sim_power >= filterCfg!.min);
    }

    return members.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "rank": cmp = b.sim_power - a.sim_power; break;
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "sim_power": cmp = a.sim_power - b.sim_power; break;
        case "total_power": cmp = a.total_power - b.total_power; break;
        case "sim_pct_change": cmp = a.sim_pct_change - b.sim_pct_change; break;
        case "total_pct_change": cmp = a.total_pct_change - b.total_pct_change; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data?.members, sortKey, sortDir, debouncedSearch, powerFilter]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-[#8a4baf]/40 ml-1">↕</span>;
    return <span className="text-[#39ff14] ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const Th = ({ col, children }: { col: SortKey; children: React.ReactNode }) => (
    <th
      className="px-4 py-4 text-left cursor-pointer select-none hover:bg-[#1a0b2e] transition-colors whitespace-nowrap"
      onClick={() => handleSort(col)}
    >
      <span className="font-['VT323'] text-xl tracking-wider text-[#d6b4fc]">{children}</span>
      <SortIcon col={col} />
    </th>
  );

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadError(null);
    setParsedData([]);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        setSheetNames(workbook.SheetNames);
        if (workbook.SheetNames.length > 0) setSelectedSheet(workbook.SheetNames[0]);
      } catch {
        setUploadError("Failed to parse file. Please ensure it's a valid Excel or CSV file.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const parseSheet = useCallback(() => {
    if (!selectedFile || !selectedSheet) return;
    setIsParsing(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[selectedSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        const members: ParsedMember[] = [];
        const seenNames = new Map<string, number>();

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          const name = row[0] ? String(row[0]).trim() : "";
          const simPowerRaw = row[1];
          const totalPowerRaw = row[2];
          const issues: string[] = [];

          if (!name) issues.push("Missing name");

          let simPower: number | null = null;
          let totalPower: number | null = null;

          if (simPowerRaw !== undefined && simPowerRaw !== null && simPowerRaw !== "") {
            const parsed = parseFloat(String(simPowerRaw));
            if (isNaN(parsed)) issues.push("SIM Power not numeric");
            else simPower = parsed;
          }

          if (totalPowerRaw !== undefined && totalPowerRaw !== null && totalPowerRaw !== "") {
            const parsed = parseFloat(String(totalPowerRaw));
            if (isNaN(parsed)) issues.push("Total Power not numeric");
            else totalPower = parsed;
          }

          if (name) {
            const lowerName = name.toLowerCase();
            if (seenNames.has(lowerName)) {
              issues.push(`Duplicate (row ${seenNames.get(lowerName)})`);
            } else {
              seenNames.set(lowerName, i + 1);
            }
          }

          members.push({ name, simPower, totalPower, issues, rowIndex: i + 1 });
        }
        setParsedData(members);
      } catch {
        setUploadError("Failed to parse sheet.");
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }, [selectedFile, selectedSheet]);

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setIsImporting(true);
    setUploadError(null);
    setImportResult(null);

    try {
      const validMembers = parsedData
        .filter((m) => m.name && m.issues.length === 0)
        .map((m) => ({ name: m.name, sim_power: m.simPower, total_power: m.totalPower }));

      const response = await fetch("/api/snail/club/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: validMembers, sheetName: selectedFile?.name }),
      });

      const result: ImportResult = await response.json();
      if (!response.ok) throw new Error((result as any).message || "Import failed");

      setImportResult(result);
      if (result.ok) {
        setTimeout(() => { closeModal(); fetchData(); }, 2000);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const closeModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setParsedData([]);
    setSheetNames([]);
    setSelectedSheet("");
    setUploadError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validCount = parsedData.filter((m) => m.issues.length === 0).length;
  const issueCount = parsedData.filter((m) => m.issues.length > 0).length;

  const isFiltered = debouncedSearch !== "" || powerFilter !== "all";

  const toggleExpand = (name: string) => {
    setExpandedRow((prev) => (prev === name ? null : name));
  };

  const WoWCell = ({ value }: { value: number }) => {
    if (value === 0 || value === null || isNaN(value)) {
      return (
        <span className="font-bold flex items-center gap-1 text-[#8a4baf]">
          <Minus size={14} /> —
        </span>
      );
    }
    const isPositive = value > 0;
    const color = isPositive ? "#39ff14" : "#ff4444";
    return (
      <span className="font-bold flex items-center gap-1" style={{ color }}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {isPositive ? "+" : ""}
        {value.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="border-b-2 border-[#39ff14] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-5xl font-bold text-[#39ff14] tracking-tighter drop-shadow-[0_0_10px_#39ff14]"
            style={{ fontFamily: '"Press Start 2P", cursive' }}
          >
            🐌 Club Dashboard — Cormys Bar
          </h1>
          <p className="text-[#8a4baf] text-xl mt-3">Club member power rankings &amp; trends</p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#2d0b4e] border-2 border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14] hover:text-black transition-all font-bold tracking-widest shrink-0"
        >
          <Upload size={20} />
          UPLOAD SHEET
        </button>
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
            <p className="text-[#8a4baf] text-sm">MySQL not configured. Add CLUB_MYSQL_* vars to .env and restart.</p>
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

      {/* Stats Bar + Table */}
      {data && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0a0412] border-2 border-[#8a4baf] p-6">
              <div className="flex items-center gap-3 mb-3">
                <Users size={24} className="text-[#8a4baf]" />
                <span className="text-[#8a4baf] text-lg font-bold tracking-widest uppercase">Total Members</span>
              </div>
              <p className="text-4xl font-bold text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">
                {data.totalMembers}
              </p>
            </div>

            <div className="bg-[#0a0412] border-2 border-[#8a4baf] p-6">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp size={24} className="text-[#8a4baf]" />
                <span className="text-[#8a4baf] text-lg font-bold tracking-widest uppercase">Avg Total Power</span>
              </div>
              <p className="text-4xl font-bold text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">
                {abbreviateNumber(data.avgTotalPower)}
              </p>
            </div>

            <div className="bg-[#0a0412] border-2 border-[#8a4baf] p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock size={24} className="text-[#8a4baf]" />
                <span className="text-[#8a4baf] text-lg font-bold tracking-widest uppercase">Last Updated</span>
              </div>
              <p className="text-2xl font-bold text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">
                {formatRelativeTime(data.lastUpdated)}
              </p>
            </div>
          </div>

          {/* Search, Filters, Refresh */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 min-w-0 sm:min-w-[280px]">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a4baf]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search members..."
                  className="w-full pl-10 pr-9 py-3 bg-[#0a0412] border-2 border-[#8a4baf]/50 text-[#d6b4fc] font-mono placeholder:text-[#8a4baf]/50 focus:border-[#39ff14] focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[#8a4baf]/20 transition-colors"
                  >
                    <X size={16} className="text-[#8a4baf]" />
                  </button>
                )}
              </div>

              {/* Power Range Filters */}
              <div className="flex items-center gap-1">
                <Filter size={16} className="text-[#8a4baf] mr-1" />
                {POWER_FILTERS.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => setPowerFilter(f.label)}
                    className={`px-3 py-2 border-2 text-sm font-bold tracking-wider transition-all ${
                      powerFilter === f.label
                        ? "border-[#39ff14] text-[#39ff14] bg-[#39ff14]/10"
                        : "border-[#8a4baf]/30 text-[#8a4baf] hover:border-[#8a4baf] hover:text-[#d6b4fc]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isFiltered && (
                <span className="text-sm text-[#8a4baf]">
                  {filteredAndSorted.length} of {data.members.length} members
                </span>
              )}
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="px-6 py-3 bg-[#2d0b4e] border-2 border-[#39ff14] text-[#39ff14] font-bold hover:bg-[#39ff14] hover:text-black transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                REFRESH
              </button>
            </div>
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
                  <Th col="sim_pct_change">SIM WoW%</Th>
                  <Th col="total_pct_change">Total WoW%</Th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((member, idx) => {
                  const rank = idx + 1;
                  const isExpanded = expandedRow === member.name;

                  return (
                    <React.Fragment key={member.name}>
                      <tr
                        className={`border-b border-[#8a4baf]/20 hover:bg-[#1a0b2e]/50 transition-colors cursor-pointer ${
                          isExpanded ? "bg-[#1a0b2e]/30" : ""
                        }`}
                        onClick={() => toggleExpand(member.name)}
                      >
                        <td className="px-4 py-4 text-[#8a4baf] font-bold">
                          {rank <= 3 ? (
                            <span className="text-xl">{MEDALS[rank - 1]}</span>
                          ) : (
                            rank
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[#d6b4fc] font-bold text-lg">{member.name}</span>
                            {isExpanded ? (
                              <ChevronUp size={14} className="text-[#8a4baf]" />
                            ) : (
                              <ChevronDown size={14} className="text-[#8a4baf]/50" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[#d6b4fc]">{abbreviateNumber(member.sim_power)}</td>
                        <td className="px-4 py-4 text-[#39ff14] font-bold">{abbreviateNumber(member.total_power)}</td>
                        <td className="px-4 py-4"><WoWCell value={member.sim_pct_change} /></td>
                        <td className="px-4 py-4"><WoWCell value={member.total_pct_change} /></td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#0d0618] border-b border-[#8a4baf]/10">
                          <td colSpan={6} className="px-6 py-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm">
                              <div>
                                <span className="text-[#8a4baf] tracking-wider uppercase text-xs">SIM Power</span>
                                <p className="text-[#d6b4fc] font-bold">{formatFullNumber(member.sim_power)}</p>
                              </div>
                              <div>
                                <span className="text-[#8a4baf] tracking-wider uppercase text-xs">Total Power</span>
                                <p className="text-[#39ff14] font-bold">{formatFullNumber(member.total_power)}</p>
                              </div>
                              <div>
                                <span className="text-[#8a4baf] tracking-wider uppercase text-xs">Previous SIM</span>
                                <p className="text-[#d6b4fc]">{member.sim_prev > 0 ? formatFullNumber(member.sim_prev) : "—"}</p>
                              </div>
                              <div>
                                <span className="text-[#8a4baf] tracking-wider uppercase text-xs">Previous Total</span>
                                <p className="text-[#d6b4fc]">{member.total_prev > 0 ? formatFullNumber(member.total_prev) : "—"}</p>
                              </div>
                              <div>
                                <span className="text-[#8a4baf] tracking-wider uppercase text-xs">SIM Change %</span>
                                <p><WoWCell value={member.sim_pct_change} /></p>
                              </div>
                              <div>
                                <span className="text-[#8a4baf] tracking-wider uppercase text-xs">Total Change %</span>
                                <p><WoWCell value={member.total_pct_change} /></p>
                              </div>
                              <div className="sm:col-span-2 lg:col-span-3">
                                <span className="text-[#8a4baf] tracking-wider uppercase text-xs">Last Updated</span>
                                <p className="text-[#d6b4fc]">{formatDateTime(member.latest_at)}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAndSorted.length === 0 && !isLoading && (
            <div className="p-20 text-center border-2 border-dashed border-[#8a4baf]/30 bg-[#0a0412]">
              <p className="text-[#8a4baf] text-2xl font-bold italic">NO_MEMBERS_FOUND</p>
              {isFiltered && (
                <button
                  onClick={() => { setSearchQuery(""); setPowerFilter("all"); }}
                  className="mt-4 px-6 py-2 border-2 border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14] hover:text-black transition-all font-bold"
                >
                  CLEAR FILTERS
                </button>
              )}
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

      {/* Upload Sheet Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0412] border-2 border-[#39ff14] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#39ff14]/30">
              <div className="flex items-center gap-4">
                <FileSpreadsheet className="w-8 h-8 text-[#39ff14]" />
                <h2 className="text-3xl font-bold text-[#39ff14]" style={{ fontFamily: '"VT323", monospace' }}>
                  CLUB SHEET IMPORTER
                </h2>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-[#39ff14]/10 transition-colors">
                <X className="w-6 h-6 text-[#39ff14]" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="space-y-4">
                <label className="block text-[#d6b4fc] font-bold">
                  SELECT_FILE (.xlsx, .csv, .tsv)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv,.tsv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-[#d6b4fc] file:mr-4 file:py-2 file:px-4 file:border-2 file:border-[#39ff14] file:text-[#39ff14] file:font-bold file:bg-[#1a0b2e] file:hover:bg-[#39ff14] file:hover:text-black file:transition-all file:cursor-pointer rounded"
                />
              </div>

              {sheetNames.length > 1 && (
                <div className="space-y-4">
                  <label className="block text-[#d6b4fc] font-bold">SELECT_SHEET</label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value)}
                    className="w-full p-3 bg-[#1a0b2e] border-2 border-[#39ff14]/50 text-[#d6b4fc] font-mono focus:border-[#39ff14] focus:outline-none"
                  >
                    {sheetNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedFile && selectedSheet && (
                <button
                  onClick={parseSheet}
                  disabled={isParsing}
                  className="flex items-center gap-2 px-6 py-3 bg-[#2d0b4e] border-2 border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14] hover:text-black transition-all font-bold tracking-widest disabled:opacity-50"
                >
                  {isParsing ? (
                    <><Loader2 className="animate-spin" size={20} /> PARSING...</>
                  ) : (
                    <><FileSpreadsheet size={20} /> PARSE_SHEET</>
                  )}
                </button>
              )}

              {uploadError && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500 text-red-500">
                  <AlertCircle size={20} />
                  <span>{uploadError}</span>
                </div>
              )}

              {importResult && importResult.ok && (
                <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500 text-green-500">
                  <CheckCircle2 size={20} />
                  <span>
                    Import successful! {importResult.imported} members ({importResult.new} new, {importResult.updated} updated)
                    {importResult.mode === "sandbox" && " [SANDBOX MODE]"}
                  </span>
                </div>
              )}

              {parsedData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl text-[#39ff14] font-bold">
                      PREVIEW: {parsedData.length} MEMBERS DETECTED
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-[#39ff14]">{validCount} valid</span>
                      {issueCount > 0 && <span className="text-red-500">{issueCount} issues</span>}
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-96 overflow-y-auto border border-[#8a4baf]/30">
                    <table className="w-full text-left">
                      <thead className="bg-[#1a0b2e] sticky top-0">
                        <tr className="border-b border-[#8a4baf]/30 text-[#8a4baf]">
                          <th className="p-3 font-bold">ROW</th>
                          <th className="p-3 font-bold">NAME</th>
                          <th className="p-3 font-bold">SIM POWER</th>
                          <th className="p-3 font-bold">TOTAL POWER</th>
                          <th className="p-3 font-bold">ISSUES</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#d6b4fc]">
                        {parsedData.map((member, idx) => (
                          <tr
                            key={idx}
                            className={`border-b border-[#8a4baf]/10 ${member.issues.length > 0 ? "bg-red-500/5" : "hover:bg-[#1a0b2e]"}`}
                          >
                            <td className="p-3 text-[#8a4baf]">{member.rowIndex}</td>
                            <td className="p-3 font-bold">
                              {member.name || <span className="text-red-500 italic">MISSING</span>}
                            </td>
                            <td className="p-3">
                              {member.simPower !== null ? member.simPower.toLocaleString() : "—"}
                            </td>
                            <td className="p-3">
                              {member.totalPower !== null ? member.totalPower.toLocaleString() : "—"}
                            </td>
                            <td className="p-3">
                              {member.issues.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {member.issues.map((issue, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-red-500/20 border border-red-500 text-red-500 text-xs">
                                      {issue}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <CheckCircle2 className="text-green-500" size={16} />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-4 p-6 border-t border-[#39ff14]/30">
              <button
                onClick={closeModal}
                className="px-6 py-3 border-2 border-[#8a4baf] text-[#8a4baf] hover:bg-[#8a4baf] hover:text-black transition-all font-bold tracking-widest"
              >
                CANCEL
              </button>
              {parsedData.length > 0 && validCount > 0 && (
                <button
                  onClick={handleImport}
                  disabled={isImporting || issueCount > 0}
                  className="flex items-center gap-2 px-6 py-3 bg-[#39ff14] border-2 border-[#39ff14] text-black hover:bg-transparent hover:text-[#39ff14] transition-all font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <><Loader2 className="animate-spin" size={20} /> IMPORTING...</>
                  ) : (
                    <><CheckCircle2 size={20} /> APPROVE &amp; IMPORT</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
