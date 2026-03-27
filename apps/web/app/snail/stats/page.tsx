"use client";

import React from "react";
import Link from "next/link";
import { TrendingUp, Award, BarChart3, ArrowRight } from "lucide-react";

export default function StatsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl text-[#00ffff] mb-4 tracking-widest font-bold drop-shadow-[0_0_10px_#00ffff]">
          PERSONAL STATS
        </h1>
        <p className="text-xl text-[#8a4baf]">NEON-NATIVE PERFORMANCE TRACKER</p>
      </div>

      {/* Under Construction Badge */}
      <div className="flex justify-center">
        <div className="bg-[#0a0412] border-2 border-[#ff6b00] px-6 py-2 inline-flex items-center gap-3">
          <div className="w-3 h-3 bg-[#ff6b00] rounded-full animate-pulse drop-shadow-[0_0_5px_#ff6b00]" />
          <span className="text-[#ff6b00] font-bold tracking-[0.3em] text-sm drop-shadow-[0_0_5px_#ff6b00]">
            UNDER CONSTRUCTION
          </span>
        </div>
      </div>

      {/* Wireframe Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">

        {/* SIM Power Trend */}
        <div className="bg-[#0a0412] border-2 border-[#00ffff]/40 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-[#00ffff]" style={{ filter: "drop-shadow(0 0 5px #00ffff)" }} />
            <h3 className="text-lg font-bold tracking-widest text-[#00ffff]">SIM POWER TREND</h3>
          </div>
          <div className="bg-[#1a0b2e] border border-[#00ffff]/20 rounded h-32 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-[#00ffff]/40 text-4xl font-bold">[CHART]</div>
              <p className="text-[#d6b4fc]/40 text-xs tracking-widest">30-DAY POWER TRAJECTORY</p>
            </div>
          </div>
          <div className="flex justify-between text-xs text-[#d6b4fc]/60 tracking-widest">
            <span>DAY 1</span><span>DAY 15</span><span>TODAY</span>
          </div>
        </div>

        {/* Club Rank */}
        <div className="bg-[#0a0412] border-2 border-[#00ffff]/40 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Award size={20} className="text-[#00ffff]" style={{ filter: "drop-shadow(0 0 5px #00ffff)" }} />
            <h3 className="text-lg font-bold tracking-widest text-[#00ffff]">CLUB RANK</h3>
          </div>
          <div className="bg-[#1a0b2e] border border-[#00ffff]/20 rounded h-32 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-[#00ffff]/40 text-4xl font-bold">[#--]</div>
              <p className="text-[#d6b4fc]/40 text-xs tracking-widest">OF {">"}{"--"} MEMBERS</p>
            </div>
          </div>
          <div className="flex justify-between text-xs text-[#d6b4fc]/60 tracking-widest">
            <span>POWER: --</span><span>RANK: #--</span>
          </div>
        </div>

        {/* WoW Change */}
        <div className="bg-[#0a0412] border-2 border-[#00ffff]/40 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 size={20} className="text-[#00ffff]" style={{ filter: "drop-shadow(0 0 5px #00ffff)" }} />
            <h3 className="text-lg font-bold tracking-widest text-[#00ffff]">WOW CHANGE</h3>
          </div>
          <div className="bg-[#1a0b2e] border border-[#00ffff]/20 rounded h-32 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-[#00ffff]/40 text-4xl font-bold">[+--%]</div>
              <p className="text-[#d6b4fc]/40 text-xs tracking-widest">WEEK OVER WEEK</p>
            </div>
          </div>
          <div className="flex justify-between text-xs text-[#d6b4fc]/60 tracking-widest">
            <span>LAST WEEK: --</span><span>NOW: --</span>
          </div>
        </div>
      </div>

      {/* Coming Soon Footer */}
      <div className="text-center pt-6 border-t border-[#8a4baf]/30 space-y-3">
        <p className="text-[#8a4baf] text-sm tracking-widest font-mono">
          COMING SOON — TRACK YOUR PROGRESS
        </p>
        <div className="flex justify-center gap-4 text-xs text-[#d6b4fc]/50 tracking-widest">
          <Link href="/snail" className="flex items-center gap-1 hover:text-[#00ffff] transition-colors">
            <ArrowRight size={12} /> BACK TO HUB
          </Link>
          <Link href="/snail/club" className="flex items-center gap-1 hover:text-[#39ff14] transition-colors">
            <ArrowRight size={12} /> CLUB DASHBOARD
          </Link>
        </div>
      </div>
    </div>
  );
}
