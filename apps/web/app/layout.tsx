'use client';

import type { Metadata } from "next";
import { usePathname } from "next/navigation";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LazySlimeChatBar } from "@/components/lazy";
import { AuthProvider } from "@/lib/auth/context";
import { AuthErrorBoundary } from "@/components/auth/error-boundary";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

export const metadata: Metadata = {
  title: "Slimy.ai - AI-Powered Discord Bot",
  description: "Your AI-powered Discord companion for Super Snail and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const shellRoutes = ["/dashboard", "/analytics", "/club", "/snail"];
  const isShellRoute = shellRoutes.some((route) => pathname?.startsWith(route));

  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <AuthErrorBoundary>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              {!isShellRoute && <Header />}
              <main className="flex-1">{children}</main>
              {!isShellRoute && <Footer />}
              {!isShellRoute && <LazySlimeChatBar />}
              <ServiceWorkerRegistration />
            </div>
          </AuthProvider>
        </AuthErrorBoundary>
      </body>
    </html>
  );
}
