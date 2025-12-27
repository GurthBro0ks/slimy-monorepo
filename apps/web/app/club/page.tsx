"use client";
import { RetroWindowWrapper } from "@/components/layout/retro-window-wrapper";
import { SettingsActivityWidget } from "@/components/settings/SettingsActivityWidget";
import { useAuth } from "@/lib/auth/context";
import { createWebCentralSettingsClient } from "@/lib/api/central-settings-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";

function safeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return String(value);
}

function resolveUserId(user: any): string | null {
  return safeString(user?.discordId || user?.id || user?.sub || "").trim() || null;
}

function ClubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const queryGuildId = safeString(searchParams.get("guildId")).trim();
  const csrfToken = safeString((user as any)?.csrfToken || "").trim() || null;
  const userId = useMemo(() => (isLoading ? null : resolveUserId(user as any)), [isLoading, user]);

  const client = useMemo(
    () => createWebCentralSettingsClient({ csrfToken }),
    [csrfToken],
  );

  const [resolvedGuildId, setResolvedGuildId] = useState<string>("");
  const [resolvedGuildSource, setResolvedGuildSource] = useState<string>("none");
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    if (queryGuildId) {
      setResolvedGuildId(queryGuildId);
      setResolvedGuildSource("query");
      setResolveError(null);
      return;
    }

    const fromAuth = safeString((user as any)?.lastActiveGuildId || "").trim();
    if (fromAuth) {
      setResolvedGuildId(fromAuth);
      setResolvedGuildSource("auth:lastActiveGuildId");
      setResolveError(null);
      router.replace(`/club?guildId=${encodeURIComponent(fromAuth)}`);
      return;
    }

    if (!userId) {
      setResolvedGuildId("");
      setResolvedGuildSource("none");
      setResolveError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setResolveError(null);
      const res = await client.getUserSettings(userId);
      if (cancelled) return;
      if (!res.ok || !res.data?.ok) {
        setResolvedGuildId("");
        setResolvedGuildSource("userSettings:error");
        setResolveError("Failed to load UserSettings (activeGuildId)");
        return;
      }

      const settings = res.data.settings as Record<string, unknown>;
      const v = settings["activeGuildId"];
      const fromSettings = typeof v === "string" ? v.trim() : "";
      if (!fromSettings) {
        setResolvedGuildId("");
        setResolvedGuildSource("userSettings:none");
        return;
      }

      setResolvedGuildId(fromSettings);
      setResolvedGuildSource("userSettings:activeGuildId");
      router.replace(`/club?guildId=${encodeURIComponent(fromSettings)}`);
    })().catch((err) => {
      if (cancelled) return;
      setResolvedGuildId("");
      setResolvedGuildSource("userSettings:exception");
      setResolveError(safeString((err as any)?.message) || "userSettings_load_failed");
    });

    return () => {
      cancelled = true;
    };
  }, [client, queryGuildId, router, user, userId]);

  const guildId = queryGuildId || resolvedGuildId;

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

	              <div className="mt-4 w-full max-w-3xl">
	                <SettingsActivityWidget scopeType="guild" scopeId={guildId} limit={10} />
	              </div>
	           </div>
	        ) : (
             <div className="space-y-3 text-center">
               <p className="text-red-500">No active club selected.</p>
               <p className="text-[#e0aaff]">Pick an Active Club on Settings to make this page work without a URL parameter.</p>
               <Link
                 href="/settings"
                 className="inline-flex items-center justify-center bg-[#240046] border-2 border-[#9d4edd] text-[#e0aaff] font-mono text-lg px-4 py-2 hover:bg-[#3c096c] hover:text-white hover:border-[#00ff00] transition-colors"
               >
                 Open Settings
               </Link>
             </div>
	        )}

         <div className="mt-6 w-full max-w-3xl rounded border border-[#00ff00] bg-[#001000] p-3 text-left text-xs text-[#00ff00]">
           <div className="font-semibold">Debug</div>
           <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
             <div>query.guildId: {queryGuildId || "(none)"}</div>
             <div>resolved.guildId: {resolvedGuildId || "(none)"}</div>
             <div>resolved.source: {resolvedGuildSource}</div>
             <div>resolveError: {resolveError || "(none)"}</div>
           </div>
         </div>
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
