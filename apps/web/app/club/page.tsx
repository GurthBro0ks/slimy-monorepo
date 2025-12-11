'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
const SheetView = dynamic(() => import('@/components/club/sheet-view').then(mod => mod.SheetView), { ssr: false });
import type { SheetViewHandle } from '@/components/club/sheet-view';
import { ScannerPanel } from '@/components/club/scanner-panel';
import { useAuth } from '@/hooks/useAuth';

export default function ClubPage() {
  const { user, guilds, isLoading } = useAuth();
  // Default to last active guild, or first available guild
  const guildId = user?.lastActiveGuildId || guilds?.[0]?.id || '';

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const sheetRef = useRef<SheetViewHandle>(null);

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

  const saveData = async () => {
    if (!guildId || !sheetRef.current) return;
    setSaving(true);
    try {
      const sheetData = sheetRef.current.getData();
      const res = await fetch('/api/club/sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, data: sheetData }),
      });
      if (res.ok) {
        const json = await res.json();
        console.log('Sheet saved successfully', json);
        alert('Sheet saved successfully!');
      } else {
        const error = await res.json();
        console.error('Failed to save sheet', error);
        alert(`Failed to save sheet: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to save sheet data", error);
      alert(`Error saving sheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (guildId) loadData();
  }, [guildId]);

  if (isLoading) return <div className="bg-[#050010] min-h-screen text-[#00ff00] p-10 font-mono">AUTHENTICATING...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050010] text-[#ff0000] p-10 font-mono flex flex-col items-center justify-center gap-5">
        <div className="text-4xl animate-pulse">ACCESS DENIED</div>
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

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(20, 0, 40, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 0, 40, 0.8) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <main className="relative z-10 flex-1 p-5 flex flex-col gap-5">
        <ScannerPanel guildId={guildId} onScanComplete={loadData} />

        <div className="flex-1 flex flex-col bg-[#240046] border-2 border-[#9d4edd] shadow-[0_0_15px_rgba(157,78,221,0.4)] min-h-[500px]">
          <div className="h-8 bg-gradient-to-r from-[#3c096c] to-[#10002b] flex items-center justify-between px-2 border-b-2 border-[#10002b] text-[#ff00ff] font-mono text-xs">
            <div className="flex items-center gap-2 text-[10px]">
              <span>SLIMESHEETS_V2.XLS</span>
            </div>
            <div className="text-[#00ff00]">CONNECTED: {guildId ? 'SECURE_DB' : 'WAITING_FOR_GUILD'}</div>
          </div>

          <div className="bg-[#10002b] border-b border-[#9d4edd] p-1 flex gap-2">
            <button onClick={loadData} className="bg-[#240046] border border-[#9d4edd] text-[#e0aaff] px-3 py-1 hover:bg-[#3c096c] hover:text-white transition-all text-lg" disabled={loading}>
              {loading ? 'LOADING...' : 'RELOAD'}
            </button>
            <button onClick={saveData} className="bg-[#240046] border border-[#9d4edd] text-[#00ff00] px-3 py-1 hover:bg-[#3c096c] hover:text-white transition-all text-lg" disabled={saving}>
              {saving ? 'SAVING...' : 'SAVE'}
            </button>
          </div>

          <div className="flex-1 relative">
            <SheetView ref={sheetRef} data={data} isLoading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
}
