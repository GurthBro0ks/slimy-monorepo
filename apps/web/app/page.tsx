import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import HomeClient from "./home-client";

export default async function HomePage() {
  // Detect if we're on trader surface
  const headerList = await headers();
  const host = headerList.get('host') || "";
  const pathname = headerList.get('x-pathname') || "";

  const isTrader = host.includes('trader') || pathname.startsWith('/trader');

  // Redirect trader traffic to trader-specific login (no Discord)
  if (isTrader) {
    redirect("/trader/login");
  }

  // For non-trader surfaces, show normal landing page with Discord
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-[#00ff00] font-mono text-xl">LOADING...</div>}>
      <HomeClient />
    </Suspense>
  );
}
