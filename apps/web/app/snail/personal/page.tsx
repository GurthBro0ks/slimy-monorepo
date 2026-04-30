"use client";

import Link from "next/link";
import { Activity, BookOpen, Hash, Lock, TrendingUp, User, Users } from "lucide-react";
import { useAuth } from "@/lib/auth/context";

const quickLinks = [
  {
    title: "Codes",
    href: "/snail/codes",
    icon: Hash,
    description: "Check current public codes before a daily session.",
  },
  {
    title: "Club Stats",
    href: "/snail/stats",
    icon: TrendingUp,
    description: "Review club-level progress and recent imported data.",
  },
  {
    title: "Club Dashboard",
    href: "/snail/club",
    icon: Users,
    description: "Open roster tools if your role has club access.",
  },
  {
    title: "Docs",
    href: "/snail/docs",
    icon: BookOpen,
    description: "Read the current Snail tool operating notes.",
  },
];

const plannedSignals = [
  "Owned-account progression snapshots",
  "Manual goals and weekly reminders",
  "Personal power history",
  "Code redemption notes",
];

export default function PersonalDashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <div className="space-y-10 font-mono">
      <section className="border-b-2 border-[#39ff14] pb-6">
        <div className="mb-3 flex items-center gap-3 text-[#00ffff]">
          <User size={28} />
          <span className="text-sm font-bold tracking-[0.35em]">PERSONAL TERMINAL</span>
        </div>
        <h1
          className="text-3xl font-bold tracking-tighter text-[#39ff14] drop-shadow-[0_0_10px_#39ff14] md:text-5xl"
          style={{ fontFamily: '"Press Start 2P", cursive' }}
        >
          PERSONAL DASHBOARD
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-[#d6b4fc]/80">
          A focused launch panel for player-side Super Snail workflows. Personal account analytics are not connected
          yet, so this page keeps the live tools upfront and clearly marks the data still waiting on a source.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-2 border-[#00ffff]/35 bg-[#0a0412] p-5">
          <div className="mb-4 flex items-center gap-3 text-[#00ffff]">
            <Activity size={24} />
            <h2 className="text-2xl font-bold tracking-widest" style={{ fontFamily: '"VT323", monospace' }}>
              Session Status
            </h2>
          </div>

          {isLoading ? (
            <p className="text-[#d6b4fc]/70">Checking session...</p>
          ) : isAuthenticated && user ? (
            <div className="space-y-3">
              <div className="border border-[#8a4baf]/30 bg-[#1a0b2e]/50 p-3">
                <p className="text-xs font-bold tracking-widest text-[#8a4baf]">SIGNED IN</p>
                <p className="mt-1 text-lg text-[#39ff14]">{user.username || user.email || user.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-[#8a4baf]/30 bg-[#1a0b2e]/50 p-3">
                  <p className="text-xs font-bold tracking-widest text-[#8a4baf]">ROLE</p>
                  <p className="mt-1 text-[#d6b4fc]">{user.role}</p>
                </div>
                <div className="border border-[#8a4baf]/30 bg-[#1a0b2e]/50 p-3">
                  <p className="text-xs font-bold tracking-widest text-[#8a4baf]">DATA LINK</p>
                  <p className="mt-1 text-[#ff6b00]">Pending</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 border border-[#ff6b00]/40 bg-[#ff6b00]/10 p-3 text-[#d6b4fc]">
                <Lock size={18} className="mt-0.5 shrink-0 text-[#ff6b00]" />
                <p className="text-sm">
                  Sign in to connect this page to your SlimyAI session. Public tools still work without a session.
                </p>
              </div>
              <Link
                href="/login?returnTo=/snail/personal"
                className="inline-flex border-2 border-[#39ff14] px-5 py-3 text-sm font-bold tracking-widest text-[#39ff14] transition-all hover:bg-[#39ff14] hover:text-black"
              >
                SIGN IN
              </Link>
            </div>
          )}
        </div>

        <div className="border-2 border-[#8a4baf]/40 bg-[#0a0412] p-5">
          <div className="mb-4 flex items-center gap-3 text-[#8a4baf]">
            <TrendingUp size={24} />
            <h2 className="text-2xl font-bold tracking-widest" style={{ fontFamily: '"VT323", monospace' }}>
              Personal Data Contract
            </h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-[#d6b4fc]/75">
            This page will become useful once there is a trusted personal source. Until then, it should not pretend to
            show account progress. The expected data surfaces are listed here so the gap stays visible.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {plannedSignals.map((signal) => (
              <div key={signal} className="border border-[#8a4baf]/25 bg-[#1a0b2e]/45 p-3 text-sm text-[#d6b4fc]">
                {signal}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold tracking-widest text-[#00ffff]" style={{ fontFamily: '"VT323", monospace' }}>
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.title}
                href={link.href}
                className="group border-2 border-[#8a4baf]/35 bg-[#0a0412] p-4 transition-all hover:border-[#39ff14] hover:bg-[#1a0b2e]"
              >
                <div className="mb-3 flex items-center gap-3 text-[#39ff14]">
                  <Icon size={22} />
                  <h3 className="text-xl font-bold tracking-widest" style={{ fontFamily: '"VT323", monospace' }}>
                    {link.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-[#d6b4fc]/70 group-hover:text-[#d6b4fc]">
                  {link.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
