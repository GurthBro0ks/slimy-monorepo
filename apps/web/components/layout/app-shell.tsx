"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthenticatedChatBar } from "@/components/layout/authenticated-chat-bar";
import { AuthProvider } from "@/lib/auth/context";
import { ActiveGuildProvider } from "@/components/providers/active-guild-provider";
import { AuthErrorBoundary } from "@/components/auth/error-boundary";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const SHELL_ROUTES = ["/dashboard", "/analytics", "/club", "/snail"];

/**
 * Renders the authenticated application chrome and hides marketing UI for shell routes.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isShellRoute = SHELL_ROUTES.some((route) => pathname?.startsWith(route));
  const isChatPage = pathname === '/chat';
  const isHomePage = pathname === '/';

  return (
    <AuthErrorBoundary>
      <AuthProvider>
        <ActiveGuildProvider>
          <div className="flex min-h-screen flex-col">
            {!isShellRoute && !isHomePage && <Header />}
            <main className="flex-1">{children}</main>
            {!isShellRoute && !isHomePage && <Footer />}
            {!isShellRoute && !isChatPage && !isHomePage && <AuthenticatedChatBar />}
            <ServiceWorkerRegistration />
          </div>
        </ActiveGuildProvider>
      </AuthProvider>
    </AuthErrorBoundary>
  );
}
