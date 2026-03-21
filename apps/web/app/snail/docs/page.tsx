"use client";

import React from "react";

export default function DocsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <h1 className="text-6xl font-bold text-[#00ffff] tracking-tighter drop-shadow-[0_0_10px_#00ffff]">
        DOCUMENTATION
      </h1>
      <div className="bg-[#1a0b2e] border-2 border-[#39ff14] p-12 text-center relative group">
        <p className="text-3xl text-[#39ff14] relative z-10">
          INDEXING_DATA_BANKS...
        </p>
        <p className="mt-4 text-[#d6b4fc] opacity-60 relative z-10">
          Neural-manual sync at 12%.
        </p>
      </div>
    </div>
  );
}
