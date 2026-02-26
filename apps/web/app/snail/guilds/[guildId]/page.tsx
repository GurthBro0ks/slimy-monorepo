"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ServerDetails } from "@/lib/db/server-queries";
import { 
  Loader2, 
  LayoutDashboard, 
  BarChart3, 
  PieChart, 
  Settings, 
  Lock, 
  RefreshCw, 
  AlertCircle,
  Database,
  History,
  Users
} from "lucide-react";

interface ClubStats {
  lastUpdated: string;
  memberCount: number;
  data: any[]; 
}

export default function ClubDashboardPage() {
  const { guildId } = useParams() as { guildId: string };
  const [guildData, setGuildData] = useState<{ guild: ServerDetails; userRoles: string[] } | null>(null);
  const [clubStats, setClubStats] = useState<ClubStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const guildRes = await fetch(`/api/guilds/${guildId}`);
      if (!guildRes.ok) {
        if (guildRes.status === 403) throw new Error("ACCESS_DENIED: User not in guild.");
        throw new Error("Failed to fetch guild details");
      }
      const gJson = await guildRes.json();
      setGuildData(gJson);

      const statsRes = await fetch(`/api/club/latest?guildId=${guildId}`);
      if (statsRes.ok) {
        const sJson = await statsRes.json();
        setClubStats(sJson);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during uplink");
    } finally {
      setIsLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleRescan = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/club/rescan?guildId=${guildId}`, { method: "POST" });
      if (res.ok) {
        await fetchAllData();
      } else {
        const err = await res.json();
        alert(`RESCAN_FAILED: ${err.message || "Unknown error"}`);
      }
    } catch (err) {
      alert("NETWORK_ERROR during rescan");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-[#39ff14] animate-spin" />
        <p className="text-[#39ff14] font-mono text-xl animate-pulse">SYNCHRONIZING NEURAL UPLINK...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="border-2 border-red-500 p-8 bg-red-500/10 text-red-500 font-mono text-center">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            <AlertCircle /> UPLINK_CRITICAL_FAILURE
          </h2>
          <p className="mt-2">{error}</p>
          <button 
            onClick={fetchAllData}
            className="mt-6 px-4 py-2 border-2 border-red-500 hover:bg-red-500 hover:text-black transition-colors font-bold"
          >
            RETRY_CONNECTION
          </button>
        </div>
      </div>
    );
  }

  const isManager = guildData?.userRoles.some(r => 
    r.toLowerCase().includes("manager") || 
    r.toLowerCase().includes("admin") || 
    r.toLowerCase().includes("owner")
  ) || guildData?.guild.owner === guildData?.guild._id;

  const tabs = [
    { id: "overview", name: "OVERVIEW", icon: <LayoutDashboard size={18} /> },
    { id: "stats", name: "STATS HISTORY", icon: <History size={18} /> },
    { id: "analytics", name: "ANALYTICS", icon: <PieChart size={18} /> },
    { id: "settings", name: "SETTINGS", icon: <Settings size={18} />, restricted: true },
  ];

  return (
    <div className="space-y-8 font-mono">
      <div className="border-b-2 border-[#39ff14] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-[#1a0b2e] border-2 border-[#39ff14] flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(57,255,20,0.3)]">
            {guildData?.guild.icon ? (
              <img src={`https://chat.slimyai.xyz/api/servers/${guildId}/icon`} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-[#39ff14] font-bold">{guildData?.guild.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h1 className="text-5xl font-bold text-[#39ff14] tracking-tighter drop-shadow-[0_0_10px_#39ff14]" style={{ fontFamily: '"VT323", monospace' }}>
              {guildData?.guild.name.toUpperCase()}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="bg-[#39ff14]/10 border border-[#39ff14] px-2 py-0.5 text-[#39ff14] text-xs">
                UPLINK_STATUS: OK
              </span>
              <span className="text-[#8a4baf] text-sm italic">
                {guildData?.userRoles.length} PERMISSION_NODES_ACTIVE
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleRescan}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#2d0b4e] border-2 border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14] hover:text-black transition-all font-bold tracking-widest disabled:opacity-50"
        >
          {isRefreshing ? <RefreshCw className="animate-spin" size={20} /> : <RefreshCw size={20} />}
          RESCAN_DATABASE
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#8a4baf]/20">
        {tabs.map((tab) => {
          const isRestricted = tab.restricted && !isManager;
          return (
            <button
              key={tab.id}
              disabled={isRestricted}
              onClick={() => !isRestricted && setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-bold tracking-widest transition-all border-t-2 border-x-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#1a0b2e] border-[#39ff14] text-[#39ff14] drop-shadow-[0_0_5px_#39ff14]"
                  : isRestricted
                  ? "text-[#8a4baf]/30 border-transparent opacity-50 cursor-not-allowed"
                  : "text-[#8a4baf] border-transparent hover:text-[#d6b4fc] hover:bg-white/5"
              }`}
            >
              {isRestricted ? <Lock size={16} /> : tab.icon}
              {tab.name}
            </button>
          );
        })}
      </div>

      <div className="min-h-[50vh]">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0a0412] border-2 border-[#8a4baf] p-6 space-y-2">
              <div className="flex items-center gap-2 text-[#8a4baf] mb-4">
                <Users size={20} />
                <span className="font-bold">MEMBER_COUNT</span>
              </div>
              <p className="text-5xl text-[#39ff14] font-bold">
                {clubStats?.memberCount || "???"}
              </p>
              <p className="text-xs text-[#8a4baf] opacity-60 italic">TOTAL_NEURAL_LINKAGES</p>
            </div>

            <div className="bg-[#0a0412] border-2 border-[#39ff14] p-6 space-y-2">
              <div className="flex items-center gap-2 text-[#39ff14] mb-4">
                <RefreshCw size={20} />
                <span className="font-bold">LAST_SYNCHRONIZATION</span>
              </div>
              <p className="text-3xl text-[#d6b4fc] font-bold">
                {clubStats?.lastUpdated ? new Date(clubStats.lastUpdated).toLocaleTimeString() : "PENDING..."}
              </p>
              <p className="text-xs text-[#d6b4fc] opacity-60 italic">
                {clubStats?.lastUpdated ? new Date(clubStats.lastUpdated).toLocaleDateString() : "AWAITING_INPUT"}
              </p>
            </div>

            <div className="bg-[#0a0412] border-2 border-[#d400ff] p-6 space-y-2">
              <div className="flex items-center gap-2 text-[#d400ff] mb-4">
                <Database size={20} />
                <span className="font-bold">DATABASE_INTEGRITY</span>
              </div>
              <p className="text-4xl text-[#ff7ae9] font-bold">STABLE</p>
              <p className="text-xs text-[#ff7ae9] opacity-60 italic">REVOLT_NODE_CONNECTION_ACTIVE</p>
            </div>

            <div className="md:col-span-3 bg-[#1a0b2e] border-2 border-[#8a4baf]/30 p-8 text-center">
              <h3 className="text-2xl text-[#39ff14] mb-4 font-bold">QUICK_SUMMARY</h3>
              <p className="text-[#d6b4fc] text-lg max-w-2xl mx-auto">
                Successfully connected to the {guildData?.guild.name} data stream. 
                {clubStats?.data ? ` Analyzing ${clubStats.data.length} recent activity logs.` : " Initializing spreadsheet analysis engine..."}
              </p>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="bg-[#0a0412] border-2 border-[#8a4baf] p-4 overflow-hidden">
            <div className="bg-[#001000] border border-[#39ff14] p-4 mb-4">
              <p className="text-[#39ff14] font-bold flex items-center gap-2">
                <Database size={16} /> STREAMING_LIVE_DATA_FROM_ADMIN_API...
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#8a4baf] text-[#8a4baf]">
                    <th className="p-3">MEMBER_ID</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">CONTRIBUTION</th>
                    <th className="p-3">LAST_SEEN</th>
                  </tr>
                </thead>
                <tbody className="text-[#d6b4fc]">
                  {clubStats?.data && clubStats.data.length > 0 ? (
                    clubStats.data.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-[#8a4baf]/10 hover:bg-[#1a0b2e] transition-colors">
                        <td className="p-3 font-bold">{row.name || row.userId || `USER_${i}`}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 border border-[#39ff14] text-[#39ff14] text-xs">ACTIVE</span>
                        </td>
                        <td className="p-3 text-[#39ff14]">{row.score || row.stats || "0.00"}</td>
                        <td className="p-3 text-sm opacity-60">{row.updated || "RECENT"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-[#8a4baf] italic">
                        NO_DATA_STREAM_AVAILABLE // INITIATE_RESCAN
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === "analytics" || activeTab === "settings") && (
          <div className="bg-[#0a0412] border-2 border-[#8a4baf]/30 p-12 text-center flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-[#39ff14]/20 rounded-full animate-ping absolute top-0 left-0" />
              <Loader2 className="w-24 h-24 text-[#39ff14] opacity-40" />
            </div>
            <div>
              <h3 className="text-3xl text-[#39ff14] font-bold mb-2">MODULE_INITIALIZING: {activeTab.toUpperCase()}</h3>
              <p className="text-[#d6b4fc] text-xl opacity-60 max-w-lg mx-auto">
                Advanced {activeTab} decryption scheduled for Phase 4. Standby for neural synchronization.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
