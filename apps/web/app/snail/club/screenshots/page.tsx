"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ArrowLeft,
  Camera,
  Trash2,
  Database,
  Eye,
  RefreshCw,
  Pencil,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";

interface ExtractedMember {
  name: string;
  sim_power: number;
  total_power: number;
  _removed?: boolean;
}

interface ScanResponse {
  members: ExtractedMember[];
  totalExtracted: number;
  duplicatesRemoved: number;
  imagesProcessed: number;
  providers?: string[];
  errors?: string[];
}

interface PushDetail {
  name: string;
  sim_power: number;
  total_power: number;
  status: "matched" | "new" | "error";
  error?: string;
}

interface PushResponse {
  ok: boolean;
  imported: number;
  errors: string[];
  mode?: string;
  details?: PushDetail[];
  suggestions?: Array<{
    scannedName: string;
    existingName: string;
    distance: number;
  }>;
  matchedCount?: number;
  newCount?: number;
}

interface ScanSummary {
  totalExtracted: number;
  duplicatesRemoved: number;
  imagesProcessed: number;
}

type Step = "upload" | "scanning" | "preview" | "pushing" | "done";

function formatNumber(num: number): string {
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return sign + (abs / 1_000_000_000).toFixed(1) + "B";
  if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return sign + Math.round(abs / 1_000) + "K";
  return num.toLocaleString("en-US");
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ACCEPTED_EXTENSIONS = ".png,.jpg,.jpeg,.webp";
const MAX_IMAGES = 10;

export default function ScreenshotScanPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const isOwner =
    user?.role === "owner" ||
    (process.env.NEXT_PUBLIC_OWNER_USER_ID &&
      user?.id === process.env.NEXT_PUBLIC_OWNER_USER_ID);

  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [members, setMembers] = useState<ExtractedMember[]>([]);
  const [scanErrors, setScanErrors] = useState<string[]>([]);
  const [pushResult, setPushResult] = useState<PushResponse | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scanProgress, setScanProgress] = useState("");
  const [scanProviders, setScanProviders] = useState<string[]>([]);
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);
  const [pushTimestamp, setPushTimestamp] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isOwner) {
      router.replace("/snail/club");
    }
  }, [authLoading, isOwner, router]);

  const generateThumbnails = useCallback((newFiles: File[]) => {
    const urls: string[] = [];
    for (const f of newFiles) {
      urls.push(URL.createObjectURL(f));
    }
    return urls;
  }, []);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const valid: File[] = [];
      for (const f of Array.from(incoming)) {
        const ext = f.name.toLowerCase();
        if (
          ACCEPTED_TYPES.includes(f.type) ||
          ext.endsWith(".png") ||
          ext.endsWith(".jpg") ||
          ext.endsWith(".jpeg") ||
          ext.endsWith(".webp")
        ) {
          valid.push(f);
        }
      }

      const combined = [...files, ...valid].slice(0, MAX_IMAGES);
      setFiles(combined);
      setThumbnails(generateThumbnails(combined));
    },
    [files, generateThumbnails]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      const newThumbnails = thumbnails.filter((_, i) => i !== index);
      setFiles(newFiles);
      setThumbnails(newThumbnails);
    },
    [files, thumbnails]
  );

  const resetAll = useCallback(() => {
    setFiles([]);
    thumbnails.forEach((t) => URL.revokeObjectURL(t));
    setThumbnails([]);
    setMembers([]);
    setScanErrors([]);
    setScanProviders([]);
    setScanSummary(null);
    setPushResult(null);
    setPushTimestamp("");
    setEditingIndex(null);
    setEditingName("");
    setStep("upload");
    setScanProgress("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [thumbnails]);

  const handleScan = useCallback(async () => {
    if (files.length === 0) return;
    setStep("scanning");
    setScanErrors([]);
    setMembers([]);
    setScanProviders([]);
    setScanProgress(`Processing ${files.length} screenshot(s)...`);

    try {
      const formData = new FormData();
      for (const f of files) {
        formData.append("images", f);
      }

      const res = await fetch("/api/snail/club/screenshots", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data: ScanResponse = await res.json();

      if (!res.ok) {
        setScanErrors([data.errors?.join("; ") || `HTTP ${res.status}`]);
        setStep("upload");
        return;
      }

      setMembers(
        data.members.map((m) => ({ ...m, _removed: false }))
      );
      setScanErrors(data.errors || []);
      setScanProviders(data.providers || []);
      setScanSummary({
        totalExtracted: data.totalExtracted,
        duplicatesRemoved: data.duplicatesRemoved,
        imagesProcessed: data.imagesProcessed,
      });
      setStep("preview");
    } catch (err) {
      setScanErrors([err instanceof Error ? err.message : "Scan failed"]);
      setStep("upload");
    }
  }, [files]);

  const handlePush = useCallback(async () => {
    const activeMembers = members.filter((m) => !m._removed);
    if (activeMembers.length === 0) return;

    setStep("pushing");

    try {
      const providerSummary = scanProviders
        .map((p) => p.split(": ").pop() || p)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(", ");

      const res = await fetch("/api/snail/club/screenshots/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: activeMembers,
          provider: providerSummary || "unknown",
        }),
        credentials: "include",
      });

      const result: PushResponse = await res.json();
      setPushResult(result);
      setPushTimestamp(new Date().toISOString());
      setStep("done");
    } catch (err) {
      setPushResult({
        ok: false,
        imported: 0,
        errors: [err instanceof Error ? err.message : "Push failed"],
      });
      setStep("done");
    }
  }, [members, scanProviders]);

  const toggleRemove = useCallback((index: number) => {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, _removed: !m._removed } : m))
    );
  }, []);

  const startEdit = useCallback((index: number, currentName: string) => {
    setEditingIndex(index);
    setEditingName(currentName);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingName("");
  }, []);

  const saveEdit = useCallback(() => {
    if (editingIndex == null) return;

    const nextName = editingName.trim();
    if (!nextName) return;

    setMembers((prev) =>
      prev.map((m, i) => (i === editingIndex ? { ...m, name: nextName } : m))
    );
    setEditingIndex(null);
    setEditingName("");
  }, [editingIndex, editingName]);

  const activeMembers = members.filter((m) => !m._removed);
  const removedCount = members.filter((m) => m._removed).length;

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
            SCAN SCREENSHOTS
          </h1>
          <p className="text-[#8a4baf] text-xl mt-3">
            Upload Manage Members screenshots for AI-powered OCR extraction
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

      <div className="bg-[#0a0412] border-2 border-[#00ffff]/30 p-4 flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1 text-sm font-bold ${
            step === "upload" ? "text-[#00ffff]" : "text-[#8a4baf]/60"
          }`}
        >
          <span className="w-6 h-6 flex items-center justify-center border border-current text-xs">1</span>
          UPLOAD
        </div>
        <span className="text-[#8a4baf]/30">&rarr;</span>
        <div
          className={`flex items-center gap-2 px-3 py-1 text-sm font-bold ${
            step === "scanning" ? "text-[#00ffff]" : "text-[#8a4baf]/60"
          }`}
        >
          <span className="w-6 h-6 flex items-center justify-center border border-current text-xs">2</span>
          SCAN
        </div>
        <span className="text-[#8a4baf]/30">&rarr;</span>
        <div
          className={`flex items-center gap-2 px-3 py-1 text-sm font-bold ${
            step === "preview" ? "text-[#00ffff]" : "text-[#8a4baf]/60"
          }`}
        >
          <span className="w-6 h-6 flex items-center justify-center border border-current text-xs">3</span>
          REVIEW
        </div>
        <span className="text-[#8a4baf]/30">&rarr;</span>
        <div
          className={`flex items-center gap-2 px-3 py-1 text-sm font-bold ${
            step === "pushing" || step === "done" ? "text-[#00ffff]" : "text-[#8a4baf]/60"
          }`}
        >
          <span className="w-6 h-6 flex items-center justify-center border border-current text-xs">4</span>
          PUSH
        </div>
      </div>

      {scanErrors.length > 0 && (
        <div className="flex flex-col gap-2 p-4 bg-[#ff6b00]/10 border-2 border-[#ff6b00]/50 text-[#ff6b00]">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="font-bold">WARNINGS</span>
          </div>
          {scanErrors.map((err, i) => (
            <p key={i} className="text-sm ml-6">{err}</p>
          ))}
        </div>
      )}

      {step === "upload" && (
        <>
          <div
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed p-16 text-center cursor-pointer transition-all ${
              isDragOver
                ? "border-[#00ffff] bg-[#00ffff]/5"
                : "border-[#8a4baf]/50 hover:border-[#00ffff] hover:bg-[#1a0b2e]/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
              }}
              className="hidden"
            />
            <Camera
              size={48}
              className={`mx-auto mb-4 transition-colors ${
                isDragOver ? "text-[#00ffff]" : "text-[#8a4baf]"
              }`}
            />
            <p className="text-xl text-[#d6b4fc] font-bold mb-2">
              {isDragOver ? "DROP IMAGES HERE" : "DRAG & DROP SCREENSHOTS"}
            </p>
            <p className="text-[#8a4baf] text-sm">
              or click to browse &mdash; accepts PNG, JPG, WEBP &mdash; max {MAX_IMAGES} images
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl text-[#00ffff] font-bold" style={{ fontFamily: '"VT323", monospace' }}>
                  SELECTED: {files.length} IMAGE{files.length !== 1 ? "S" : ""}
                </h2>
                <button
                  onClick={() => {
                    thumbnails.forEach((t) => URL.revokeObjectURL(t));
                    setFiles([]);
                    setThumbnails([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="px-4 py-2 border-2 border-[#8a4baf] text-[#8a4baf] hover:bg-[#8a4baf] hover:text-black transition-all font-bold text-sm tracking-widest"
                >
                  CLEAR ALL
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="relative group border-2 border-[#8a4baf]/30 bg-[#1a0b2e] overflow-hidden"
                  >
                    <Image
                      src={thumbnails[i]}
                      alt={file.name}
                      width={240}
                      height={128}
                      unoptimized
                      className="h-32 w-full object-cover"
                    />
                    <div className="p-2">
                      <p className="text-[#d6b4fc] text-xs truncate">{file.name}</p>
                      <p className="text-[#8a4baf] text-xs">
                        {(file.size / 1024).toFixed(0)}KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute top-1 right-1 p-1 bg-black/70 border border-red-500 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-black"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-[#8a4baf] text-[#8a4baf] hover:bg-[#8a4baf] hover:text-black transition-all font-bold tracking-widest"
                >
                  <Upload size={20} />
                  ADD MORE
                </button>
                <button
                  onClick={handleScan}
                  disabled={files.length === 0}
                  className="flex items-center gap-2 px-8 py-3 bg-[#00ffff] border-2 border-[#00ffff] text-black hover:bg-transparent hover:text-[#00ffff] transition-all font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye size={20} />
                  ANALYZE SCREENSHOTS
                </button>
              </div>
            </div>
          )}

          {!files.length && (
            <div className="bg-[#0a0412] border-2 border-[#8a4baf]/30 p-6 space-y-4">
              <h3 className="text-lg text-[#00ffff] font-bold" style={{ fontFamily: '"VT323", monospace' }}>
                HOW IT WORKS
              </h3>
              <ol className="text-[#8a4baf] text-sm space-y-2 list-decimal list-inside">
                <li>Upload 1-10 Manage Members screenshots from Super Snail</li>
                <li>Use one metric type per batch: all Power screenshots or all Sim Power screenshots</li>
                <li>Run the other sort view as a second batch when you want both values updated</li>
                <li>AI reads each screenshot and maps Power vs Sim Power into the correct fields</li>
                <li>Review the extracted data, fix any misread names, and remove any bad rows</li>
                <li>Push confirmed data to the club database</li>
              </ol>
              <p className="text-[#8a4baf]/70 text-xs mt-2">
                Uses Gemini 2.5 Flash for OCR extraction, falls back to GPT-4o if unavailable. Best results with clear, uncropped screenshots where the &quot;Power&quot; or &quot;Sim Power&quot; label is visible.
              </p>
            </div>
          )}
        </>
      )}

      {step === "scanning" && (
        <div className="border-2 border-[#00ffff]/30 bg-[#0a0412] p-12 text-center space-y-6">
          <Loader2 className="w-16 h-16 mx-auto text-[#00ffff] animate-spin" />
          <h2 className="text-3xl font-bold text-[#00ffff]" style={{ fontFamily: '"VT323", monospace' }}>
            ANALYZING SCREENSHOTS
          </h2>
          <p className="text-[#d6b4fc] text-lg">{scanProgress}</p>
          <p className="text-[#8a4baf] text-sm">
            Each image takes ~5-10 seconds to process with AI vision
          </p>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-6">
          <div className="bg-[#0a0412] border-2 border-[#00ffff]/30 p-6 space-y-4">
            <h3 className="text-lg text-[#00ffff] font-bold" style={{ fontFamily: '"VT323", monospace' }}>
              SCAN SUMMARY
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[#8a4baf] text-xs tracking-widest uppercase">Screenshots</span>
                <p className="text-2xl text-[#39ff14] font-bold">{scanSummary?.imagesProcessed ?? files.length}</p>
              </div>
              <div>
                <span className="text-[#8a4baf] text-xs tracking-widest uppercase">Unique Members</span>
                <p className="text-2xl text-[#39ff14] font-bold">{activeMembers.length}</p>
              </div>
              <div>
                <span className="text-[#8a4baf] text-xs tracking-widest uppercase">Duplicates Removed</span>
                <p className="text-2xl text-[#ff6b00] font-bold">{scanSummary?.duplicatesRemoved ?? 0}</p>
              </div>
            </div>
            {scanProviders.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#00ffff] font-bold uppercase tracking-widest">Provider:</span>
                <span className="text-[#d6b4fc]">
                  {scanProviders.map((p) => p.split(": ").pop() || p).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {activeMembers.slice(0, 30).map((m, i) => (
                <span key={i} className="px-2 py-1 bg-[#1a0b2e] border border-[#8a4baf]/30 text-[#d6b4fc] text-xs">
                  {m.name}
                </span>
              ))}
              {activeMembers.length > 30 && (
                <span className="px-2 py-1 text-[#8a4baf] text-xs">
                  +{activeMembers.length - 30} more...
                </span>
              )}
            </div>
            {scanErrors.length > 0 && (
              <div className="pt-2">
                <span className="text-[#ff6b00] text-xs font-bold">Warnings:</span>
                <ul className="text-[#8a4baf] text-xs space-y-1 mt-1">
                  {scanErrors.map((err, i) => (
                    <li key={i}>&bull; {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {scanProviders.length > 0 && (
            <div className="bg-[#0a0412] border-2 border-[#00ffff]/20 p-3 flex items-center gap-3 text-xs">
              <span className="text-[#00ffff] font-bold uppercase tracking-widest">OCR Provider:</span>
              <span className="text-[#d6b4fc]">{scanProviders.join(" | ")}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl text-[#39ff14] font-bold" style={{ fontFamily: '"VT323", monospace' }}>
                EXTRACTED: {activeMembers.length} MEMBERS
              </h2>
              {removedCount > 0 && (
                <p className="text-[#ff6b00] text-sm mt-1">
                  {removedCount} row(s) marked for removal
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={resetAll}
                className="px-4 py-2 border-2 border-[#8a4baf] text-[#8a4baf] hover:bg-[#8a4baf] hover:text-black transition-all font-bold text-sm tracking-widest"
              >
                START OVER
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-[#8a4baf]/30">
            <table className="w-full text-left">
              <thead className="bg-[#1a0b2e] sticky top-0 z-10">
                <tr className="border-b border-[#8a4baf]/30 text-[#8a4baf]">
                  <th className="p-3 font-bold w-12">#</th>
                  <th className="p-3 font-bold">NAME</th>
                  <th className="p-3 font-bold">SIM POWER</th>
                  <th className="p-3 font-bold">TOTAL POWER</th>
                  <th className="p-3 font-bold w-20">ACTION</th>
                </tr>
              </thead>
              <tbody className="text-[#d6b4fc]">
                {members.map((member, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-[#8a4baf]/10 transition-colors ${
                      member._removed
                        ? "bg-red-500/5 opacity-50 line-through"
                        : "hover:bg-[#1a0b2e]"
                    }`}
                  >
                    <td className="p-3 text-[#8a4baf]">{idx + 1}</td>
                    <td className={`p-3 font-bold ${member._removed ? "text-red-500" : ""}`}>
                      {editingIndex === idx ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-full max-w-xs bg-black border border-[#00ffff] px-2 py-1 text-[#d6b4fc] outline-none focus:ring-2 focus:ring-[#00ffff]/40"
                          autoFocus
                        />
                      ) : (
                        member.name || <span className="text-red-500 italic">MISSING</span>
                      )}
                    </td>
                    <td className="p-3">{formatNumber(member.sim_power)}</td>
                    <td className="p-3">{formatNumber(member.total_power)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {editingIndex === idx ? (
                          <>
                            <button
                              onClick={saveEdit}
                              className="p-1.5 border border-[#39ff14] text-[#39ff14] transition-colors hover:bg-[#39ff14] hover:text-black"
                              title="Save name"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 border border-[#8a4baf] text-[#8a4baf] transition-colors hover:bg-[#8a4baf] hover:text-black"
                              title="Cancel edit"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(idx, member.name)}
                              disabled={member._removed}
                              className="p-1.5 border border-[#00ffff]/50 text-[#00ffff]/70 transition-colors hover:bg-[#00ffff] hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
                              title="Edit name"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => toggleRemove(idx)}
                              className={`p-1.5 border transition-colors ${
                                member._removed
                                  ? "border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14] hover:text-black"
                                  : "border-red-500/50 text-red-500/50 hover:bg-red-500 hover:text-black"
                              }`}
                              title={member._removed ? "Restore row" : "Remove row"}
                            >
                              {member._removed ? (
                                <RefreshCw size={14} />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-4">
            <button
              onClick={resetAll}
              className="px-6 py-3 border-2 border-[#8a4baf] text-[#8a4baf] hover:bg-[#8a4baf] hover:text-black transition-all font-bold tracking-widest"
            >
              CANCEL
            </button>
            <button
              onClick={handlePush}
              disabled={activeMembers.length === 0}
              className="flex items-center gap-2 px-8 py-3 bg-[#39ff14] border-2 border-[#39ff14] text-black hover:bg-transparent hover:text-[#39ff14] transition-all font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Database size={20} />
              PUSH {activeMembers.length} MEMBERS TO DATABASE
            </button>
          </div>
        </div>
      )}

      {step === "pushing" && (
        <div className="border-2 border-[#39ff14]/30 bg-[#0a0412] p-12 text-center space-y-6">
          <Loader2 className="w-16 h-16 mx-auto text-[#39ff14] animate-spin" />
          <h2 className="text-3xl font-bold text-[#39ff14]" style={{ fontFamily: '"VT323", monospace' }}>
            PUSHING TO DATABASE
          </h2>
          <p className="text-[#d6b4fc] text-lg">Writing {activeMembers.length} members to club_latest...</p>
        </div>
      )}

      {step === "done" && pushResult && (
        <div className="space-y-6">
          {pushResult.ok ? (
            <div className="border-2 border-[#39ff14] bg-[#39ff14]/5 p-8 text-center space-y-6">
              <CheckCircle2 size={48} className="mx-auto text-[#39ff14]" />
              <h2 className="text-3xl font-bold text-[#39ff14]" style={{ fontFamily: '"VT323", monospace' }}>
                IMPORT SUCCESSFUL
              </h2>
              <p className="text-[#d6b4fc] text-xl">
                {pushResult.imported} members imported
                {pushResult.mode === "sandbox" && (
                  <span className="text-[#ff6b00] ml-2">(SANDBOX &mdash; no DB configured)</span>
                )}
              </p>

              {pushResult.details && pushResult.details.length > 0 && (
                <div className="max-w-3xl mx-auto text-left space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-[#0a0412] border border-[#39ff14]/30 p-4">
                      <span className="text-[#8a4baf] text-xs tracking-widest uppercase block mb-1">Matched Existing</span>
                      <p className="text-2xl text-[#39ff14] font-bold">{pushResult.matchedCount ?? 0}</p>
                    </div>
                    <div className="bg-[#0a0412] border border-[#00ffff]/30 p-4">
                      <span className="text-[#8a4baf] text-xs tracking-widest uppercase block mb-1">New Members</span>
                      <p className="text-2xl text-[#00ffff] font-bold">{pushResult.newCount ?? 0}</p>
                    </div>
                    <div className="bg-[#0a0412] border border-[#8a4baf]/30 p-4">
                      <span className="text-[#8a4baf] text-xs tracking-widest uppercase block mb-1">Errors</span>
                      <p className="text-2xl text-[#ff6b00] font-bold">{pushResult.errors.length}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-[#8a4baf]/30">
                    <table className="w-full text-left">
                      <thead className="bg-[#1a0b2e] sticky top-0 z-10">
                        <tr className="border-b border-[#8a4baf]/30 text-[#8a4baf]">
                          <th className="p-3 font-bold">#</th>
                          <th className="p-3 font-bold">NAME</th>
                          <th className="p-3 font-bold">SIM POWER</th>
                          <th className="p-3 font-bold">TOTAL POWER</th>
                          <th className="p-3 font-bold">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#d6b4fc]">
                        {pushResult.details.map((d, i) => (
                          <tr
                            key={i}
                            className={`border-b border-[#8a4baf]/10 ${
                              d.status === "error" ? "bg-red-500/5" : "hover:bg-[#1a0b2e]"
                            }`}
                          >
                            <td className="p-3 text-[#8a4baf]">{i + 1}</td>
                            <td className="p-3 font-bold">{d.name}</td>
                            <td className="p-3">{formatNumber(d.sim_power)}</td>
                            <td className="p-3">{formatNumber(d.total_power)}</td>
                            <td className="p-3">
                              {d.status === "matched" && (
                                <span className="px-2 py-0.5 bg-green-500/10 border border-green-500 text-green-500 text-xs font-bold">
                                  MATCHED
                                </span>
                              )}
                              {d.status === "new" && (
                                <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500 text-cyan-500 text-xs font-bold">
                                  NEW
                                </span>
                              )}
                              {d.status === "error" && (
                                <span className="px-2 py-0.5 bg-red-500/10 border border-red-500 text-red-500 text-xs font-bold" title={d.error}>
                                  ERROR
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 text-xs text-[#8a4baf]">
                    {scanProviders.length > 0 && (
                      <div>
                        <span className="text-[#00ffff] font-bold uppercase">Provider:</span>{" "}
                        {scanProviders.map((p) => p.split(": ").pop() || p).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                      </div>
                    )}
                    {pushTimestamp && (
                      <div>
                        <span className="text-[#00ffff] font-bold uppercase">Timestamp:</span>{" "}
                        {new Date(pushTimestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(!pushResult.details || pushResult.details.length === 0) && pushResult.errors.length > 0 && (
                <div className="mt-4 text-left max-w-lg mx-auto">
                  <p className="text-[#ff6b00] text-sm font-bold mb-2">WARNINGS:</p>
                  <ul className="text-[#8a4baf] text-sm space-y-1">
                    {pushResult.errors.map((err, i) => (
                      <li key={i}>&bull; {err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center justify-center gap-4 pt-4">
                <Link
                  href="/snail/club"
                  className="flex items-center gap-2 px-8 py-3 border-2 border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14] hover:text-black transition-all font-bold tracking-widest"
                >
                  <Eye size={20} />
                  VIEW CLUB DASHBOARD
                </Link>
                <button
                  onClick={resetAll}
                  className="flex items-center gap-2 px-8 py-3 border-2 border-[#8a4baf] text-[#8a4baf] hover:bg-[#8a4baf] hover:text-black transition-all font-bold tracking-widest"
                >
                  <Camera size={20} />
                  SCAN MORE SCREENSHOTS
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-red-500 bg-red-500/5 p-8 text-center space-y-4">
              <AlertCircle size={48} className="mx-auto text-red-500" />
              <h2 className="text-3xl font-bold text-red-500" style={{ fontFamily: '"VT323", monospace' }}>
                PUSH FAILED
              </h2>
              <ul className="text-[#d6b4fc] text-sm space-y-1">
                {pushResult.errors.map((err, i) => (
                  <li key={i}>&bull; {err}</li>
                ))}
              </ul>
              {pushResult.suggestions && pushResult.suggestions.length > 0 && (
                <div className="mx-auto max-w-2xl border border-[#ff6b00]/50 bg-[#ff6b00]/10 p-4 text-left">
                  <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#ff6b00]">
                    Review Suggested Name Fixes
                  </p>
                  <div className="space-y-2 text-sm text-[#d6b4fc]">
                    {pushResult.suggestions.map((suggestion, i) => (
                      <div
                        key={`${suggestion.scannedName}-${suggestion.existingName}-${i}`}
                        className="grid gap-2 border-b border-[#ff6b00]/20 pb-2 last:border-b-0 last:pb-0 sm:grid-cols-[1fr_auto_1fr]"
                      >
                        <span>{suggestion.scannedName}</span>
                        <span className="text-[#ff6b00]">&rarr;</span>
                        <span className="font-bold text-[#39ff14]">
                          {suggestion.existingName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => { setStep("preview"); setPushResult(null); }}
                  className="px-8 py-3 border-2 border-[#8a4baf] text-[#8a4baf] hover:bg-[#8a4baf] hover:text-black transition-all font-bold tracking-widest"
                >
                  BACK TO PREVIEW
                </button>
                <button
                  onClick={resetAll}
                  className="px-8 py-3 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-all font-bold tracking-widest"
                >
                  START OVER
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-12 p-6 bg-[#0a0412] border-2 border-[#8a4baf]/20 text-center opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-xs tracking-[0.2em] uppercase">
          SCREENSHOT_SCAN // GEMINI_FLASH + GPT-4O // SNAIL_OS_V2.5.0
        </p>
      </div>
    </div>
  );
}
