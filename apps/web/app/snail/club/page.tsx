"use client";

import React, { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

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

export default function ClubSheetPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedMember[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats data (mock for now - would come from GET /api/snail/club)
  const [stats, setStats] = useState({
    memberCount: 26,
    lastUpdated: new Date().toISOString(),
    totalSimPower: 0,
    totalTotalPower: 0,
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setParsedData([]);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        setSheetNames(workbook.SheetNames);
        if (workbook.SheetNames.length > 0) {
          setSelectedSheet(workbook.SheetNames[0]);
        }
      } catch (err) {
        setError("Failed to parse file. Please ensure it's a valid Excel or CSV file.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const parseSheet = useCallback(() => {
    if (!selectedFile || !selectedSheet) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = selectedSheet;
        const worksheet = workbook.Sheets[sheetName];

        // Parse with header: 1 to get array of arrays
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Skip header row, extract cols A-D (index 0-3)
        const members: ParsedMember[] = [];
        const seenNames = new Map<string, number>();

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const name = row[0] ? String(row[0]).trim() : "";
          const simPowerRaw = row[1];
          const totalPowerRaw = row[2];

          const issues: string[] = [];

          // Check for missing name
          if (!name) {
            issues.push("Missing name");
          }

          // Parse power values
          let simPower: number | null = null;
          let totalPower: number | null = null;

          if (simPowerRaw !== undefined && simPowerRaw !== null && simPowerRaw !== "") {
            const parsed = parseFloat(String(simPowerRaw));
            if (isNaN(parsed)) {
              issues.push("SIM Power not numeric");
            } else {
              simPower = parsed;
            }
          }

          if (totalPowerRaw !== undefined && totalPowerRaw !== null && totalPowerRaw !== "") {
            const parsed = parseFloat(String(totalPowerRaw));
            if (isNaN(parsed)) {
              issues.push("Total Power not numeric");
            } else {
              totalPower = parsed;
            }
          }

          // Check for duplicate names
          if (name) {
            const lowerName = name.toLowerCase();
            if (seenNames.has(lowerName)) {
              issues.push(`Duplicate name (also at row ${seenNames.get(lowerName)})`);
            } else {
              seenNames.set(lowerName, i + 1);
            }
          }

          members.push({
            name,
            simPower,
            totalPower,
            issues,
            rowIndex: i + 1,
          });
        }

        setParsedData(members);
      } catch (err) {
        setError("Failed to parse sheet. Please check the file format.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }, [selectedFile, selectedSheet]);

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const validMembers = parsedData
        .filter((m) => m.name && m.issues.length === 0)
        .map((m) => ({
          name: m.name,
          sim_power: m.simPower,
          total_power: m.totalPower,
        }));

      const response = await fetch("/api/snail/club/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: validMembers,
          sheetName: selectedFile?.name,
        }),
      });

      const result: ImportResult = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Import failed");
      }

      setImportResult(result);
      setStats((prev) => ({
        ...prev,
        memberCount: prev.memberCount + result.new,
        lastUpdated: new Date().toISOString(),
      }));

      // Auto-refresh after successful import
      if (result.ok) {
        setTimeout(() => {
          closeModal();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
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
    setError(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validCount = parsedData.filter((m) => m.issues.length === 0).length;
  const issueCount = parsedData.filter((m) => m.issues.length > 0).length;

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="border-b-2 border-[#39ff14] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-[#1a0b2e] border-2 border-[#39ff14] flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.3)]">
            <Users className="w-12 h-12 text-[#39ff14]" />
          </div>
          <div>
            <h1
              className="text-5xl font-bold text-[#39ff14] tracking-tighter drop-shadow-[0_0_10px_#39ff14]"
              style={{ fontFamily: '"VT323", monospace' }}
            >
              CLUB SHEET IMPORTER
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="bg-[#39ff14]/10 border border-[#39ff14] px-2 py-0.5 text-[#39ff14] text-xs">
                UPLOAD_STATUS: READY
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#2d0b4e] border-2 border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14] hover:text-black transition-all font-bold tracking-widest"
        >
          <Upload size={20} />
          UPLOAD SHEET
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0a0412] border-2 border-[#8a4baf] p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#8a4baf] mb-4">
            <Users size={20} />
            <span className="font-bold">MEMBER_COUNT</span>
          </div>
          <p className="text-5xl text-[#39ff14] font-bold">{stats.memberCount}</p>
          <p className="text-xs text-[#8a4baf] opacity-60 italic">TOTAL_NEURAL_LINKAGES</p>
        </div>

        <div className="bg-[#0a0412] border-2 border-[#39ff14] p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#39ff14] mb-4">
            <RefreshCw size={20} />
            <span className="font-bold">LAST_SYNCHRONIZATION</span>
          </div>
          <p className="text-3xl text-[#d6b4fc] font-bold">
            {new Date(stats.lastUpdated).toLocaleTimeString()}
          </p>
          <p className="text-xs text-[#d6b4fc] opacity-60 italic">
            {new Date(stats.lastUpdated).toLocaleDateString()}
          </p>
        </div>

        <div className="bg-[#0a0412] border-2 border-[#d400ff] p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#d400ff] mb-4">
            <TrendingUp size={20} />
            <span className="font-bold">TOTAL_SIM_POWER</span>
          </div>
          <p className="text-3xl text-[#ff7ae9] font-bold">
            {stats.totalSimPower.toLocaleString() || "—"}
          </p>
          <p className="text-xs text-[#ff7ae9] opacity-60 italic">AGGREGATED</p>
        </div>

        <div className="bg-[#0a0412] border-2 border-[#00ffff] p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#00ffff] mb-4">
            <TrendingDown size={20} />
            <span className="font-bold">TOTAL_POWER</span>
          </div>
          <p className="text-3xl text-[#00ffff] font-bold">
            {stats.totalTotalPower.toLocaleString() || "—"}
          </p>
          <p className="text-xs text-[#00ffff] opacity-60 italic">AGGREGATED</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-[#1a0b2e] border-2 border-[#8a4baf]/30 p-8">
        <h3 className="text-2xl text-[#39ff14] mb-4 font-bold">SHEET_UPLOAD_GUIDE</h3>
        <div className="text-[#d6b4fc] space-y-2">
          <p>1. Prepare a spreadsheet with columns: Name, SIM Power, Total Power</p>
          <p>2. First row should be headers (will be skipped)</p>
          <p>3. Supported formats: .xlsx, .csv, .tsv</p>
          <p>4. Click &quot;Upload Sheet&quot; to begin import</p>
          <p>5. Review parsed data and fix any issues before importing</p>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0412] border-2 border-[#39ff14] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#39ff14]/30">
              <div className="flex items-center gap-4">
                <FileSpreadsheet className="w-8 h-8 text-[#39ff14]" />
                <h2
                  className="text-3xl font-bold text-[#39ff14]"
                  style={{ fontFamily: '"VT323", monospace' }}
                >
                  CLUB SHEET IMPORTER
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-[#39ff14]/10 transition-colors"
              >
                <X className="w-6 h-6 text-[#39ff14]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* File Input */}
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

              {/* Sheet Selector */}
              {sheetNames.length > 1 && (
                <div className="space-y-4">
                  <label className="block text-[#d6b4fc] font-bold">SELECT_SHEET</label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value)}
                    className="w-full p-3 bg-[#1a0b2e] border-2 border-[#39ff14]/50 text-[#d6b4fc] font-mono focus:border-[#39ff14] focus:outline-none"
                  >
                    {sheetNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Parse Button */}
              {selectedFile && selectedSheet && (
                <button
                  onClick={parseSheet}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-[#2d0b4e] border-2 border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14] hover:text-black transition-all font-bold tracking-widest disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      PARSING...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet size={20} />
                      PARSE_SHEET
                    </>
                  )}
                </button>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500 text-red-500">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {/* Import Result */}
              {importResult && importResult.ok && (
                <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500 text-green-500">
                  <CheckCircle2 size={20} />
                  <span>
                    Import successful! {importResult.imported} members processed ({importResult.new} new,{" "}
                    {importResult.updated} updated)
                    {importResult.mode === "sandbox" && " [SANDBOX MODE]"}
                  </span>
                </div>
              )}

              {/* Preview Table */}
              {parsedData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl text-[#39ff14] font-bold">
                      PREVIEW: {parsedData.length} MEMBERS DETECTED
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-[#39ff14]">
                        {validCount} valid
                      </span>
                      {issueCount > 0 && (
                        <span className="text-red-500">{issueCount} issues</span>
                      )}
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
                            className={`border-b border-[#8a4baf]/10 ${
                              member.issues.length > 0 ? "bg-red-500/5" : "hover:bg-[#1a0b2e]"
                            }`}
                          >
                            <td className="p-3 text-[#8a4baf]">{member.rowIndex}</td>
                            <td className="p-3 font-bold">
                              {member.name || (
                                <span className="text-red-500 italic">MISSING</span>
                              )}
                            </td>
                            <td className="p-3">
                              {member.simPower !== null ? member.simPower.toLocaleString() : "—"}
                            </td>
                            <td className="p-3">
                              {member.totalPower !== null
                                ? member.totalPower.toLocaleString()
                                : "—"}
                            </td>
                            <td className="p-3">
                              {member.issues.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {member.issues.map((issue, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 bg-red-500/20 border border-red-500 text-red-500 text-xs"
                                    >
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

            {/* Modal Footer */}
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
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      IMPORTING...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      APPROVE & IMPORT
                    </>
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
