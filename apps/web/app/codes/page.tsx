"use client";

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Code2, Download } from "lucide-react";

type CodeEntry = {
  code: string;
  source: string;
  status: "active" | "expired" | "unknown";
  addedAt: string;
};

const FAKE_CODES: CodeEntry[] = [
  { code: "SNAIL2025", source: "snelp", status: "active", addedAt: "2025-01-15" },
  { code: "SLIMYCLUB", source: "reddit", status: "unknown", addedAt: "2025-01-14" },
  { code: "NEWBIE50", source: "discord", status: "active", addedAt: "2025-01-13" },
  { code: "XMAS2024", source: "snelp", status: "expired", addedAt: "2024-12-25" },
  { code: "SPEEDBOOST", source: "twitter", status: "active", addedAt: "2025-01-10" },
  { code: "SECRETCODE", source: "reddit", status: "unknown", addedAt: "2025-01-08" },
];

export default function CodesPage() {
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredCodes = FAKE_CODES.filter((code) => {
    if (sourceFilter !== "all" && code.source !== sourceFilter) return false;
    if (statusFilter !== "all" && code.status !== statusFilter) return false;
    return true;
  });

  const sidebar = (
    <div className="space-y-3">
      <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3">
        <h2 className="text-xs font-semibold text-slate-200 mb-1">
          About Codes
        </h2>
        <p className="text-xs text-slate-400">
          This aggregates redemption codes from various sources. Later versions
          will scrape snelp, reddit, Discord, and other platforms automatically.
        </p>
      </div>
      <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3">
        <h2 className="text-xs font-semibold text-slate-200 mb-1">
          Integration TODOs
        </h2>
        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
          <li>Connect to admin-api /codes endpoint</li>
          <li>Auto-refresh from scraper workflows</li>
          <li>Add manual code submission form</li>
          <li>Verify code status with game API</li>
        </ul>
      </div>
    </div>
  );

  const status = (
    <>
      <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
      <span>Sandbox mode – using mock data</span>
    </>
  );

  return (
    <PageShell
      icon={<Code2 className="h-6 w-6 text-neon-green" />}
      title="Codes Aggregator"
      subtitle="Redemption codes from all sources. Backend scraping not yet wired."
      primaryAction={
        <button
          type="button"
          className="rounded-md bg-neon-green px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-lime-green flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          Export CSV
        </button>
      }
      status={status}
      sidebar={sidebar}
    >
      {/* Filter Controls */}
      <div className="flex gap-3 p-3 border border-slate-800 rounded-lg bg-slate-900/60">
        <div className="flex-1">
          <label className="block text-xs text-slate-400 mb-1">Source</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full bg-slate-900 text-xs text-slate-100 rounded-md px-2 py-1.5 outline-none border border-slate-700 focus:border-neon-green"
          >
            <option value="all">All sources</option>
            <option value="snelp">Snelp</option>
            <option value="reddit">Reddit</option>
            <option value="discord">Discord</option>
            <option value="twitter">Twitter</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-slate-400 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 text-xs text-slate-100 rounded-md px-2 py-1.5 outline-none border border-slate-700 focus:border-neon-green"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      {/* Codes List */}
      <div className="border border-slate-800 rounded-lg bg-slate-900/60 divide-y divide-slate-800">
        {filteredCodes.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-400">
            No codes match your filters.
          </div>
        )}
        {filteredCodes.map((entry, idx) => (
          <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-800/40">
            <div className="flex-1">
              <div className="font-mono text-sm font-semibold text-neon-green">
                {entry.code}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                From {entry.source} • Added {entry.addedAt}
              </div>
            </div>
            <div>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  entry.status === "active"
                    ? "bg-green-500/20 text-green-400"
                    : entry.status === "expired"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-slate-500/20 text-slate-400"
                }`}
              >
                {entry.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3 text-center">
          <div className="text-xs text-slate-400">Total Codes</div>
          <div className="text-2xl font-bold text-neon-green mt-1">
            {FAKE_CODES.length}
          </div>
        </div>
        <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3 text-center">
          <div className="text-xs text-slate-400">Active</div>
          <div className="text-2xl font-bold text-green-400 mt-1">
            {FAKE_CODES.filter((c) => c.status === "active").length}
          </div>
        </div>
        <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3 text-center">
          <div className="text-xs text-slate-400">Unknown</div>
          <div className="text-2xl font-bold text-slate-400 mt-1">
            {FAKE_CODES.filter((c) => c.status === "unknown").length}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
