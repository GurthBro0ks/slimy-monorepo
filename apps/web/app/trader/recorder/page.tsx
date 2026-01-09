"use client";

import { useEffect, useState, useRef } from "react";
import { useTrader } from "@/lib/trader/context";
import type { LogEntry } from "@/lib/trader/types";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle, AlertTriangle, Info } from "lucide-react";

export default function TraderRecorderPage() {
  const { client, recordFetch } = useTrader();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      const result = await client.getLogsTail(50);
      if (result.data) setLogs(result.data);
      recordFetch(result.latencyMs, result.error);
      setLoading(false);
    }

    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [client, recordFetch, autoRefresh]);

  const getLevelIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "warn":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "warn":
        return "bg-amber-500/20 text-amber-400 border-amber-500/50";
      case "info":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "engine":
        return "text-purple-400";
      case "feed":
        return "text-cyan-400";
      case "risk":
        return "text-amber-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-['VT323'] text-[var(--neon-green)] tracking-widest uppercase">
          Recorder
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded border font-mono text-xs transition-colors ${
              autoRefresh
                ? "border-green-500/50 text-green-400 bg-green-500/10"
                : "border-gray-700 text-gray-400 hover:border-gray-600"
            }`}
          >
            <RefreshCw
              className={`w-3 h-3 ${autoRefresh ? "animate-spin" : ""}`}
            />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </button>
          <span className="text-xs font-mono text-gray-500">
            {logs.length} entries
          </span>
        </div>
      </div>

      {/* Log Container */}
      <div
        ref={containerRef}
        className="bg-black border border-gray-800 rounded-lg overflow-hidden font-mono text-sm"
      >
        <div className="bg-gray-900/50 border-b border-gray-800 px-4 py-2 flex items-center gap-4">
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            System Logs
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-blue-400">
              <Info className="w-3 h-3" /> Info
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <AlertTriangle className="w-3 h-3" /> Warn
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <AlertCircle className="w-3 h-3" /> Error
            </span>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-6 bg-gray-800/50 rounded"
                />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No logs available</div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`px-4 py-2 hover:bg-gray-900/30 flex items-start gap-3 ${
                    log.level === "error" ? "bg-red-900/10" : ""
                  }`}
                >
                  {getLevelIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge
                        className={`${getLevelColor(log.level)} text-[10px] px-1.5 py-0`}
                      >
                        {log.level.toUpperCase()}
                      </Badge>
                      <span
                        className={`text-xs font-bold ${getSourceColor(log.source)}`}
                      >
                        [{log.source}]
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-300 break-words">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs font-mono text-gray-500">
        <div className="flex items-center gap-2">
          <span className="text-purple-400">[engine]</span>
          <span>Strategy engine</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-400">[feed]</span>
          <span>Data feeds</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-400">[risk]</span>
          <span>Risk management</span>
        </div>
      </div>
    </div>
  );
}
