"use client";

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Camera, Upload, Eye } from "lucide-react";

type AnalysisEntry = {
  id: string;
  filename: string;
  detectedType: string;
  status: "parsed" | "pending" | "error";
  analyzedAt: string;
};

const MOCK_ANALYSES: AnalysisEntry[] = [
  {
    id: "1",
    filename: "club_power_week45.png",
    detectedType: "Club power snapshot",
    status: "parsed",
    analyzedAt: "2025-01-15 14:23",
  },
  {
    id: "2",
    filename: "supersnail_city_lvl87.jpg",
    detectedType: "Supersnail city level",
    status: "parsed",
    analyzedAt: "2025-01-15 13:10",
  },
  {
    id: "3",
    filename: "IMG_4523.png",
    detectedType: "Unknown",
    status: "pending",
    analyzedAt: "2025-01-15 12:05",
  },
  {
    id: "4",
    filename: "snail_stats.png",
    detectedType: "Snail statistics",
    status: "parsed",
    analyzedAt: "2025-01-14 16:45",
  },
];

export default function ScreenshotsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [analyses] = useState<AnalysisEntry[]>(MOCK_ANALYSES);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    // Simulate upload delay
    await new Promise((r) => setTimeout(r, 1000));
    setIsUploading(false);

    // TODO: Integrate with admin-api /screenshots/upload endpoint
    alert(`Would upload ${files.length} file(s) once backend is connected.`);
  };

  const sidebar = (
    <div className="space-y-3">
      <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3">
        <h2 className="text-xs font-semibold text-slate-200 mb-1">
          About Screenshot Analysis
        </h2>
        <p className="text-xs text-slate-400">
          Upload game screenshots for AI-powered OCR and data extraction. GPT-4
          Vision identifies content type and extracts structured data.
        </p>
      </div>
      <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3">
        <h2 className="text-xs font-semibold text-slate-200 mb-1">
          Supported Types
        </h2>
        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
          <li>Club power snapshots</li>
          <li>Supersnail city levels</li>
          <li>Snail statistics screens</li>
          <li>Relic/artifact data</li>
        </ul>
      </div>
      <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3">
        <h2 className="text-xs font-semibold text-slate-200 mb-1">
          Integration TODOs
        </h2>
        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
          <li>Connect to admin-api upload endpoint</li>
          <li>Stream analysis results via WebSocket</li>
          <li>Add detail modal for extracted data</li>
          <li>Enable batch processing</li>
        </ul>
      </div>
    </div>
  );

  const status = (
    <>
      <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
      <span>Sandbox mode – showing mock analysis results</span>
    </>
  );

  return (
    <PageShell
      icon={<Camera className="h-6 w-6 text-neon-green" />}
      title="Screenshot Analysis"
      subtitle="AI-powered OCR and data extraction. Backend wiring pending."
      primaryAction={
        <button
          type="button"
          className="rounded-md bg-neon-green px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-lime-green"
        >
          Batch Upload
        </button>
      }
      status={status}
      sidebar={sidebar}
    >
      {/* Upload Area */}
      <div className="border-2 border-dashed border-slate-700 rounded-lg bg-slate-900/30 p-6">
        <div className="text-center">
          <Upload className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300 mb-2">
            Upload Screenshots
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            Drag and drop images here or click to browse. Supported formats: PNG, JPG, JPEG.
          </p>
          <label className="inline-block">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <span className="cursor-pointer inline-block rounded-md bg-neon-green px-4 py-2 text-xs font-medium text-slate-900 hover:bg-lime-green disabled:opacity-50">
              {isUploading ? "Uploading..." : "Choose Files"}
            </span>
          </label>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="border border-slate-800 rounded-lg bg-slate-900/60">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Recent Analyses</h3>
          <span className="text-xs text-slate-400">{analyses.length} total</span>
        </div>

        <div className="divide-y divide-slate-800">
          {analyses.map((entry) => (
            <div key={entry.id} className="p-3 hover:bg-slate-800/40 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200 truncate">
                  {entry.filename}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {entry.detectedType} • {entry.analyzedAt}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    entry.status === "parsed"
                      ? "bg-green-500/20 text-green-400"
                      : entry.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {entry.status.toUpperCase()}
                </span>
                <button
                  type="button"
                  className="rounded-md bg-slate-800 p-1.5 hover:bg-slate-700"
                  title="View extracted data"
                >
                  <Eye className="h-3 w-3 text-slate-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3 text-center">
          <div className="text-xs text-slate-400">Total Analyzed</div>
          <div className="text-2xl font-bold text-neon-green mt-1">
            {analyses.length}
          </div>
        </div>
        <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3 text-center">
          <div className="text-xs text-slate-400">Parsed</div>
          <div className="text-2xl font-bold text-green-400 mt-1">
            {analyses.filter((a) => a.status === "parsed").length}
          </div>
        </div>
        <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3 text-center">
          <div className="text-xs text-slate-400">Pending</div>
          <div className="text-2xl font-bold text-yellow-400 mt-1">
            {analyses.filter((a) => a.status === "pending").length}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
