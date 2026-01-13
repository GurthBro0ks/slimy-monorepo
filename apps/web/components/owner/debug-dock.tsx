"use client";

import { useState } from "react";

export interface DebugDockProps {
  isOwner?: boolean;
  userEmail?: string | null;
  ownerEmail?: string;
  buildInfo?: {
    version?: string;
    commit?: string;
    buildTime?: string;
  };
  apiLatency?: number;
  additionalInfo?: Record<string, string | number | boolean | null>;
}

export function DebugDock({
  isOwner = false,
  userEmail,
  ownerEmail,
  buildInfo,
  apiLatency,
  additionalInfo,
}: DebugDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-40 font-mono text-xs">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 py-1 bg-slate-900/90 border border-green-500/50 text-green-400 hover:bg-slate-800 hover:border-green-400 transition-all rounded"
        title="Toggle Debug Info"
      >
        {isExpanded ? "▼" : "▶"} DEBUG
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 bg-black/95 border border-green-500/30 rounded text-green-400 space-y-1 max-w-xs max-h-96 overflow-y-auto">
          <div className="text-green-300 font-bold border-b border-green-500/30 pb-2 mb-2">
            Owner Debug Info
          </div>

          <div className="space-y-1">
            <div>
              <span className="text-green-500">Owner:</span> {isOwner ? "✓ YES" : "✗ NO"}
            </div>
            {userEmail && (
              <div>
                <span className="text-green-500">User:</span> {userEmail}
              </div>
            )}
            {ownerEmail && (
              <div>
                <span className="text-green-500">Owner Email:</span> {ownerEmail}
              </div>
            )}

            {buildInfo && (
              <div className="mt-2 pt-2 border-t border-green-500/20">
                <div className="text-green-300 font-bold mb-1">Build</div>
                {buildInfo.version && (
                  <div>
                    <span className="text-green-500">Version:</span>{" "}
                    {buildInfo.version}
                  </div>
                )}
                {buildInfo.commit && (
                  <div>
                    <span className="text-green-500">Commit:</span>{" "}
                    {buildInfo.commit.substring(0, 8)}
                  </div>
                )}
                {buildInfo.buildTime && (
                  <div>
                    <span className="text-green-500">Built:</span>{" "}
                    {new Date(buildInfo.buildTime).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {apiLatency !== undefined && (
              <div className="mt-2 pt-2 border-t border-green-500/20">
                <span className="text-green-500">API Latency:</span> {apiLatency}
                ms
              </div>
            )}

            {additionalInfo && Object.keys(additionalInfo).length > 0 && (
              <div className="mt-2 pt-2 border-t border-green-500/20">
                {Object.entries(additionalInfo).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-green-500">{key}:</span>{" "}
                    {String(value)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-green-500/20 text-xs text-green-600">
            Debug mode active - remove in production
          </div>
        </div>
      )}
    </div>
  );
}
