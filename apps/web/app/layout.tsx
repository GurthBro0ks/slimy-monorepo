import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LazySlimeChatBar } from "@/components/lazy";
import { AuthProvider } from "@/lib/auth/context";
import { AuthErrorBoundary } from "@/components/auth/error-boundary";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Slimy.ai - AI-Powered Discord Bot",
  description: "Your AI-powered Discord companion for Super Snail and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthErrorBoundary>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <LazySlimeChatBar />
              <ServiceWorkerRegistration />
            </div>
          </AuthProvider>
        </AuthErrorBoundary>
      </body>
    </html>
  );
}
