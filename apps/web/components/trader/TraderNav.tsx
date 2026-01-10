"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  TrendingUp,
  Crosshair,
  Shield,
  Circle,
  LogOut,
} from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_LINKS: NavLink[] = [
  { href: "/trader/overview", label: "Overview", icon: Gauge },
  { href: "/trader/markets", label: "Markets", icon: TrendingUp },
  { href: "/trader/edges", label: "Edges", icon: Crosshair },
  { href: "/trader/risk", label: "Risk", icon: Shield },
  { href: "/trader/recorder", label: "Recorder", icon: Circle },
];

interface TraderNavProps {
  username?: string;
}

export function TraderNav({ username }: TraderNavProps) {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-black/50 border-r border-gray-800 flex flex-col">
      {/* Logo/Title */}
      <div className="p-4 border-b border-gray-800">
        <Link href="/trader" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--neon-green)] rounded flex items-center justify-center">
            <span className="text-black font-bold text-sm">S</span>
          </div>
          <div>
            <span className="font-['VT323'] text-xl text-white tracking-wider">
              TRADER
            </span>
            <span className="text-xs text-gray-500 block font-mono">
              Slimy.ai
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-mono text-sm ${isActive
                      ? "bg-[var(--neon-green)]/10 text-[var(--neon-green)] border border-[var(--neon-green)]/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                  <span className="uppercase tracking-wider">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {username?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-sm text-white font-mono truncate block">
                {username || "Unknown"}
              </span>
              <span className="text-xs text-gray-500 font-mono">Trader</span>
            </div>
          </div>
          <form action="/trader/auth/logout" method="POST">
            <button
              type="submit"
              className="p-2 text-gray-500 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
