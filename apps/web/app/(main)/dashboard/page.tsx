"use client";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (!isLoading && !user) router.push("/"); }, [user, isLoading, router]);

  // slimy-auth session returns: { id, username, email, role }
  const username = user?.username || "Unknown";
  const userId = user?.id || "";
  const role = user?.role || "member";

  // Quick links for owner role
  const isOwner = role === "owner";

  if (!mounted || isLoading) return <div className="p-10 text-[#00ff00] font-mono">LOADING...</div>;
  if (!user) return null;

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
          </div>

          {/* Quick Access */}
          <div className="bg-[#240046] border-2 border-[#9d4edd] p-6 shadow-[0_0_15px_rgba(157,78,221,0.4)]">
             <h2 className="text-[#00ff00] border-b border-[#5a189a] pb-2 mb-4 font-bold text-xl font-['Press_Start_2P'] text-xs">QUICK ACCESS</h2>
             <div className="space-y-3">
                {isOwner ? (
                  <>
                    <Link href="/owner/crypto" className="block p-4 bg-[#10002b] border border-[#5a189a] hover:border-[#d400ff] transition-colors group">
                      <span className="text-[#e0aaff] font-mono group-hover:text-white">CRYPTO DASHBOARD</span>
                    </Link>
                    <Link href="/owner/invites" className="block p-4 bg-[#10002b] border border-[#5a189a] hover:border-[#d400ff] transition-colors group">
                      <span className="text-[#e0aaff] font-mono group-hover:text-white">MANAGE INVITES</span>
                    </Link>
                    <Link href="/owner/settings" className="block p-4 bg-[#10002b] border border-[#5a189a] hover:border-[#d400ff] transition-colors group">
                      <span className="text-[#e0aaff] font-mono group-hover:text-white">SETTINGS</span>
                    </Link>
                    <Link href="/owner/audit" className="block p-4 bg-[#10002b] border border-[#5a189a] hover:border-[#d400ff] transition-colors group">
                      <span className="text-[#e0aaff] font-mono group-hover:text-white">AUDIT LOG</span>
                    </Link>
                  </>
                ) : (
                  <div className="text-gray-500 italic text-center py-8 border-2 border-dashed border-[#5a189a] p-4">
                    No owner features available.<br/>
                    <span className="text-xs text-[#d400ff] mt-2 block">Contact admin for access.</span>
                  </div>
                )}
             </div>
          </div>
       </div>

       {/* Info Note */}
       <div className="mt-8 p-4 bg-[#10002b] border-2 border-[#5a189a]">
          <p className="text-purple-300 text-sm font-mono">
             <span className="text-[#00ff00]">NOTE:</span> Discord OAuth has been removed. Authentication is now via email/password (slimy-auth).
          </p>
       </div>
    </div>
  );
}
