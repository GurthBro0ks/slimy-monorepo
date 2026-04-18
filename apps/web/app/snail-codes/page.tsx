"use client";

import React, { useState } from "react";
import { RefreshCw, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";

type ScanResult = { status: string; message: string };
type PushResult = { status: string; message: string };

export default function SnailCodesScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [pushResult, setPushResult] = useState<PushResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  async function handleScan() {
    setIsScanning(true);
    setScanResult(null);
    setScanError(null);
    try {
      const res = await fetch("/api/snail-codes/scan", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ScanResult = await res.json();
      setScanResult(data);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setIsScanning(false);
    }
  }

  async function handlePush() {
    setIsPushing(true);
    setPushResult(null);
    setPushError(null);
    try {
      const res = await fetch("/api/snail-codes/push-discord", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PushResult = await res.json();
      setPushResult(data);
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "Push failed");
    } finally {
      setIsPushing(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-[#d6b4fc] font-mono">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-[#39ff14] mb-2" style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 20 }}>
          Snail Codes Scanner
        </h1>
        <p className="text-[#8a4baf] mb-8 text-sm">
          Trigger a fresh code scan or push codes to Discord.
        </p>

        <div className="flex gap-4 mb-8">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-3 bg-[#1a0b2e] border border-[#39ff14] text-[#39ff14] rounded font-bold hover:bg-[#39ff14]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScanning ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            {isScanning ? "Scanning..." : "Run Scanner"}
          </button>

          <button
            onClick={handlePush}
            disabled={isPushing}
            className="flex items-center gap-2 px-5 py-3 bg-[#1a0b2e] border border-[#9d4edd] text-[#d6b4fc] rounded font-bold hover:bg-[#9d4edd]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPushing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {isPushing ? "Pushing..." : "Push to Discord"}
          </button>
        </div>

        {scanResult && (
          <div className="flex items-center gap-2 p-4 bg-[#39ff14]/10 border border-[#39ff14]/30 rounded mb-4">
            <CheckCircle size={18} className="text-[#39ff14]" />
            <span className="text-[#39ff14] text-sm">{scanResult.message}</span>
          </div>
        )}
        {scanError && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded mb-4">
            <XCircle size={18} className="text-red-400" />
            <span className="text-red-400 text-sm">{scanError}</span>
          </div>
        )}

        {pushResult && (
          <div className="flex items-center gap-2 p-4 bg-[#39ff14]/10 border border-[#39ff14]/30 rounded mb-4">
            <CheckCircle size={18} className="text-[#39ff14]" />
            <span className="text-[#39ff14] text-sm">{pushResult.message}</span>
          </div>
        )}
        {pushError && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded mb-4">
            <XCircle size={18} className="text-red-400" />
            <span className="text-red-400 text-sm">{pushError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
