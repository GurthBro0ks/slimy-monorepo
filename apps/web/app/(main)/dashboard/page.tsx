"use client";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (!isLoading && !user) router.push("/"); }, [user, isLoading, router]);

  if (!mounted || isLoading) return <div className="p-10 text-[#00ff00] font-mono">LOADING...</div>;
  if (!user) return null;

  // ADAPTER: Handle Nested Data
  // @ts-ignore
  const realUser = user.user || user; 
  const username = realUser.username || realUser.name || "Unknown";
  const userId = realUser.id || realUser.discordId;
  const role = realUser.role || "member";

  // GUILD PROCESSING
  // @ts-ignore
  const rawGuilds = user.sessionGuilds || user.guilds || realUser.guilds || [];
  
  // FILTER: Only show guilds that have a valid Name AND ID (Hides the "?" ghosts)
  const validGuilds = rawGuilds.filter((g: any) => g.id && g.name);
  
  // If we have "installed" flags, prefer those. Otherwise show all VALID guilds.
  const hasInstalledFlag = validGuilds.some((g: any) => g.installed !== undefined);
  const displayGuilds = hasInstalledFlag ? validGuilds.filter((g: any) => g.installed) : validGuilds;

  return (
    <div className="p-8 max-w-6xl mx-auto">
       <h1 className="text-3xl font-bold text-[#d400ff] mb-8 font-mono text-center tracking-widest text-shadow-neon">{"// COMMAND CENTER"}</h1>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Card */}
          <div className="bg-[#240046] border-2 border-[#9d4edd] p-6 shadow-[0_0_15px_rgba(157,78,221,0.4)] relative">
             <h2 className="text-[#00ff00] border-b border-[#5a189a] pb-2 mb-4 font-bold text-xl font-['Press_Start_2P'] text-xs">USER_PROFILE</h2>
             <div className="font-mono space-y-4 text-[#e0aaff] text-lg">
                <div className="flex justify-between border-b border-[#5a189a] pb-1 border-dashed"><span>USERNAME:</span> <span className="text-white">{username}</span></div>
                <div className="flex justify-between border-b border-[#5a189a] pb-1 border-dashed"><span>ID:</span> <span className="text-gray-400 text-sm">{userId}</span></div>
                <div className="flex justify-between border-b border-[#5a189a] pb-1 border-dashed"><span>STATUS:</span> <span className="text-[#00ff00] animate-pulse">ONLINE</span></div>
                <div className="flex justify-between"><span>ROLE:</span> <span className="text-[#d400ff]">{role.toUpperCase()}</span></div>
             </div>
             {/* SYNC BUTTON */}
             <a href="/api/auth/login" className="absolute top-4 right-4 bg-[#00ff00] text-black text-xs px-2 py-1 font-bold hover:bg-white cursor-pointer">
                <i className="fa-solid fa-rotate mr-1"></i> RE-SYNC
             </a>
          </div>

          {/* Server List */}
          <div className="bg-[#240046] border-2 border-[#9d4edd] p-6 shadow-[0_0_15px_rgba(157,78,221,0.4)]">
             <h2 className="text-[#00ff00] border-b border-[#5a189a] pb-2 mb-4 font-bold text-xl font-['Press_Start_2P'] text-xs">ACTIVE NODES ({displayGuilds.length})</h2>
             <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {displayGuilds.length === 0 ? (
                   <div className="text-gray-500 italic text-center py-8 border-2 border-dashed border-[#5a189a] p-4">
                      No active nodes detected.<br/>
                      <span className="text-xs text-[#d400ff] mt-2 block">If you just added the bot, click RE-SYNC.</span>
                   </div>
                ) : (
                   displayGuilds.map((guild: any) => (
                     <div key={guild.id} className="flex items-center justify-between bg-[#10002b] p-3 border border-[#5a189a] hover:border-[#d400ff] transition-colors group">
                        <div className="flex items-center gap-3">
                           {guild.icon ? <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} alt="Icon" className="w-10 h-10 rounded-md border border-[#9d4edd]" /> : <div className="w-10 h-10 rounded-md bg-[#3c096c] flex items-center justify-center text-xs font-bold text-[#e0aaff] border border-[#9d4edd]">{(guild.name || '?').substring(0, 2).toUpperCase()}</div>}
                           <div className="flex flex-col"><span className="text-[#e0aaff] font-mono text-base group-hover:text-white transition-colors">{guild.name}</span></div>
                        </div>
                        <Link href={`/club?guildId=${guild.id}`} className="text-[#00ff00] hover:text-black text-xs border border-[#00ff00] px-3 py-1 hover:bg-[#00ff00] transition-all font-bold font-mono">ACCESS &gt;</Link>
                     </div>
                   ))
                )}
             </div>
          </div>
       </div>
    </div>
  );
}
