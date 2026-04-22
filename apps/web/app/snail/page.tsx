"use client";

import React from "react";
import { Hash, Users, Lock, TrendingUp, BookOpen } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";

export default function SnailLanding() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner" || user?.role === "leader";

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-5xl text-[#39ff14] mb-4 tracking-widest font-bold drop-shadow-[0_0_10px_#39ff14]">
          SUPER SNAIL OS
        </h1>
        <p className="text-2xl text-[#8a4baf]">NEON-NATIVE AUTOMATION INTERFACE</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Snail Codes Card */}
        <Link href="/snail/codes" className="no-underline group">
          <div
            className="bg-[#0a0412] border-2 p-8 flex flex-col items-center gap-4 transition-all group-hover:bg-[#1a0b2e] group-hover:shadow-[0_0_20px_rgba(212,0,255,0.3)]"
            style={{ borderColor: "#d400ff" }}
          >
            <div style={{ color: "#d400ff" }} className="drop-shadow-[0_0_5px_#d400ff] group-hover:scale-110 transition-transform">
              <Hash className="w-14 h-14" />
            </div>
            <h2 className="text-2xl font-bold tracking-widest" style={{ color: "#d400ff" }}>
              SNAIL CODES
            </h2>
            <p className="text-[#d6b4fc] text-center opacity-70 group-hover:opacity-100">
              603+ active codes — track &amp; manage Super Snail redemption codes in real-time
            </p>
            <span className="text-xs text-[#d400ff] font-mono tracking-widest mt-2 opacity-60 group-hover:opacity-100">VIEW CODES →</span>
          </div>
        </Link>

        {/* Club Dashboard Card */}
        {isOwner ? (
          <Link href="/snail/club" className="no-underline group">
            <div
              className="bg-[#0a0412] border-2 p-8 flex flex-col items-center gap-4 transition-all group-hover:bg-[#1a0b2e] group-hover:shadow-[0_0_20px_rgba(57,255,20,0.3)]"
              style={{ borderColor: "#39ff14" }}
            >
              <div style={{ color: "#39ff14" }} className="drop-shadow-[0_0_5px_#39ff14] group-hover:scale-110 transition-transform">
                <Users className="w-14 h-14" />
              </div>
              <h2 className="text-2xl font-bold tracking-widest" style={{ color: "#39ff14" }}>
                CLUB DASHBOARD
              </h2>
              <p className="text-[#d6b4fc] text-center opacity-70 group-hover:opacity-100">
                Club stats, member power rankings &amp; spreadsheet upload for Cormys Bar
              </p>
              <span className="text-xs text-[#39ff14] font-mono tracking-widest mt-2 opacity-60 group-hover:opacity-100">OPEN DASHBOARD →</span>
            </div>
          </Link>
        ) : (
          <div
            className="bg-[#0a0412] border-2 p-8 flex flex-col items-center gap-4 opacity-50 cursor-not-allowed"
            style={{ borderColor: "#39ff14" }}
          >
            <div style={{ color: "#39ff14" }} className="drop-shadow-[0_0_5px_#39ff14]">
              <Lock className="w-14 h-14" />
            </div>
            <h2 className="text-2xl font-bold tracking-widest" style={{ color: "#39ff14" }}>
              CLUB DASHBOARD
            </h2>
            <p className="text-[#d6b4fc] text-center opacity-70">
              Leader or owner — club stats &amp; member management
            </p>
            <span className="text-xs text-[#39ff14] font-mono tracking-widest mt-2 opacity-60">RESTRICTED</span>
          </div>
        )}

        {/* Personal Stats Card */}
        <Link href="/snail/stats" className="no-underline group">
          <div
            className="bg-[#0a0412] border-2 p-8 flex flex-col items-center gap-4 transition-all group-hover:bg-[#1a0b2e] group-hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]"
            style={{ borderColor: "#00ffff" }}
          >
            <div style={{ color: "#00ffff" }} className="drop-shadow-[0_0_5px_#00ffff] group-hover:scale-110 transition-transform">
              <TrendingUp className="w-14 h-14" />
            </div>
            <h2 className="text-2xl font-bold tracking-widest" style={{ color: "#00ffff" }}>
              PERSONAL STATS
            </h2>
            <p className="text-[#d6b4fc] text-center opacity-70 group-hover:opacity-100">
              Track your snail&apos;s power, growth, and compare against club members
            </p>
            <span className="text-xs text-[#00ffff] font-mono tracking-widest mt-2 opacity-60 group-hover:opacity-100">VIEW STATS →</span>
          </div>
        </Link>

        {/* Knowledge Base Card */}
        <Link href="/snail/wiki" className="no-underline group">
          <div
            className="bg-[#0a0412] border-2 p-8 flex flex-col items-center gap-4 transition-all group-hover:bg-[#1a0b2e] group-hover:shadow-[0_0_20px_rgba(255,107,0,0.3)]"
            style={{ borderColor: "#ff6b00" }}
          >
            <div style={{ color: "#ff6b00" }} className="drop-shadow-[0_0_5px_#ff6b00] group-hover:scale-110 transition-transform">
              <BookOpen className="w-14 h-14" />
            </div>
            <h2 className="text-2xl font-bold tracking-widest" style={{ color: "#ff6b00" }}>
              KNOWLEDGE BASE
            </h2>
            <p className="text-[#d6b4fc] text-center opacity-70 group-hover:opacity-100">
              Super Snail guides, tips, and game mechanics reference
            </p>
            <span className="text-xs text-[#ff6b00] font-mono tracking-widest mt-2 opacity-60 group-hover:opacity-100">OPEN WIKI →</span>
          </div>
        </Link>
      </div>

      {/* Secondary nav */}
      <div className="text-center pt-8 border-t border-[#8a4baf]/30">
        <p className="text-[#8a4baf] text-sm tracking-widest font-mono">MORE SNAIL FEATURES COMING SOON</p>
      </div>
    </div>
  );
}
