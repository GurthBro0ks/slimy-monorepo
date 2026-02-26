"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home, Users, User, Hash, FileText } from "lucide-react";

export default function SnailLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { name: "HOME", href: "/snail", icon: <Home size={18} /> },
    { name: "GUILDS", href: "/snail/guilds", icon: <Users size={18} /> },
    { name: "PERSONAL", href: "/snail/personal", icon: <User size={18} /> },
    { name: "CODES", href: "/snail/codes", icon: <Hash size={18} /> },
    { name: "DOCS", href: "/snail/docs", icon: <FileText size={18} /> },
  ];

  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, index) => ({
      name: part.toUpperCase(),
      href: "/" + parts.slice(0, index + 1).join("/"),
    }));
  };

  return (
    <div className="min-h-screen bg-black text-[#d6b4fc] font-mono">
      {/* Snail Top Nav */}
      <nav className="border-b-2 border-[#8a4baf] bg-[#0a0412] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/login-landing" className="text-[#39ff14] text-2xl font-bold tracking-tighter flex items-center gap-2 hover:scale-105 transition-transform">
              <span className="text-3xl">🌀</span> SLIMY
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/snail" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-4 py-2 flex items-center gap-2 text-lg font-bold tracking-widest transition-all ${
                      isActive 
                        ? "text-[#39ff14] bg-[#1a0b2e] border-b-2 border-[#39ff14] drop-shadow-[0_0_5px_#39ff14]" 
                        : "text-[#8a4baf] hover:text-[#d6b4fc] hover:bg-white/5"
                    }`}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="text-[#39ff14] animate-pulse hidden lg:block">
            SYSTEM_STATUS: OK // SESSION_ACTIVE
          </div>
        </div>
      </nav>

      {/* Breadcrumbs */}
      <div className="bg-[#1a0b2e]/50 border-b border-[#8a4baf]/30 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-[#8a4baf]">
          <Link href="/" className="hover:text-[#39ff14]">ROOT</Link>
          {getBreadcrumbs().map((bc, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight size={14} />
              <Link href={bc.href} className={`hover:text-[#39ff14] ${idx === getBreadcrumbs().length - 1 ? "text-[#d6b4fc] font-bold" : ""}`}>
                {bc.name}
              </Link>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-8">
        {children}
      </main>

      {/* Snail Footer */}
      <footer className="mt-auto border-t-2 border-[#8a4baf] bg-[#0a0412] p-4 text-center opacity-50 text-sm tracking-[0.3em]">
        &copy; 2026 SLIMY_AI // NEON_SNAIL_OS_PRO
      </footer>
    </div>
  );
}
