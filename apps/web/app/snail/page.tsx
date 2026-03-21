"use client";

import React from "react";
import { Users, User, Hash, FileText } from "lucide-react";
import Link from "next/link";

export default function SnailLanding() {
  const sections = [
    {
      title: "GUILD SELECTION",
      icon: <Users className="w-12 h-12" />,
      href: "/snail/guilds",
      borderColor: "#39ff14",
      description: "Manage and monitor your Discord guilds",
    },
    {
      title: "PERSONAL DASHBOARD",
      icon: <User className="w-12 h-12" />,
      href: "/snail/personal",
      borderColor: "#8a4baf",
      description: "Your individual stats and preferences",
    },
    {
      title: "LIVE CODES",
      icon: <Hash className="w-12 h-12" />,
      href: "/snail/codes",
      borderColor: "#d400ff",
      description: "Real-time snail code tracking and generation",
    },
    {
      title: "DOCUMENTATION",
      icon: <FileText className="w-12 h-12" />,
      href: "/snail/docs",
      borderColor: "#00ffff",
      description: "Learn how to master the Super Snail system",
    },
  ];

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-5xl text-[#39ff14] mb-4 tracking-widest font-bold drop-shadow-[0_0_10px_#39ff14]">
          SUPER SNAIL OS
        </h1>
        <p className="text-2xl text-[#8a4baf]">NEON-NATIVE AUTOMATION INTERFACE</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <Link key={idx} href={section.href} className="no-underline group">
            <div
              className="bg-[#0a0412] border-2 p-6 flex flex-col items-center gap-4 transition-all group-hover:bg-[#1a0b2e] group-hover:shadow-[0_0_20px_rgba(57,255,20,0.2)]"
              style={{ borderColor: section.borderColor }}
            >
              <div style={{ color: section.borderColor }} className="drop-shadow-[0_0_5px_currentColor] group-hover:scale-110 transition-transform">
                {section.icon}
              </div>
              <h2 className="text-2xl font-bold tracking-widest" style={{ color: section.borderColor }}>
                {section.title}
              </h2>
              <p className="text-[#d6b4fc] text-center opacity-70 group-hover:opacity-100">
                {section.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
