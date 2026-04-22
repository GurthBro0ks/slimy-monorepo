"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ArrowLeft,
  FileUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";

interface ParsedRow {
  name: string;
  member_id: number;
  sim_power: number;
  total_power: number;
  issues: string[];
  rowIndex: number;
}

interface ImportResponse {
  ok: boolean;
  imported: number;
  errors: string[];
  mode?: string;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return Math.round(num / 1_000) + "K";
  return num.toLocaleString("en-US");
}

export default function ClubImportPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner =
    user?.role === "owner" ||
    (process.env.NEXT_PUBLIC_OWNER_USER_ID &&
      user?.id === process.env.NEXT_PUBLIC_OWNER_USER_ID);

  useEffect(() => {
    if (!authLoading && !isOwner) {
      router.replace("/snail/club");
    }
  }, [authLoading, isOwner, router]);

  const resetState = useCallback(() => {
    setFile(null);
    setParsedRows([]);
    setImportResult(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const parseFile = useCallback((selectedFile: File) => {
    setParseError(null);
    setParsedRows([]);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setParseError("No sheets found in workbook");
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        const parsed: ParsedRow[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const name = String(row["Name"] ?? row["name"] ?? "").trim();
          const rawMemberId = row["Member ID"] ?? row["member_id"] ?? row["MemberID"] ?? "";
          const rawSimPower = row["SIM Power"] ?? row["sim_power"] ?? row["SimPower"] ?? 0;
          const rawTotalPower = row["Total Power"] ?? row["total_power"] ?? row["TotalPower"] ?? 0;
          const issues: string[] = [];

          if (!name) issues.push("Missing name");

          const memberId = parseInt(String(rawMemberId), 10);
          if (isNaN(memberId) || memberId <= 0) issues.push("Invalid Member ID");

          const simPower = parseFloat(String(rawSimPower)) || 0;
          const totalPower = parseFloat(String(rawTotalPower)) || 0;

          parsed.push({
            name: name || "(empty)",
            member_id: isNaN(memberId) ? 0 : memberId,
            sim_power: simPower,
            total_power: totalPower,
            issues,
            rowIndex: i + 2,
          });
        }

        setParsedRows(parsed);
      } catch {
        setParseError("Failed to parse .xlsx file. Ensure it's a valid Excel file.");
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }, []);

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      if (!selectedFile.name.endsWith(".xlsx")) {
        setParseError("Only .xlsx files are accepted");
        return;
      }
      setFile(selectedFile);
      parseFile(selectedFile);
    },
    [parseFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFileSelect(dropped);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/snail/club/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result: ImportResponse = await res.json();
      setImportResult(result);
    } catch (err) {
      setImportResult({
        ok: false,
        imported: 0,
        errors: [err instanceof Error ? err.message : "Import failed"],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.issues.length === 0).length;
  const issueCount = parsedRows.filter((r) => r.issues.length > 0).length;

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
            className="text-4xl md:text-5xl font-bold text-[#39ff14] tracking-tighter drop-shadow-[0_0_10px_#39ff14]"
            style={{ fontFamily: '"Press Start 2P", cursive' }}
          >
            IMPORT CLUB DATA
          </h1>
          <p className="text-[#8a4baf] text-xl mt-3">
            Upload .xlsx snapshot from bot export to update club member data
          </p>
        </div>
        <Link
          href="/snail/club"
          className="flex items-center gap-2 px-6 py-3 border-2 border-[#8a4baf] text-[#8a4baf] hover:bg-[#8a4baf] hover:text-black transition-all font-bold tracking-widest shrink-0"
        >
          <ArrowLeft size={20} />
          BACK TO CLUB
        </Link>
      </div>

      {/* Dropzone */}
      {!importResult?.ok && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed p-16 text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-[#39ff14] bg-[#39ff14]/5"
              : "border-[#8a4baf]/50 hover:border-[#39ff14] hover:bg-[#1a0b2e]/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
            className="hidden"
          />
          <FileUp
            size={48}
            className={`mx-auto mb-4 transition-colors ${
              isDragOver ? "text-[#39ff14]" : "text-[#8a4baf]"
            }`}
          />
          <p className="text-xl text-[#d6b4fc] font-bold mb-2">
            {isDragOver ? "DROP FILE HERE" : "DRAG & DROP .XLSX FILE"}
          </p>
          <p className="text-[#8a4baf] text-sm">
            or click to browse — accepts .xlsx files exported from /club analyze
          </p>
          {file && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#1a0b2e] border border-[#39ff14]/50">
              <FileSpreadsheet size={16} className="text-[#39ff14]" />
              <span className="text-[#39ff14] text-sm font-bold">{file.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetState();
                }}
                className="ml-2 p-1 hover:bg-[#39ff14]/10"
              >
                <X size={14} className="text-[#8a4baf]" />
              </button>
            </div>
          )}
        </div>
      )}

      {parseError && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border-2 border-red-500 text-red-500">
          <AlertCircle size={20} />
          <span>{parseError}</span>
          <button onClick={resetState} className="ml-auto p-1 hover:bg-red-500/20">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Preview Table */}
      {parsedRows.length > 0 && !importResult?.ok && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl text-[#39ff14] font-bold" style={{ fontFamily: '"VT323", monospace' }}>
              PREVIEW: {parsedRows.length} ROWS DETECTED
            </h2>
            <div className="flex items-center gap-4 text-sm font-bold">
              <span className="text-[#39ff14]">{validCount} valid</span>
              {issueCount > 0 && <span className="text-red-500">{issueCount} with issues</span>}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-[#8a4baf]/30">
            <table className="w-full text-left">
              <thead className="bg-[#1a0b2e] sticky top-0 z-10">
                <tr className="border-b border-[#8a4baf]/30 text-[#8a4baf]">
                  <th className="p-3 font-bold">#</th>
                  <th className="p-3 font-bold">NAME</th>
                  <th className="p-3 font-bold">MEMBER ID</th>
                  <th className="p-3 font-bold">SIM POWER</th>
                  <th className="p-3 font-bold">TOTAL POWER</th>
                  <th className="p-3 font-bold">STATUS</th>
                </tr>
              </thead>
              <tbody className="text-[#d6b4fc]">
                {parsedRows.map((row) => (
                  <tr
                    key={row.rowIndex}
                    className={`border-b border-[#8a4baf]/10 ${
                      row.issues.length > 0 ? "bg-red-500/5" : "hover:bg-[#1a0b2e]"
                    }`}
                  >
                    <td className="p-3 text-[#8a4baf]">{row.rowIndex}</td>
                    <td className="p-3 font-bold">
                      {row.issues.includes("Missing name") ? (
                        <span className="text-red-500 italic">MISSING</span>
                      ) : (
                        row.name
                      )}
                    </td>
                    <td className="p-3 text-[#8a4baf]">
                      {row.member_id > 0 ? row.member_id : <span className="text-red-500">—</span>}
                    </td>
                    <td className="p-3">{formatNumber(row.sim_power)}</td>
                    <td className="p-3">{formatNumber(row.total_power)}</td>
                    <td className="p-3">
                      {row.issues.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {row.issues.map((issue, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-red-500/20 border border-red-500 text-red-500 text-xs"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <CheckCircle2 className="text-[#39ff14]" size={16} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Import Actions */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={resetState}
              className="px-6 py-3 border-2 border-[#8a4baf] text-[#8a4baf] hover:bg-[#8a4baf] hover:text-black transition-all font-bold tracking-widest"
            >
              CLEAR
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || validCount === 0}
              className="flex items-center gap-2 px-8 py-3 bg-[#39ff14] border-2 border-[#39ff14] text-black hover:bg-transparent hover:text-[#39ff14] transition-all font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> IMPORTING...
                </>
              ) : (
                <>
                  <Upload size={20} /> IMPORT {validCount} MEMBERS
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className="space-y-6">
          {importResult.ok ? (
            <div className="border-2 border-[#39ff14] bg-[#39ff14]/5 p-8 text-center space-y-4">
              <CheckCircle2 size={48} className="mx-auto text-[#39ff14]" />
              <h2 className="text-3xl font-bold text-[#39ff14]" style={{ fontFamily: '"VT323", monospace' }}>
                IMPORT SUCCESSFUL
              </h2>
              <p className="text-[#d6b4fc] text-xl">
                {importResult.imported} members imported
                {importResult.mode === "sandbox" && (
                  <span className="text-[#ff6b00] ml-2">(SANDBOX — no DB configured)</span>
                )}
              </p>
              {importResult.errors.length > 0 && (
                <div className="mt-4 text-left max-w-lg mx-auto">
                  <p className="text-[#ff6b00] text-sm font-bold mb-2">WARNINGS:</p>
                  <ul className="text-[#8a4baf] text-sm space-y-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center justify-center gap-4 pt-4">
                <Link
                  href="/snail/club"
                  className="px-8 py-3 border-2 border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14] hover:text-black transition-all font-bold tracking-widest"
                >
                  VIEW CLUB DASHBOARD
                </Link>
                <button
                  onClick={resetState}
                  className="px-8 py-3 border-2 border-[#8a4baf] text-[#8a4baf] hover:bg-[#8a4baf] hover:text-black transition-all font-bold tracking-widest"
                >
                  IMPORT ANOTHER
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-red-500 bg-red-500/5 p-8 text-center space-y-4">
              <AlertCircle size={48} className="mx-auto text-red-500" />
              <h2 className="text-3xl font-bold text-red-500" style={{ fontFamily: '"VT323", monospace' }}>
                IMPORT FAILED
              </h2>
              <ul className="text-[#d6b4fc] text-sm space-y-1">
                {importResult.errors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
              <button
                onClick={resetState}
                className="mt-4 px-8 py-3 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-all font-bold tracking-widest"
              >
                TRY AGAIN
              </button>
            </div>
          )}
        </div>
      )}

      {/* Expected format guide */}
      {!file && !importResult && (
        <div className="bg-[#0a0412] border-2 border-[#8a4baf]/30 p-6 space-y-4">
          <h3 className="text-lg text-[#39ff14] font-bold" style={{ fontFamily: '"VT323", monospace' }}>
            EXPECTED FILE FORMAT
          </h3>
          <p className="text-[#8a4baf] text-sm">
            The .xlsx file should be exported from the bot&apos;s <code className="text-[#d6b4fc]">/club analyze</code> command.
            Expected columns:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#8a4baf]/30 text-[#8a4baf]">
                  <th className="p-2 text-left">Column</th>
                  <th className="p-2 text-left">Required</th>
                  <th className="p-2 text-left">Example</th>
                </tr>
              </thead>
              <tbody className="text-[#d6b4fc]">
                <tr className="border-b border-[#8a4baf]/10">
                  <td className="p-2 font-bold">Name</td>
                  <td className="p-2">Yes</td>
                  <td className="p-2">PlayerName</td>
                </tr>
                <tr className="border-b border-[#8a4baf]/10">
                  <td className="p-2 font-bold">SIM Power</td>
                  <td className="p-2">Yes</td>
                  <td className="p-2">23900766</td>
                </tr>
                <tr className="border-b border-[#8a4baf]/10">
                  <td className="p-2 font-bold">Total Power</td>
                  <td className="p-2">Yes</td>
                  <td className="p-2">58000000</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold">Member ID</td>
                  <td className="p-2">Yes</td>
                  <td className="p-2">123456</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 p-6 bg-[#0a0412] border-2 border-[#8a4baf]/20 text-center opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-xs tracking-[0.2em] uppercase">
          CLUB_IMPORT // NEURAL_SYNC_STABLE // SNAIL_OS_V2.4.0
        </p>
      </div>
    </div>
  );
}
