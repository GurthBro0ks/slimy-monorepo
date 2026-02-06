'use client';

import { useState, useEffect } from 'react';

// Rank medal display for top 3
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/20 border border-yellow-400 text-yellow-300 font-bold text-sm shadow-[0_0_8px_rgba(234,179,8,0.4)]">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-300/20 border border-gray-400 text-gray-300 font-bold text-sm shadow-[0_0_6px_rgba(156,163,175,0.3)]">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 border border-amber-600 text-amber-500 font-bold text-sm shadow-[0_0_6px_rgba(217,119,6,0.3)]">
        3
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 text-[#9d4edd] font-mono text-sm">
      {rank}
    </span>
  );
}

// Score bar relative to max
function ScoreBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = Math.round((score / maxScore) * 100);
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-[#10002b] rounded-full overflow-hidden border border-[#3c096c]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: pct > 90 ? '#00ff00' : pct > 70 ? '#3dff8c' : pct > 50 ? '#b875ff' : '#9d4edd',
            boxShadow: pct > 90 ? '0 0 8px #00ff00' : 'none',
          }}
        />
      </div>
      <span className="text-[10px] text-[#9d4edd] font-mono w-8 text-right">{pct}%</span>
    </div>
  );
}

// Stat card for top-level metrics
function StatCard({
  label,
  value,
  sub,
  color = '#00ff00',
  pulse = false,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  pulse?: boolean;
}) {
  return (
    <div className="bg-[#120a2e]/80 border border-[#3c096c] rounded-lg p-3 sm:p-4 backdrop-blur-sm hover:border-[#9d4edd] transition-colors min-w-0">
      <div className="text-[10px] sm:text-xs text-[#9d4edd] font-mono uppercase tracking-wider truncate">
        {label}
      </div>
      <div
        className={`text-xl sm:text-2xl font-bold font-mono mt-1 truncate ${pulse ? 'animate-pulse' : ''}`}
        style={{ color, textShadow: `0 0 10px ${color}40` }}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] sm:text-xs text-[#e0aaff]/60 font-mono mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

// Alert item for bot notifications
function AlertItem({
  type,
  message,
  time,
}: {
  type: 'milestone' | 'warning' | 'info';
  message: string;
  time: string;
}) {
  const colors = {
    milestone: { border: '#00ff00', bg: '#00ff00', icon: '^' },
    warning: { border: '#ff5ccf', bg: '#ff5ccf', icon: '!' },
    info: { border: '#b875ff', bg: '#b875ff', icon: 'i' },
  };
  const c = colors[type];
  return (
    <div
      className="flex items-start gap-3 p-2.5 rounded-md border bg-black/20 hover:bg-black/40 transition-colors"
      style={{ borderColor: `${c.border}30` }}
    >
      <span
        className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono mt-0.5"
        style={{ background: `${c.bg}20`, color: c.bg, border: `1px solid ${c.border}50` }}
      >
        {c.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs sm:text-sm text-[#e0aaff] leading-tight">{message}</div>
        <div className="text-[10px] text-[#9d4edd]/60 font-mono mt-1">{time}</div>
      </div>
    </div>
  );
}

export default function SupersnailDashboard() {
  const [lastRefresh, setLastRefresh] = useState<string>('');

  useEffect(() => {
    setLastRefresh(new Date().toLocaleTimeString());
  }, []);

  const mockLeaderboard = [
    { rank: 1, player: 'GurthBr00ks', score: 1250000, boosts: '+10%', dailyGain: '+50k', trend: 'up' },
    { rank: 2, player: 'ClubMate1', score: 1180000, boosts: '+8%', dailyGain: '+45k', trend: 'up' },
    { rank: 3, player: 'ClubMate2', score: 1150000, boosts: '+7%', dailyGain: '+40k', trend: 'stable' },
    { rank: 4, player: 'Player4', score: 1100000, boosts: '+6%', dailyGain: '+35k', trend: 'up' },
    { rank: 5, player: 'Player5', score: 1080000, boosts: '+5%', dailyGain: '+30k', trend: 'down' },
    { rank: 6, player: 'Player6', score: 1050000, boosts: '+4%', dailyGain: '+28k', trend: 'stable' },
    { rank: 7, player: 'Player7', score: 1020000, boosts: '+3%', dailyGain: '+25k', trend: 'up' },
    { rank: 8, player: 'Player8', score: 1000000, boosts: '+2%', dailyGain: '+22k', trend: 'down' },
    { rank: 9, player: 'Player9', score: 980000, boosts: '+1%', dailyGain: '+20k', trend: 'stable' },
    { rank: 10, player: 'Player10', score: 960000, boosts: '0%', dailyGain: '+18k', trend: 'down' },
  ];

  const maxScore = mockLeaderboard[0].score;

  const alerts = [
    { type: 'milestone' as const, message: 'GurthBr00ks crossed 1.25M — new club record!', time: '2h ago' },
    { type: 'info' as const, message: 'Daily boost window opens in 4h 22m', time: '3h ago' },
    { type: 'warning' as const, message: 'ClubMate1 closing gap — 70k deficit', time: '5h ago' },
    { type: 'milestone' as const, message: 'Club total passed 10.7M combined score', time: '8h ago' },
    { type: 'info' as const, message: 'Weekend 2x boost event starts Saturday', time: '12h ago' },
  ];

  const trendIcon = (t: string) =>
    t === 'up' ? (
      <span className="text-[#00ff00] text-xs">&#9650;</span>
    ) : t === 'down' ? (
      <span className="text-[#ff5ccf] text-xs">&#9660;</span>
    ) : (
      <span className="text-[#9d4edd] text-xs">&#9644;</span>
    );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep, #0d0720)' }}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-[#e0aaff] tracking-wider">
              <span className="text-[#00ff00]">{'>'}</span> SUPERSNAIL HQ
            </h1>
            <p className="text-xs sm:text-sm text-[#9d4edd] font-mono mt-1">
              QCPlay Club 60 &middot; Proof-gated &middot; @GurthBr00ks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#9d4edd]/60 font-mono">
              {lastRefresh && `Updated ${lastRefresh}`}
            </span>
            <button
              onClick={() => setLastRefresh(new Date().toLocaleTimeString())}
              className="bg-[#240046] border border-[#00ff00] text-[#00ff00] text-xs font-mono px-3 py-1.5 rounded hover:bg-[#00ff00] hover:text-black transition-all active:scale-95"
            >
              REFRESH
            </button>
          </div>
        </div>

        {/* Stat Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard label="Your Score" value="1.25M" sub="Rank #1 / 60" color="#00ff00" pulse />
          <StatCard label="Daily Gain" value="+50k" sub="Best in club" color="#3dff8c" />
          <StatCard label="Club Total" value="10.77M" sub="10 active members" color="#b875ff" />
          <StatCard label="Active Boost" value="+10%" sub="Expires in 18h" color="#ff5ccf" />
        </div>

        {/* Main Grid: Leaderboard + Alerts sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Leaderboard Panel - takes 2 cols on large */}
          <div className="lg:col-span-2 bg-[#120a2e]/60 border border-[#3c096c] rounded-xl backdrop-blur-sm overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c096c] bg-[#10002b]/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00ff00] shadow-[0_0_6px_#00ff00] animate-pulse" />
                <h2 className="text-sm sm:text-base font-bold text-[#e0aaff] font-mono tracking-wide">
                  TOP 10 LEADERBOARD
                </h2>
              </div>
              <span className="text-[10px] text-[#9d4edd]/60 font-mono hidden sm:block">
                LIVE &middot; CLUB 60
              </span>
            </div>

            {/* Table - Desktop */}
            <div className="hidden sm:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] sm:text-xs text-[#9d4edd] font-mono uppercase border-b border-[#3c096c]/50">
                    <th className="py-2.5 px-4 w-14">Rank</th>
                    <th className="py-2.5 px-2">Player</th>
                    <th className="py-2.5 px-2 text-right">Score</th>
                    <th className="py-2.5 px-2 w-36">Progress</th>
                    <th className="py-2.5 px-2 text-center w-16">Boost</th>
                    <th className="py-2.5 px-2 text-right w-20">Daily</th>
                    <th className="py-2.5 px-4 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {mockLeaderboard.map((p) => (
                    <tr
                      key={p.rank}
                      className={`border-b border-[#3c096c]/30 transition-colors hover:bg-[#9d4edd]/5 ${
                        p.rank === 1 ? 'bg-[#00ff00]/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <RankBadge rank={p.rank} />
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`font-mono text-sm ${
                            p.rank === 1
                              ? 'text-[#00ff00] font-bold'
                              : p.rank <= 3
                              ? 'text-[#e0aaff]'
                              : 'text-[#e0aaff]/70'
                          }`}
                        >
                          {p.player}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="font-mono text-sm text-white tabular-nums">
                          {p.score.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <ScoreBar score={p.score} maxScore={maxScore} />
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-xs font-mono text-[#3dff8c] bg-[#3dff8c]/10 px-1.5 py-0.5 rounded">
                          {p.boosts}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="text-xs font-mono text-[#b875ff]">{p.dailyGain}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center">{trendIcon(p.trend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card View - Mobile */}
            <div className="sm:hidden divide-y divide-[#3c096c]/30">
              {mockLeaderboard.map((p) => (
                <div
                  key={p.rank}
                  className={`px-3 py-3 ${p.rank === 1 ? 'bg-[#00ff00]/5' : ''} active:bg-[#9d4edd]/10 transition-colors`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <RankBadge rank={p.rank} />
                      <span
                        className={`font-mono text-sm ${
                          p.rank === 1 ? 'text-[#00ff00] font-bold' : 'text-[#e0aaff]'
                        }`}
                      >
                        {p.player}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {trendIcon(p.trend)}
                      <span className="font-mono text-sm text-white font-bold tabular-nums">
                        {(p.score / 1000000).toFixed(2)}M
                      </span>
                    </div>
                  </div>
                  <ScoreBar score={p.score} maxScore={maxScore} />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] font-mono text-[#3dff8c]">Boost: {p.boosts}</span>
                    <span className="text-[10px] font-mono text-[#b875ff]">Daily: {p.dailyGain}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar: Alerts + Quick Actions */}
          <div className="flex flex-col gap-4">
            {/* Bot Alerts */}
            <div className="bg-[#120a2e]/60 border border-[#3c096c] rounded-xl backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c096c] bg-[#10002b]/50">
                <h2 className="text-sm font-bold text-[#e0aaff] font-mono tracking-wide">
                  BOT ALERTS
                </h2>
                <span className="w-2 h-2 rounded-full bg-[#ff5ccf] shadow-[0_0_6px_#ff5ccf] animate-pulse" />
              </div>
              <div className="p-3 space-y-2 max-h-[320px] overflow-y-auto">
                {alerts.map((a, i) => (
                  <AlertItem key={i} type={a.type} message={a.message} time={a.time} />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#120a2e]/60 border border-[#3c096c] rounded-xl backdrop-blur-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#3c096c] bg-[#10002b]/50">
                <h2 className="text-sm font-bold text-[#e0aaff] font-mono tracking-wide">
                  QUICK ACTIONS
                </h2>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                <a
                  href="/api/supersnail/scores"
                  className="bg-[#10002b] border border-[#3c096c] text-[#e0aaff] hover:border-[#00ff00] hover:text-[#00ff00] transition-all p-2.5 rounded-lg text-center font-mono text-xs"
                >
                  RAW API
                </a>
                <a
                  href="/dashboard"
                  className="bg-[#10002b] border border-[#3c096c] text-[#e0aaff] hover:border-[#b875ff] hover:text-[#b875ff] transition-all p-2.5 rounded-lg text-center font-mono text-xs"
                >
                  CMD CENTER
                </a>
                <button className="bg-[#10002b] border border-[#3c096c] text-[#e0aaff] hover:border-[#ff5ccf] hover:text-[#ff5ccf] transition-all p-2.5 rounded-lg text-center font-mono text-xs col-span-2 cursor-not-allowed opacity-50">
                  TELEGRAM ALERTS (SOON)
                </button>
              </div>
            </div>

            {/* Club Info Footer */}
            <div className="text-center py-3 border border-[#3c096c]/40 rounded-xl bg-[#120a2e]/30">
              <div className="text-[10px] text-[#9d4edd]/50 font-mono">
                Private Club MVP &middot; Proof-gated
              </div>
              <div className="text-[10px] text-[#9d4edd]/40 font-mono mt-0.5">
                slimyai.xyz/dashboard/supersnail
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
