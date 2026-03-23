"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Copy, Check, RefreshCw, Send, Clock, AlertCircle, Loader2 } from "lucide-react";

interface CodesData {
  new_codes: string[];
  older_codes: string[];
  last_updated: string;
  sources: string[];
  stats: {
    total: number;
    new: number;
    older: number;
  };
}

interface ScanResult {
  success: boolean;
  new_codes: number;
  older_codes: number;
  sources_scraped: number;
  sources: string[];
  timestamp: string;
}

interface PushResult {
  success: boolean;
  sent: number;
  failed: number;
  rate_limited: boolean;
  total_new: number;
  total_older: number;
  messages_sent: number;
  error?: string;
}

export default function SnailCodesDashboard() {
  const [data, setData] = useState<CodesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<PushResult | null>(null);

  const [copiedSection, setCopiedSection] = useState<"new" | "older" | null>(null);

  const fetchCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/owner/snail-codes", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 307 || res.status === 302) {
          window.location.href = "/login";
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch codes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setPushResult(null);
    try {
      const res = await fetch("/api/owner/snail-codes/scan", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      setScanResult(json);
      if (json.success) {
        await fetchCodes();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setIsScanning(false);
    }
  };

  const handlePushDiscord = async () => {
    setIsPushing(true);
    setPushResult(null);
    try {
      const res = await fetch("/api/owner/snail-codes/push-discord", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      setPushResult(json);
    } catch (err) {
      setPushResult({
        success: false,
        sent: 0,
        failed: 1,
        rate_limited: false,
        total_new: data?.stats.new || 0,
        total_older: data?.stats.older || 0,
        messages_sent: 0,
        error: err instanceof Error ? err.message : "Push failed",
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handleCopyAll = async (section: "new" | "older") => {
    if (!data) return;
    const codes = section === "new" ? data.new_codes : data.older_codes;
    const text = codes.join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b-2 border-[#39ff14] pb-6">
        <div>
          <h1
            className="text-6xl font-bold text-[#39ff14] tracking-tighter drop-shadow-[0_0_10px_#39ff14]"
            style={{ fontFamily: '"Press Start 2P", cursive' }}
          >
            SNAIL CODES
          </h1>
          {data?.last_updated && (
            <p className="text-[#8a4baf] text-xl mt-2 flex items-center gap-2">
              <Clock size={20} />
              Last scan: <span className="text-[#d6b4fc]">{formatDate(data.last_updated)}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="px-6 py-3 bg-[#1a0b2e] border-2 border-[#39ff14] text-[#39ff14] font-bold hover:bg-[#39ff14] hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isScanning ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <RefreshCw size={20} />
            )}
            RUN SCANNER
          </button>

          <button
            onClick={handlePushDiscord}
            disabled={isPushing || !data || data.stats.total === 0}
            className="px-6 py-3 bg-[#2d0b4e] border-2 border-[#d400ff] text-[#d400ff] font-bold hover:bg-[#d400ff] hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPushing ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
            PUSH TO DISCORD
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {scanResult && (
        <div
          className={`p-4 border-2 ${
            scanResult.success
              ? "border-[#39ff14] bg-[#39ff14]/10 text-[#39ff14]"
              : "border-red-500 bg-red-500/10 text-red-500"
          }`}
        >
          {scanResult.success ? (
            <p>
              <Check size={16} className="inline mr-2" />
              Scanned! Found <strong>{scanResult.new_codes}</strong> new codes,{" "}
              <strong>{scanResult.older_codes}</strong> older codes from{" "}
              {scanResult.sources_scraped} sources.
            </p>
          ) : (
            <p>
              <AlertCircle size={16} className="inline mr-2" />
              Scan failed
            </p>
          )}
        </div>
      )}

      {pushResult && (
        <div
          className={`p-4 border-2 ${
            pushResult.success
              ? "border-[#39ff14] bg-[#39ff14]/10 text-[#39ff14]"
              : "border-red-500 bg-red-500/10 text-red-500"
          }`}
        >
          {pushResult.error === "No webhook configured" ? (
            <p>
              <AlertCircle size={16} className="inline mr-2" />
              No Discord webhook configured. Please set one in Dashboard Settings.
            </p>
          ) : pushResult.success ? (
            <p>
              <Check size={16} className="inline mr-2" />
              Pushed to Discord! Sent <strong>{pushResult.messages_sent}</strong> messages (
              {pushResult.total_new} new, {pushResult.total_older} older).
            </p>
          ) : (
            <p>
              <AlertCircle size={16} className="inline mr-2" />
              Push partially failed: {pushResult.sent} sent, {pushResult.failed} failed.
              {pushResult.rate_limited && " (rate limited)"}
            </p>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && !data && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={48} className="animate-spin text-[#8a4baf]" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="border-2 border-red-500 bg-red-500/10 p-12 text-center space-y-6">
          <AlertCircle size={64} className="mx-auto text-red-500" />
          <h2 className="text-3xl font-bold text-red-500 uppercase">Signal Uplink Dropped</h2>
          <p className="text-[#d6b4fc] text-xl">{error}</p>
          <button
            onClick={fetchCodes}
            className="px-8 py-4 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold transition-all"
          >
            RE-ESTABLISH_LINK
          </button>
        </div>
      )}

      {/* Codes Display */}
      {data && !isLoading && (
        <div className="space-y-8">
          {/* New Codes Section */}
          <div className="bg-[#0a0412] border-2 border-[#39ff14]/50">
            <div className="flex justify-between items-center p-4 bg-[#1a0b2e] border-b border-[#39ff14]/30">
              <h2 className="text-2xl font-bold text-[#39ff14]">
                NEW CODES ({data.stats.new})
              </h2>
              <button
                onClick={() => handleCopyAll("new")}
                disabled={data.new_codes.length === 0}
                className={`px-4 py-2 border-2 font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${
                  copiedSection === "new"
                    ? "bg-[#39ff14] border-[#39ff14] text-black"
                    : "border-[#8a4baf] text-[#8a4baf] hover:border-[#39ff14] hover:text-[#39ff14]"
                }`}
              >
                {copiedSection === "new" ? (
                  <>
                    <Check size={16} /> COPIED!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> COPY ALL
                  </>
                )}
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {data.new_codes.length === 0 ? (
                <p className="text-[#8a4baf] italic">No new codes available</p>
              ) : (
                <pre className="text-[#39ff14] text-lg whitespace-pre-wrap font-mono">
                  {data.new_codes.join("\n")}
                </pre>
              )}
            </div>
          </div>

          {/* Older Codes Section */}
          <div className="bg-[#0a0412] border-2 border-[#8a4baf]/50">
            <div className="flex justify-between items-center p-4 bg-[#1a0b2e] border-b border-[#8a4baf]/30">
              <h2 className="text-2xl font-bold text-[#8a4baf]">
                OLDER CODES - MIGHT WORK ({data.stats.older})
              </h2>
              <button
                onClick={() => handleCopyAll("older")}
                disabled={data.older_codes.length === 0}
                className={`px-4 py-2 border-2 font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${
                  copiedSection === "older"
                    ? "bg-[#8a4baf] border-[#8a4baf] text-black"
                    : "border-[#8a4baf] text-[#8a4baf] hover:border-[#d400ff] hover:text-[#d400ff]"
                }`}
              >
                {copiedSection === "older" ? (
                  <>
                    <Check size={16} /> COPIED!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> COPY ALL
                  </>
                )}
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {data.older_codes.length === 0 ? (
                <p className="text-[#8a4baf] italic">No older codes available</p>
              ) : (
                <pre className="text-[#8a4baf] text-lg whitespace-pre-wrap font-mono">
                  {data.older_codes.join("\n")}
                </pre>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-6 bg-[#0a0412] border-2 border-[#8a4baf]/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#8a4baf]">
              Sources: {data.sources.join(", ")}
            </p>
            <p className="text-sm text-[#8a4baf]">
              Total: {data.stats.total} codes
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
