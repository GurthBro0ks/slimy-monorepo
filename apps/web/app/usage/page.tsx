"use client";

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { BarChart3, DollarSign, Image, Zap } from "lucide-react";

export default function UsagePage() {
  const [timeFilter, setTimeFilter] = useState<string>("7d");

  // Mock data
  const mockStats = {
    totalTokens: 1234567,
    openAiCost: 45.67,
    imageCount: 234,
    requestCount: 1523,
  };

  const sidebar = (
    <div className="space-y-3">
      <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3">
        <h2 className="text-xs font-semibold text-slate-200 mb-1">
          About Usage
        </h2>
        <p className="text-xs text-slate-400">
          Tracks OpenAI token usage, costs, image generation, and API requests.
          Currently showing mock data; real metrics come from admin-api once wired.
        </p>
      </div>
      <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3">
        <h2 className="text-xs font-semibold text-slate-200 mb-1">
          Integration TODOs
        </h2>
        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
          <li>Connect to admin-api /usage endpoint</li>
          <li>Add date range picker</li>
          <li>Implement chart library (recharts / chart.js)</li>
          <li>Export usage reports to CSV</li>
        </ul>
      </div>
    </div>
  );

  const status = (
    <>
      <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
      <span>Sandbox mode – displaying mock usage data</span>
    </>
  );

  return (
    <PageShell
      icon={<BarChart3 className="h-6 w-6 text-neon-green" />}
      title="Usage & Costs"
      subtitle="Monitor OpenAI usage and platform metrics. Backend not yet connected."
      primaryAction={
        <button
          type="button"
          className="rounded-md bg-neon-green px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-lime-green"
        >
          Export Report
        </button>
      }
      status={status}
      sidebar={sidebar}
    >
      {/* Time Filter */}
      <div className="flex gap-2 p-3 border border-slate-800 rounded-lg bg-slate-900/60">
        <span className="text-xs text-slate-400 self-center">Period:</span>
        <button
          onClick={() => setTimeFilter("24h")}
          className={`px-2 py-1 rounded text-xs ${
            timeFilter === "24h"
              ? "bg-neon-green text-slate-900"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Last 24h
        </button>
        <button
          onClick={() => setTimeFilter("7d")}
          className={`px-2 py-1 rounded text-xs ${
            timeFilter === "7d"
              ? "bg-neon-green text-slate-900"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Last 7 days
        </button>
        <button
          onClick={() => setTimeFilter("30d")}
          className={`px-2 py-1 rounded text-xs ${
            timeFilter === "30d"
              ? "bg-neon-green text-slate-900"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Last 30 days
        </button>
        <button
          onClick={() => setTimeFilter("all")}
          className={`px-2 py-1 rounded text-xs ${
            timeFilter === "all"
              ? "bg-neon-green text-slate-900"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          All time
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-slate-400">Total Tokens</span>
          </div>
          <div className="text-2xl font-bold text-slate-50">
            {mockStats.totalTokens.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            ~{Math.round(mockStats.totalTokens / 1000)}k tokens
          </div>
        </div>

        <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-xs text-slate-400">OpenAI Cost</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            ${mockStats.openAiCost.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Estimated spend
          </div>
        </div>

        <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Image className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-slate-400">Images</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {mockStats.imageCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Generated or analyzed
          </div>
        </div>

        <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-neon-green" />
            <span className="text-xs text-slate-400">Requests</span>
          </div>
          <div className="text-2xl font-bold text-neon-green">
            {mockStats.requestCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            API calls made
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="border-2 border-dashed border-slate-700 rounded-lg bg-slate-900/30 p-8">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-400 mb-1">
            Usage Chart Placeholder
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            A chart library (like recharts or chart.js) will be integrated here
            to visualize usage trends over time. For now, this area is reserved
            for future charting implementation.
          </p>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="border border-slate-800 rounded-lg bg-slate-900/60">
        <div className="p-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200">Usage Breakdown</h3>
        </div>
        <div className="divide-y divide-slate-800 text-xs">
          <div className="p-3 flex justify-between">
            <span className="text-slate-400">GPT-4 Turbo tokens</span>
            <span className="text-slate-100 font-mono">987,654</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="text-slate-400">GPT-3.5 Turbo tokens</span>
            <span className="text-slate-100 font-mono">246,913</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="text-slate-400">Vision API calls</span>
            <span className="text-slate-100 font-mono">234</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="text-slate-400">Average cost per request</span>
            <span className="text-green-400 font-mono">
              ${(mockStats.openAiCost / mockStats.requestCount).toFixed(4)}
            </span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
