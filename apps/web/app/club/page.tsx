'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
const SheetView = dynamic(() => import('@/components/club/sheet-view').then(mod => mod.SheetView), { ssr: false });
import { ScannerPanel } from '@/components/club/scanner-panel';
import { useAuth } from '@/hooks/useAuth';
import { VT323, Press_Start_2P } from 'next/font/google';

const vt323 = VT323({ weight: '400', subsets: ['latin'] });
const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'] });

export default function ClubPage() {
  const { user, guilds, isLoading } = useAuth();
  // Default to last active guild, or first available guild
  const guildId = user?.lastActiveGuildId || guilds?.[0]?.id || '';

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!guildId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/club/analyze?guildId=${guildId}`);
      if (res.ok) {
        const json = await res.json();
        // Backend returns { success: true, results: [...] }
        setData(json.results || []);
      }
    } catch (error) {
      console.error("Failed to load sheet data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (guildId) loadData();
  }, [guildId]);

  if (isLoading) return <div className="text-[#00ff00] p-10 font-mono">AUTHENTICATING...</div>;

  if (!user) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center gap-5 p-10 ${vt323.className}`}>
        <div className="text-4xl text-[#ff0000] animate-pulse">ACCESS DENIED</div>
        <div className="text-xl text-[#e0aaff]">SECURE TERMINAL REQUIRES AUTHORIZATION</div>
        <a
          href="/api/auth/login"
          className="mt-5 px-8 py-3 bg-[#240046] border-2 border-[#ff0000] text-[#ff0000] hover:bg-[#ff0000] hover:text-[#050010] transition-all text-2xl uppercase tracking-widest"
        >
          Login via Discord
        </a>
      </div>
    );
  }

  // Role-based access control
  const userRole = user.role;
  const hasClubAccess = userRole === 'admin' || userRole === 'club';
  const isAdmin = userRole === 'admin';

  // If user is just a member (guild-only), deny access
  if (!hasClubAccess) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center gap-5 p-10 ${vt323.className}`}>
        <div className="text-4xl text-[#ff0000] animate-pulse">ACCESS RESTRICTED</div>
        <div className="text-xl text-[#e0aaff]">CLUB ANALYTICS MODULE REQUIRES CLUB OR ADMIN ROLE</div>
        <div className="text-sm text-[#9d4edd] mt-4 text-center max-w-md">
          You are authenticated as a guild member, but this module is restricted to Club members and Administrators.
          Please contact your server administrator for access.
        </div>
        <a
          href="/dashboard"
          className="mt-5 px-8 py-3 bg-[#240046] border-2 border-[#9d4edd] text-[#9d4edd] hover:bg-[#9d4edd] hover:text-[#050010] transition-all text-xl uppercase tracking-widest"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  const sheetViewRef = useRef<any>(null);

  const handleSave = async () => {
    if (!sheetViewRef.current || !guildId) return;

    const sheetData = sheetViewRef.current.getData();
    if (!sheetData) return;

    // Show saving state (optional, could use a toast)
    const originalText = document.getElementById('save-btn')?.innerText;
    if (document.getElementById('save-btn')) {
      document.getElementById('save-btn')!.innerText = 'SAVING...';
    }

    try {
      const res = await fetch('/api/club/sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, data: sheetData }),
      });

      if (res.ok) {
        // Success feedback
        if (document.getElementById('save-btn')) {
          document.getElementById('save-btn')!.innerText = 'SAVED!';
          setTimeout(() => {
            if (document.getElementById('save-btn')) document.getElementById('save-btn')!.innerText = 'SAVE CHANGES';
          }, 2000);
        }
      } else {
        console.error('Failed to save');
        if (document.getElementById('save-btn')) document.getElementById('save-btn')!.innerText = 'ERROR';
      }
    } catch (error) {
      console.error('Error saving sheet:', error);
      if (document.getElementById('save-btn')) document.getElementById('save-btn')!.innerText = 'ERROR';
    }
  };

  return (
    <div className={`flex-1 flex flex-col ${vt323.className}`}>
      {/* Marquee */}
      <div className="h-8 bg-[#240046] border-b border-[#5a189a] text-[#00ff00] flex items-center overflow-hidden whitespace-nowrap">
        <div className="animate-marquee pl-4">
          Initializing SlimeSheets v2.1... Secure Connection Established... Database: PRISMA... User: {user.globalName || user.username}... Role: {userRole.toUpperCase()}...
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-5">
        {/* Show ScannerPanel only for admins */}
        {isAdmin && <ScannerPanel guildId={guildId} onScanComplete={loadData} />}

        {/* Info banner for club members (view-only access) */}
        {!isAdmin && hasClubAccess && (
          <div className="bg-[#240046] border-2 border-[#9d4edd] shadow-[0_0_15px_rgba(157,78,221,0.4)] p-4 mb-4">
            <div className="text-[#e0aaff] font-mono text-sm">
              <span className="text-[#ff00ff] font-bold">VIEW-ONLY MODE:</span> You have Club member access.
              Screenshot upload and analysis is restricted to Administrators.
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col bg-[#240046] border-2 border-[#9d4edd] shadow-[0_0_15px_rgba(157,78,221,0.4)] min-h-[500px]">
          <div className="h-8 bg-gradient-to-r from-[#3c096c] to-[#10002b] flex items-center justify-between px-2 border-b-2 border-[#10002b] text-[#ff00ff] font-mono text-xs">
            <div className={`flex items-center gap-2 ${pressStart.className} text-[10px]`}>
              <span>SLIMESHEETS_V2.XLS</span>
            </div>
            <div className="text-[#00ff00]">CONNECTED: {guildId ? 'SECURE_DB' : 'WAITING_FOR_GUILD'}</div>
          </div>

          <div className="bg-[#10002b] border-b border-[#9d4edd] p-1 flex gap-2">
            <button onClick={loadData} className="bg-[#240046] border border-[#9d4edd] text-[#e0aaff] px-3 py-1 hover:bg-[#3c096c] hover:text-white transition-all text-lg">
              RELOAD
            </button>
            <button
              id="save-btn"
              onClick={handleSave}
              className="bg-[#240046] border border-[#00ff00] text-[#00ff00] px-3 py-1 hover:bg-[#00ff00] hover:text-black transition-all text-lg ml-auto"
            >
              SAVE CHANGES
            </button>
          </div>

          <div className="flex-1 relative">
            <SheetView ref={sheetViewRef} data={data} isLoading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
