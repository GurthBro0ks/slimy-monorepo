"use client";

import React from "react";

export default function PersonalDashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <h1 className="text-6xl font-bold text-[#8a4baf] tracking-tighter drop-shadow-[0_0_10px_#8a4baf]">
        PERSONAL DASHBOARD
      </h1>
      <div className="bg-[#1a0b2e] border-2 border-[#00ffff] p-12 text-center relative group">
        <p className="text-3xl text-[#00ffff] relative z-10">
          STAY TUNED...
        </p>
        <p className="mt-4 text-[#d6b4fc] opacity-60 relative z-10">
          Loading user-specific neural weights.
        </p>
      </div>
    </div>
  );
}
