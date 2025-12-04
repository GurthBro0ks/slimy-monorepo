"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthenticatedChatBar } from "@/components/layout/authenticated-chat-bar";
import { AuthProvider, useAuth } from "@/lib/auth/context";
import { ActiveGuildProvider } from "@/components/providers/active-guild-provider";
import { AuthErrorBoundary } from "@/components/auth/error-boundary";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { Press_Start_2P } from 'next/font/google';

const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'] });

const SHELL_ROUTES = ["/dashboard", "/analytics", "/club", "/snail", "/chat"];

/**
 * Unified Navigation Bar for Shell Routes
 */
function UnifiedNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/club', label: 'Club' },
    { href: '/chat', label: 'Chat' },
  ];

  return (
    <header className="relative z-10 h-16 bg-[#0d001a] border-b-2 border-[#9d4edd] flex items-center justify-between px-6 shadow-[0_0_20px_rgba(157,78,221,0.3)] shrink-0">
      <div className={`text-[#00ff00] text-xl flex items-center gap-3 ${pressStart.className}`}>
        <span className="text-2xl" role="img" aria-label="snail">🐌</span>
        <span className="drop-shadow-[2px_2px_#ff00ff]">slimyai.xyz</span>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-6 text-lg items-center">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-[#00ff00] transition-colors ${isActive ? 'text-[#00ff00] underline' : 'text-[#e0aaff]'
                }`}
            >
              {link.label}
            </Link>
          );
        })}
        {user && (
          <div className="flex items-center gap-4 ml-4 pl-4 border-l border-[#9d4edd]">
            <span className="text-[#e0aaff] text-sm">{user.name}</span>
            <button
              onClick={async () => {
                await logout();
                router.push('/');
              }}
              className="px-3 py-1 bg-[#240046] border border-[#9d4edd] text-[#e0aaff] hover:bg-[#9d4edd] hover:text-white transition-all text-sm"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Hamburger Menu */}
      <div className="md:hidden relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-[#e0aaff] hover:text-[#00ff00] p-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#10002b] border-2 border-[#9d4edd] shadow-[0_0_20px_rgba(157,78,221,0.5)] flex flex-col p-2 z-50">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2 hover:bg-[#240046] transition-colors ${isActive ? 'text-[#00ff00]' : 'text-[#e0aaff]'
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {user && (
              <>
                <div className="h-px bg-[#9d4edd] my-2" />
                <div className="px-4 py-2 text-[#e0aaff] text-xs opacity-70">
                  {user.name}
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    router.push('/');
                    setIsMenuOpen(false);
                  }}
                  className="text-left px-4 py-2 text-[#ff0000] hover:bg-[#240046] transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * Neon Grid Background Component
 */
function NeonGridBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `linear-gradient(rgba(20, 0, 40, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 0, 40, 0.8) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}
    />
  );
}

/**
 * Renders the authenticated application chrome and hides marketing UI for shell routes.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isShellRoute = SHELL_ROUTES.some((route) => pathname?.startsWith(route));
  const isChatPage = pathname === '/chat';
  const isLandingPage = pathname === '/';

  return (
    <AuthErrorBoundary>
      <AuthProvider>
        <ActiveGuildProvider>
          {isShellRoute ? (
            // Unified Shell for Dashboard, Club, Chat
            <div className="min-h-screen bg-[#050010] text-[#e0aaff] flex flex-col relative overflow-x-hidden">
              <NeonGridBackground />
              <UnifiedNav />
              <main className="relative z-10 flex-1 flex flex-col">
                {children}
              </main>
              <div className="relative z-50">
                <AuthenticatedChatBar />
              </div>
              <ServiceWorkerRegistration />
            </div>
          ) : (
            // Marketing pages
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              {!isChatPage && !isLandingPage && <AuthenticatedChatBar />}
              <ServiceWorkerRegistration />
            </div>
          )}
        </ActiveGuildProvider>
      </AuthProvider>
    </AuthErrorBoundary>
  );
}
