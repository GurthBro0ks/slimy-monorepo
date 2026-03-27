"use client";

import React from "react";
import Link from "next/link";
import { Gamepad2, Zap, Users, Gift, Wrench, ArrowRight } from "lucide-react";

const plannedTopics = [
  {
    icon: <Gamepad2 size={22} className="text-[#ff6b00]" style={{ filter: "drop-shadow(0 0 5px #ff6b00)" }} />,
    title: "Beginner's Guide",
    description: "Everything you need to know to start your Super Snail journey",
    tag: "STARTER",
  },
  {
    icon: <Zap size={22} className="text-[#ff6b00]" style={{ filter: "drop-shadow(0 0 5px #ff6b00)" }} />,
    title: "Power Leveling Strategies",
    description: "Maximize your SIM Power with proven progression techniques",
    tag: "ADVANCED",
  },
  {
    icon: <Users size={22} className="text-[#ff6b00]" style={{ filter: "drop-shadow(0 0 5px #ff6b00)" }} />,
    title: "Club Management Tips",
    description: "Build and manage a top-ranked club with effective leadership",
    tag: "LEADER",
  },
  {
    icon: <Gift size={22} className="text-[#ff6b00]" style={{ filter: "drop-shadow(0 0 5px #ff6b00)" }} />,
    title: "Code Redemption FAQ",
    description: "Common questions and troubleshooting for redemption codes",
    tag: "FAQ",
  },
  {
    icon: <Wrench size={22} className="text-[#ff6b00]" style={{ filter: "drop-shadow(0 0 5px #ff6b00)" }} />,
    title: "Game Mechanics",
    description: "Deep dive into the core systems: leveling, rewards, and more",
    tag: "REFERENCE",
  },
];

export default function WikiPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl text-[#ff6b00] mb-4 tracking-widest font-bold drop-shadow-[0_0_10px_#ff6b00]">
          KNOWLEDGE BASE
        </h1>
        <p className="text-xl text-[#8a4baf]">NEON-NATIVE SNAIL INTEL DATABASE</p>
      </div>

      {/* Under Construction Badge */}
      <div className="flex justify-center">
        <div className="bg-[#0a0412] border-2 border-[#00ffff] px-6 py-2 inline-flex items-center gap-3">
          <div className="w-3 h-3 bg-[#00ffff] rounded-full animate-pulse drop-shadow-[0_0_5px_#00ffff]" />
          <span className="text-[#00ffff] font-bold tracking-[0.3em] text-sm drop-shadow-[0_0_5px_#00ffff]">
            COMING SOON
          </span>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {plannedTopics.map((topic, idx) => (
          <div
            key={idx}
            className="bg-[#0a0412] border-2 border-[#ff6b00]/40 p-6 flex flex-col gap-3 transition-all hover:border-[#ff6b00]/80 hover:bg-[#1a0b2e] group cursor-default"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded">
                {topic.icon}
              </div>
              <span className="text-[10px] text-[#ff6b00]/60 tracking-[0.2em] font-mono border border-[#ff6b00]/30 px-2 py-0.5 rounded">
                {topic.tag}
              </span>
            </div>
            <h3 className="text-lg font-bold tracking-widest text-[#d6b4fc] group-hover:text-[#ff6b00] transition-colors">
              {topic.title}
            </h3>
            <p className="text-sm text-[#d6b4fc]/60 leading-relaxed">
              {topic.description}
            </p>
            <div className="mt-auto pt-3 border-t border-[#ff6b00]/20">
              <span className="text-xs text-[#ff6b00]/40 tracking-widest font-mono group-hover:text-[#ff6b00]/70 transition-colors">
                [ CONTENT LOADING... ]
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Community-driven Footer */}
      <div className="text-center pt-6 border-t border-[#8a4baf]/30 space-y-3">
        <p className="text-[#8a4baf] text-sm tracking-widest font-mono">
          COMMUNITY-DRIVEN GUIDES COMING SOON
        </p>
        <div className="flex justify-center gap-4 text-xs text-[#d6b4fc]/50 tracking-widest">
          <Link href="/snail" className="flex items-center gap-1 hover:text-[#ff6b00] transition-colors">
            <ArrowRight size={12} /> BACK TO HUB
          </Link>
          <Link href="/snail/codes" className="flex items-center gap-1 hover:text-[#d400ff] transition-colors">
            <ArrowRight size={12} /> SNAIL CODES
          </Link>
        </div>
      </div>
    </div>
  );
}
