'use client';

import { GuildList } from "@/components/dashboard/guild-list";
import Link from "next/link";
import MatrixBackground from "@/components/MatrixBackground";
import ScrollingMarquee from "@/components/ScrollingMarquee";
import { VT323 } from 'next/font/google';

const vt323 = VT323({ weight: '400', subsets: ['latin'] });

export default function DashboardPage() {
  return (
    <>
      {/* Matrix Background Effect */}
      <MatrixBackground />

      {/* Scrolling Marquee */}
      <ScrollingMarquee excludeOnPaths={["/"]} />

      <div className={`flex-1 flex flex-col p-6 ${vt323.className} relative z-10`}>
      {/* Page Header */}
      <div className="mb-6">
        <div className="text-sm text-[#9d4edd] mb-2">Home / Dashboard</div>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl text-[#00ff00] font-bold">Command Center</h1>
          <div className="text-[#00ff00] text-lg">System Status: Online</div>
        </div>
      </div>

      {/* Grid Dashboard */}
      <div className="grid-dashboard">
        <div className="panel col-span-8" style={{ minHeight: 300 }}>
          <div className="panel-header">
            <span>Live Activity</span>
            <span style={{ color: "var(--neon-pink)" }}>● Live</span>
          </div>
          <div className="panel-empty-state">
            <p>[Main Graph Placeholder – wire to stats/usage later]</p>
          </div>
        </div>

        <div className="panel col-span-4">
          <div className="panel-header">Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/club">
              <button className="panel-btn w-full">Run OCR Scan (Snail/Club)</button>
            </Link>
            <button className="panel-btn">Export Logs / Usage</button>
            <button className="panel-btn">Manage Permissions</button>
          </div>
        </div>

        <div className="panel col-span-4">
          <div className="panel-header">Recent Alerts</div>
          <div className="panel-empty-state">[Alert List Placeholder]</div>
        </div>

        <div className="panel col-span-4">
          <div className="panel-header">Server Health</div>
          <div className="panel-empty-state">[API / DB Status]</div>
        </div>

        <div className="panel col-span-4">
          <div className="panel-header">Integrations</div>
          <div className="panel-empty-state">[OpenAI, Sheets, Discord]</div>
        </div>

        <div className="panel col-span-12">
          <div className="panel-header">Your Servers</div>
          <GuildList />
        </div>
      </div>
    </div>
    </>
  );
}
