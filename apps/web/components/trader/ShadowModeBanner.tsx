"use client";

import { Eye } from "lucide-react";

export function ShadowModeBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-amber-900/80 via-amber-800/80 to-amber-900/80 border-b-2 border-amber-500/50 px-6 py-3">
      <div className="flex items-center justify-center gap-4">
        <Eye className="w-5 h-5 text-amber-400 animate-pulse" />
        <span className="font-['VT323'] text-2xl text-amber-100 tracking-widest uppercase">
          Shadow Mode
        </span>
        <span className="text-amber-300/80 text-sm font-mono hidden sm:inline">
          Read-only observation mode - No live trading enabled
        </span>
        <Eye className="w-5 h-5 text-amber-400 animate-pulse" />
      </div>
    </div>
  );
}
