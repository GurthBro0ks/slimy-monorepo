"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UserServer } from "@/lib/db/server-queries";
import { Snail, Loader2, ArrowRight } from "lucide-react";

export default function GuildsPage() {
  const [guilds, setGuilds] = useState<UserServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGuilds() {
      try {
        const res = await fetch("/api/guilds");
        if (!res.ok) throw new Error("Failed to fetch guilds");
        const data = await res.json();
        setGuilds(data.guilds || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }
    fetchGuilds();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-[#39ff14] animate-spin" />
        <p className="text-[#39ff14] font-mono text-xl animate-pulse">SCANNING NEURAL LINKS...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="border-2 border-red-500 p-8 bg-red-500/10 text-red-500 font-mono">
          <h2 className="text-2xl font-bold">ERROR: LINK_FAILURE</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <h1 className="text-5xl font-bold text-[#39ff14] tracking-tighter drop-shadow-[0_0_10px_#39ff14]">
          GUILD SELECTION
        </h1>
        <p className="text-[#8a4baf] font-mono text-lg">{guilds.length} ACTIVE_CHANNELS</p>
      </div>

      {guilds.length === 0 ? (
        <div className="bg-[#1a0b2e] border-2 border-[#8a4baf] p-12 text-center">
          <p className="text-2xl text-[#d6b4fc] mb-6">NO GUILDS FOUND IN CURRENT VECTOR</p>
          <Link href="/snail/personal" className="inline-flex items-center gap-2 px-6 py-3 bg-[#39ff14] text-black font-bold hover:bg-[#2ecc11] transition-colors">
            GO TO PERSONAL DASHBOARD <ArrowRight size={20} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guilds.map((guild) => (
            <Link key={guild.serverId} href={`/snail/guilds/${guild.serverId}`} className="group">
              <div className="bg-[#0a0412] border-2 border-[#8a4baf] p-6 hover:bg-[#1a0b2e] hover:border-[#39ff14] transition-all group-hover:shadow-[0_0_20px_rgba(57,255,20,0.2)] h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#1a0b2e] border border-[#8a4baf] group-hover:border-[#39ff14] flex items-center justify-center overflow-hidden">
                      {guild.serverIcon ? (
                        <img 
                          src={`https://chat.slimyai.xyz/api/servers/${guild.serverId}/icon`} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Snail className="w-8 h-8 text-[#8a4baf] group-hover:text-[#39ff14]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-[#d6b4fc] group-hover:text-[#39ff14] truncate">
                        {guild.serverName}
                      </h2>
                      <p className="text-xs text-[#8a4baf] font-mono">ID: {guild.serverId.slice(0, 8)}...</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-[#8a4baf]/30 font-mono text-sm space-y-1">
                    <p className="text-[#d6b4fc]/60 italic">Joined: {new Date(guild.joinedAt).toLocaleDateString()}</p>
                    <p className="text-[#39ff14]/80">ROLES: {guild.userRoles.length}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end text-[#39ff14] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-mono text-sm">INITIALIZE_LINK &gt;&gt;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
