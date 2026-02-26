"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  Clock,
  Zap,
  Flame,
  Snowflake,
  Search,
  Filter
} from "lucide-react";

interface Code {
  code: string;
  source: string;
  ts: string;
  tags: string[];
  expires: string | null;
  region: string;
  description?: string;
}

interface CodesApiResponse {
  codes: Code[];
  sources: Record<string, any>;
  timestamp: string;
}

export default function LiveCodesPage() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/codes?scope=active&metadata=true");
      if (!res.ok) throw new Error(`HTTP_ERROR: ${res.status}`);
      const data: CodesApiResponse = await res.json();
      setCodes(data.codes || []);
      setCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to uplink with code aggregator");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and timer setup
  useEffect(() => {
    fetchCodes();
    
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchCodes();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchCodes]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const getFreshness = (ts: string) => {
    const age = (Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60); // age in hours
    if (age < 2) return { color: "#39ff14", label: "HOT", icon: <Flame size={14} /> };
    if (age < 24) return { color: "#8a4baf", label: "WARM", icon: <Zap size={14} /> };
    return { color: "#666", label: "COLD", icon: <Snowflake size={14} /> };
  };

  const filteredCodes = codes.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 font-mono">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b-2 border-[#39ff14] pb-6">
        <div>
          <h1 className="text-6xl font-bold text-[#39ff14] tracking-tighter drop-shadow-[0_0_10px_#39ff14]" style={{ fontFamily: '"Press Start 2P", cursive' }}>
            LIVE_CODES
          </h1>
          <p className="text-[#8a4baf] text-xl mt-2 flex items-center gap-2">
            <Clock size={20} /> AUTO_REFRESH_IN: <span className="text-[#39ff14] font-bold">{countdown}s</span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a4baf]" size={20} />
            <input 
              type="text"
              placeholder="SEARCH_LOGS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0412] border-2 border-[#8a4baf] p-3 pl-12 text-[#ff7ae9] focus:border-[#39ff14] outline-none transition-all text-lg"
            />
          </div>
          <button 
            onClick={fetchCodes}
            disabled={isLoading}
            className="px-6 py-3 bg-[#2d0b4e] border-2 border-[#39ff14] text-[#39ff14] font-bold hover:bg-[#39ff14] hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            FORCED_REFRESH
          </button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading && codes.length === 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-32 bg-[#1a0b2e] border-2 border-[#8a4baf]/20 animate-pulse" />
          ))}
        </div>
      ) : error ? (
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
      ) : filteredCodes.length === 0 ? (
        <div className="p-20 text-center border-2 border-dashed border-[#8a4baf]/30 bg-[#0a0412]">
          <p className="text-[#8a4baf] text-2xl font-bold italic">NO_VALID_SIGNALS_DETECTED_IN_CURRENT_BUFFER</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCodes.map((codeObj, idx) => {
            const freshness = getFreshness(codeObj.ts);
            const isCopied = copiedCode === codeObj.code;

            return (
              <div 
                key={`${codeObj.code}-${idx}`}
                className="group relative bg-[#0a0412] border-2 border-[#8a4baf] hover:border-[#39ff14] transition-all hover:shadow-[0_0_20px_rgba(57,255,20,0.15)] flex flex-col"
              >
                {/* Source & Freshness Bar */}
                <div className="flex justify-between items-center p-2 bg-[#1a0b2e] border-b border-[#8a4baf]/30">
                  <span className="bg-[#8a4baf]/20 px-2 py-0.5 text-xs font-bold text-[#d6b4fc] border border-[#8a4baf]/50">
                    SRC: {codeObj.source.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-2 px-2 py-0.5 border border-[#39ff14]/30 bg-[#39ff14]/5" style={{ borderColor: freshness.color + "55", color: freshness.color }}>
                    {freshness.icon}
                    <span className="text-xs font-bold">{freshness.label}</span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div className="text-4xl font-bold text-[#39ff14] tracking-[0.1em] break-all drop-shadow-[0_0_5px_rgba(57,255,20,0.5)] leading-tight">
                        {codeObj.code}
                      </div>
                      <button 
                        onClick={() => handleCopy(codeObj.code)}
                        className={`p-3 border-2 transition-all shrink-0 ${
                          isCopied 
                            ? "bg-[#39ff14] border-[#39ff14] text-black" 
                            : "border-[#8a4baf] text-[#8a4baf] hover:border-[#39ff14] hover:text-[#39ff14]"
                        }`}
                      >
                        {isCopied ? <Check size={24} /> : <Copy size={24} />}
                      </button>
                    </div>
                    
                    {codeObj.description && (
                      <p className="mt-4 text-[#d6b4fc] opacity-80 italic text-sm line-clamp-2">
                        // {codeObj.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {codeObj.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-[#d400ff]/10 text-[#ff7ae9] border border-[#d400ff]/30 px-1.5 py-0.5">
                          #{tag.toUpperCase()}
                        </span>
                      ))}
                      <span className="text-[10px] bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/30 px-1.5 py-0.5">
                        REG: {codeObj.region || "GLOBAL"}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#8a4baf]/20 flex justify-between text-[10px] text-[#8a4baf]">
                      <span>DETECTED: {new Date(codeObj.ts).toLocaleString()}</span>
                      {codeObj.expires && (
                        <span className="text-red-400 font-bold uppercase">EXP: {new Date(codeObj.expires).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute -top-[2px] -left-[2px] w-3 h-3 border-t-2 border-l-2 border-[#39ff14] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -bottom-[2px] -right-[2px] w-3 h-3 border-b-2 border-r-2 border-[#39ff14] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-12 p-6 bg-[#0a0412] border-2 border-[#8a4baf]/20 flex flex-col md:flex-row items-center justify-between gap-4 opacity-60 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4 text-sm">
          <Filter size={16} />
          <span>FILTERING_BY: STATUS=ACTIVE</span>
          <span className="w-1 h-1 rounded-full bg-[#8a4baf]" />
          <span>SCOPE: AGGREGATED_BUFFER</span>
        </div>
        <p className="text-xs tracking-[0.2em] uppercase">
          SLIMY_AI // CODES_CORE_V2.4.0 // NEURAL_UPLINK_STABLE
        </p>
      </div>
    </div>
  );
}
