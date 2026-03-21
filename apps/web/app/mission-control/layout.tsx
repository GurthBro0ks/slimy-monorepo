export default function MissionControlLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-[#d6b4fc] font-mono">
      <nav className="p-4 bg-[#0a0412] border-b-2 border-[#39ff14] flex gap-6 text-[#39ff14] font-mono">
        <a href="/" className="hover:text-white transition-colors">[HOME]</a>
        <a href="/mission-control" className="hover:text-white transition-colors">[BOARD]</a>
        <a href="/mission-control/calendar" className="hover:text-white transition-colors">[CALENDAR]</a>
        <a href="/mission-control/agents" className="hover:text-white transition-colors">[AGENTS]</a>
      </nav>
      {children}
    </div>
  );
}
