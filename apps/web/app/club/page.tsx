"use client";
import { RetroWindowWrapper } from "@/components/layout/retro-window-wrapper";
import { useAuth } from "@/lib/auth/context";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function ClubContent() {
  const searchParams = useSearchParams();
  const guildId = searchParams.get('guildId');

  return (
     <div className="h-[800px] w-full bg-[#050010] text-[#00ff00] font-mono p-4 flex flex-col items-center justify-center border-2 border-dashed border-[#5a189a]">
        <h2 className="text-2xl mb-2">CONNECTED TO GRID</h2>
        <p className="text-[#e0aaff] mb-4">Target Node: {guildId || 'UNKNOWN'}</p>
        {guildId ? (
           <div className="space-y-3">
              <div className="p-4 border border-[#00ff00] bg-[#001000]">
                 SPREADSHEET_DATA_STREAM_ACTIVE
              </div>
              <Link
                href={`/club/${encodeURIComponent(guildId)}/settings`}
                className="inline-flex items-center justify-center bg-[#240046] border-2 border-[#9d4edd] text-[#e0aaff] font-mono text-lg px-4 py-2 hover:bg-[#3c096c] hover:text-white hover:border-[#00ff00] transition-colors"
              >
                Open Club Settings
              </Link>
           </div>
        ) : (
           <p className="text-red-500">ERROR: NO_GUILD_ID_PROVIDED</p>
        )}
     </div>
  );
}

export default function ClubPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!isLoading && !user) router.push("/"); }, [user, isLoading, router]);
  if (isLoading || !user) return <div className="p-10 text-[#00ff00] font-mono">LOADING_MODULE...</div>;

  return (
     <div className="p-4 w-full flex justify-center">
        <RetroWindowWrapper title="CLUB_ANALYTICS // SPREADSHEET">
           <Suspense fallback={<div className="p-10 text-[#00ff00] font-mono">LOADING_GRID...</div>}>
              <ClubContent />
           </Suspense>
        </RetroWindowWrapper>
     </div>
  );
}
