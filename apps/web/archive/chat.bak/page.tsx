"use client";

import React, { useEffect } from "react";

export default function ChatRedirectPage() {
  useEffect(() => {
    window.location.href = "https://chat.slimyai.xyz";
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 font-mono">
      <div className="text-center space-y-6">
        <div className="text-6xl animate-bounce">🌀</div>
        <h1 className="text-[#39ff14] text-3xl font-bold tracking-widest animate-pulse">
          REDIRECTING TO SLIME CHAT...
        </h1>
        <p className="text-[#8a4baf] text-xl">Linking neural pathways...</p>
      </div>
    </div>
  );
}
