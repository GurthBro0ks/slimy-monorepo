"use client";
import { useAuth } from "@/lib/auth/context"; // FIXED IMPORT
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push("/");
  }, [user, isLoading, router]);

  if (isLoading) return null;
  if (!user) return null;

  const sharedGuilds = user.guilds ? user.guilds.filter(g => g.installed) : [];

  return (
    <div className="p-8 max-w-6xl mx-auto mt-6">
       <h1 className="text-3xl font-bold text-[#d400ff] mb-8 font-mono text-center tracking-widest text-shadow-neon">// COMMAND CENTER</h1>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#240046] border-2 border-[#9d4edd] p-6 shadow-[0_0_15px_rgba(157,78,221,0.4)]">
             <h2 className="text-[#00ff00] border-b border-[#5a189a] pb-2 mb-4 font-bold text-xl font-['Press_Start_2P'] text-xs">USER_PROFILE</h2>
             <div className="font-mono space-y-4 text-[#e0aaff] text-lg">
                <div className="flex justify-between border-b border-[#5a189a] pb-1 border-dashed"><span>USERNAME:</span> <span className="text-white">{user.username}</span></div>
                <div className="flex justify-between border-b border-[#5a189a] pb-1 border-dashed"><span>ID:</span> <span className="text-gray-400 text-sm">{user.id}</span></div>
                <div className="flex justify-between border-b border-[#5a189a] pb-1 border-dashed"><span>STATUS:</span> <span className="text-[#00ff00] animate-pulse">ONLINE</span></div>
                <div className="flex justify-between"><span>ROLE:</span> <span className="text-[#d400ff]">{user.role?.toUpperCase() || 'MEMBER'}</span></div>
             </div>
          </div>
          <div className="bg-[#240046] border-2 border-[#9d4edd] p-6 shadow-[0_0_15px_rgba(157,78,221,0.4)]">
             <h2 className="text-[#00ff00] border-b border-[#5a189a] pb-2 mb-4 font-bold text-xl font-['Press_Start_2P'] text-xs">ACTIVE NODES (SHARED)</h2>
             <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {sharedGuilds.length === 0 ? (
                   <div className="text-gray-500 italic text-center py-8 border-2 border-dashed border-[#5a189a] p-4">No shared servers detected.<br/><span className="text-xs">Add the bot to a server to see it here.</span></div>
                ) : (
                   sharedGuilds.map((guild) => (
                     <div key={guild.id} className="flex items-center justify-between bg-[#10002b] p-3 border border-[#5a189a] hover:border-[#d400ff] transition-colors group">
                        <div className="flex items-center gap-3">
                           {guild.icon ? <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} alt="Icon" className="w-10 h-10 rounded-md border border-[#9d4edd]" /> : <div className="w-10 h-10 rounded-md bg-[#3c096c] flex items-center justify-center text-xs font-bold text-[#e0aaff] border border-[#9d4edd]">{guild.name.substring(0, 2).toUpperCase()}</div>}
                           <div className="flex flex-col">
                             <span className="text-[#e0aaff] font-mono text-base group-hover:text-white transition-colors">{guild.name}</span>
                           </div>
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
