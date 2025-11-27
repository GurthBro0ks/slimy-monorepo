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

  return (
    <AuthErrorBoundary>
      <AuthProvider>
        <ActiveGuildProvider>
          <div className="flex min-h-screen flex-col">
            {!isShellRoute && <Header />}
            <main className="flex-1">{children}</main>
            {!isShellRoute && <Footer />}
            {!isShellRoute && <AuthenticatedChatBar />}
            <ServiceWorkerRegistration />
          </div>
        </ActiveGuildProvider>
      </AuthProvider>
    </AuthErrorBoundary>
  );
}
