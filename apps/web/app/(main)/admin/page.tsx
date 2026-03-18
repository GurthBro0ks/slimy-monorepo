// Admin Panel - Redirects to /chat/settings
"use client";

import { useEffect } from "react";

export default function AdminPanelPage() {
  useEffect(() => {
    window.location.href = "/chat/settings";
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
      <div className="text-center space-y-4">
        <div className="text-6xl animate-pulse">↻</div>
        <p className="text-gray-400 font-mono">Redirecting to Settings...</p>
      </div>
    </div>
  );
}
