import { Suspense } from "react";
import HomeClient from "./home-client";

export default async function HomePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-[#00ff00] font-mono text-xl">LOADING...</div>}>
      <HomeClient />
    </Suspense>
  );
}
