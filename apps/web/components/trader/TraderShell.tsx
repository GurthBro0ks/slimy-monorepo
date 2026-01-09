"use client";

import { TraderNav } from "./TraderNav";
import { ShadowModeBanner } from "./ShadowModeBanner";
import { TraderDebugDock } from "./TraderDebugDock";
import { useTrader } from "@/lib/trader/context";

interface TraderShellProps {
  children: React.ReactNode;
  username?: string;
}

export function TraderShell({ children, username }: TraderShellProps) {
  const { mode } = useTrader();
  const isShadow = mode === "shadow";

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] flex">
      {/* Left Sidebar Navigation */}
      <TraderNav username={username} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Shadow Mode Banner */}
        {isShadow && <ShadowModeBanner />}

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">{children}</div>
      </main>

      {/* Debug Dock */}
      <TraderDebugDock />
    </div>
  );
}
