"use client";
import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, ReferenceLine,
} from "recharts";

const C = {
  bg: "#0a0612",
  card: "rgba(14,8,28,0.92)",
  border: "rgba(0,255,157,0.12)",
  green: "#00ff9d",
  pink: "#ff2d95",
  cyan: "#00e5ff",
  yellow: "#ffe700",
  red: "#ff3355",
  orange: "#ff8a2d",
  text: "#eee4ff",
  sub: "#c0b0e0",
  muted: "#9080b8",
  dim: "#5a4a7a",
  mono: "'JetBrains Mono',monospace",
};

const Stat = ({ label, value, sub, color = C.green }: any) => (
  <div style={{ background: C.card, border: `1px solid ${color}22`, borderRadius: 12, padding: "16px 20px" }}>
    <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: C.mono, marginBottom: 6, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: C.mono }}>{value ?? "—"}</div>
    {sub && <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Badge = ({ text, color }: any) => (
  <span style={{
    padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 700,
    background: `${color}18`, color, border: `1px solid ${color}33`,
    fontFamily: C.mono, letterSpacing: 1
  }}>{text}</span>
);

const verdictColor = (v: string) => {
  if (v === "EDGE_CONFIRMED") return C.green;
  if (v === "NO_EDGE") return C.red;
  if (v === "MARGINAL_EDGE") return C.yellow;
  return C.dim;
};

function useClientTime(format: (d: Date) => string, dateStr: string | null | undefined, fallback: string) {
  const [display, setDisplay] = useState<string>(fallback);
  useEffect(() => {
    if (!dateStr) { setDisplay(fallback); return; }
    try { setDisplay(format(new Date(dateStr))); } catch { setDisplay(fallback); }
  }, [dateStr, format, fallback]);
  return display;
}

function ClientTimestamp({ dateStr, format = "string", fallback = "—" }: { dateStr?: string | null; format?: "string" | "date" | "time"; fallback?: string }) {
  const fmt = useCallback((d: Date) => {
    if (format === "date") return d.toLocaleDateString();
    if (format === "time") return d.toLocaleTimeString();
    return d.toLocaleString();
  }, [format]);
  return <span suppressHydrationWarning>{useClientTime(fmt, dateStr, fallback)}</span>;
}

function CumulativePnLChart({ data }: { data: { timestamp: string; pnl: number; cumPnl: number }[] }) {
  if (!data || data.length === 0) {
    return <div style={{ color: C.dim, fontFamily: C.mono, fontSize: 12 }}>No data</div>;
  }
  // Parse timestamps as UTC midnight to avoid SSR/client timezone mismatches in toLocaleDateString
  const chartData = data.map(d => ({
    ...d,
    date: d.timestamp ? new Date(d.timestamp + "T00:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC" }) : "",
  }));
  const min = Math.min(...chartData.map(d => d.cumPnl));
  const max = Math.max(...chartData.map(d => d.cumPnl));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={`${C.dim}22`} />
        <XAxis
          dataKey="date"
          tick={{ fill: C.muted, fontSize: 10, fontFamily: C.mono }}
          tickLine={false}
          axisLine={{ stroke: `${C.dim}33` }}
        />
        <YAxis
          tick={{ fill: C.muted, fontSize: 10, fontFamily: C.mono }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${v.toFixed(0)}`}
          domain={[min * 1.05, max * 1.05]}
        />
        <Tooltip
          contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: C.mono, fontSize: 11 }}
          labelStyle={{ color: C.muted }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, "Cumulative PnL"]}
          labelFormatter={(label: string) => `Date: ${label}`}
        />
        {min < 0 && <ReferenceLine y={0} stroke={C.dim} strokeDasharray="4 4" strokeWidth={1} />}
        <Line
          type="monotone"
          dataKey="cumPnl"
          stroke={C.green}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: C.green }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function PnLDistributionChart({ data }: { data: { bucket: string; count: number }[] }) {
  if (!data || data.length === 0) {
    return <div style={{ color: C.dim, fontFamily: C.mono, fontSize: 12 }}>No data</div>;
  }
  // Color gradient: red for losses, green for wins
  const getBarColor = (bucket: string) => {
    if (bucket.startsWith("<") || bucket.startsWith("-")) return C.red;
    if (bucket.includes("$0")) return C.dim;
    return C.green;
  };
  const chartData = data.map(d => ({ ...d, fill: getBarColor(d.bucket) }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={`${C.dim}22`} vertical={false} />
        <XAxis
          dataKey="bucket"
          tick={{ fill: C.muted, fontSize: 10, fontFamily: C.mono }}
          tickLine={false}
          axisLine={{ stroke: `${C.dim}33` }}
        />
        <YAxis
          tick={{ fill: C.muted, fontSize: 10, fontFamily: C.mono }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: C.mono, fontSize: 11 }}
          labelStyle={{ color: C.muted }}
          formatter={(v: number, _name: string) => [v, "Trades"]}
        />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {chartData.map((entry, index) => (
            <rect key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function WeeklyRevenueChart({ data }: { data: { week: string; kalshi_optimize: number; shadow: number; live: number }[] }) {
  if (!data || data.length === 0) {
    return <div style={{ color: C.dim, fontFamily: C.mono, fontSize: 12 }}>No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={`${C.dim}22`} vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fill: C.muted, fontSize: 10, fontFamily: C.mono }}
          tickLine={false}
          axisLine={{ stroke: `${C.dim}33` }}
        />
        <YAxis
          tick={{ fill: C.muted, fontSize: 10, fontFamily: C.mono }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${v.toFixed(0)}`}
        />
        <Tooltip
          contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: C.mono, fontSize: 11 }}
          labelStyle={{ color: C.muted }}
          formatter={(v: number, name: string) => [`$${v.toFixed(2)}`, name]}
        />
        <Legend
          wrapperStyle={{ fontFamily: C.mono, fontSize: 11, color: C.muted, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
        <ReferenceLine y={0} stroke={C.dim} strokeDasharray="4 4" strokeWidth={1} />
        <Bar dataKey="shadow" stackId="a" fill={C.cyan} name="Shadow" radius={[0, 0, 0, 0]} />
        <Bar dataKey="kalshi_optimize" stackId="a" fill={C.green} name="Kalshi" radius={[0, 0, 0, 0]} />
        <Bar dataKey="live" stackId="a" fill={C.orange} name="Live" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function TradingTab({ isActive }: { isActive: boolean }) {
  const [section, setSection] = useState("overview");
  const [overview, setOverview] = useState<any>(null);
  const [kalshi, setKalshi] = useState<any>(null);
  const [matched, setMatched] = useState<any>(null);
  const [bootstrap, setBootstrap] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isActive) fetchAll();
  }, [isActive]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [ov, kal, mat, boot, ts] = await Promise.all([
        fetch("/api/owner/crypto/trading/overview", { credentials: "include" }).then(r => r.json()).catch(() => null),
        fetch("/api/owner/crypto/trading/kalshi", { credentials: "include" }).then(r => r.json()).catch(() => null),
        fetch("/api/owner/crypto/trading/matched", { credentials: "include" }).then(r => r.json()).catch(() => null),
        fetch("/api/owner/crypto/trading/bootstrap", { credentials: "include" }).then(r => r.json()).catch(() => null),
        fetch("/api/owner/crypto/trading/timeseries", { credentials: "include" }).then(r => r.json()).catch(() => null),
      ]);
      setOverview(ov); setKalshi(kal); setMatched(mat); setBootstrap(boot); setTimeseries(ts);
    } catch (e) {
      console.error("Trading data fetch failed:", e);
    }
    setLoading(false);
  }

  const sections = [
    { id: "overview", label: "📊 Overview" },
    { id: "kalshi", label: "📈 Kalshi" },
    { id: "matched", label: "🎰 Matched Betting" },
    { id: "bootstrap", label: "🔬 Bootstrap" },
  ];

  return (
    <div style={{ animation: "fadeUp 0.3s" }}>
      {/* Sub-nav pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {sections.map(s => (
          <button key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 12, fontFamily: C.mono,
              fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s",
              background: section === s.id ? `${C.green}18` : "rgba(255,255,255,0.04)",
              color: section === s.id ? C.green : C.muted,
              borderColor: section === s.id ? `${C.green}44` : "transparent",
              border: section === s.id ? `1px solid ${C.green}44` : "1px solid transparent",
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: C.dim, fontFamily: C.mono, fontSize: 13 }}>Loading...</div>}

      {/* ── OVERVIEW ── */}
      {section === "overview" && !loading && overview && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
            <Stat label="Total PnL" value={`$${(overview.totalPnl || 0).toFixed(2)}`}
              sub="Kalshi + Matched" color={overview.totalPnl >= 0 ? C.green : C.red} />
            <Stat label="Kalshi Balance"
              value={overview.kalshiBalance != null ? `$${overview.kalshiBalance.toFixed(2)}` : "N/A"}
              sub="Most recent trade" color={C.cyan} />
            <Stat label="Revenue Streams" value={overview.activeStreams || 0}
              sub="Active" color={C.yellow} />
            <Stat label="Bootstrap"
              value={<Badge text={overview.bootstrapVerdict || "—"} color={verdictColor(overview.bootstrapVerdict)} />}
              sub="Verdict" color={verdictColor(overview.bootstrapVerdict)} />
          </div>
          {overview.recentActivity?.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: C.mono, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Recent Activity</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: C.mono, fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.dim}22` }}>
                      <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Time</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Market</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Source</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted }}>PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recentActivity.map((r: any, i: number) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.dim}11` }}>
                        <td style={{ padding: "6px 8px", color: C.sub }}><ClientTimestamp dateStr={r.timestamp} /></td>
                        <td style={{ padding: "6px 8px", color: C.text }}>{r.market}</td>
                        <td style={{ padding: "6px 8px" }}><Badge text={r.source} color={C.cyan} /></td>
                        <td style={{ padding: "6px 8px", textAlign: "right", color: r.pnl >= 0 ? C.green : C.red }}>{r.pnl >= 0 ? "+" : ""}{r.pnl.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {timeseries?.series?.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Weekly Revenue</div>
              <WeeklyRevenueChart data={timeseries.series} />
            </div>
          )}
        </div>
      )}

      {/* ── KALSHI ── */}
      {section === "kalshi" && !loading && kalshi && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 20 }}>
            <Stat label="Total Trades" value={kalshi.summary?.totalTrades || 0} color={C.cyan} />
            <Stat label="Win Rate" value={`${kalshi.summary?.winRate || 0}%`}
              sub={`${kalshi.summary?.shadowTrades || 0} shadow / ${kalshi.summary?.liveTrades || 0} live`} color={C.green} />
            <Stat label="Total PnL" value={`$${(kalshi.summary?.totalPnl || 0).toFixed(2)}`}
              color={kalshi.summary?.totalPnl >= 0 ? C.green : C.red} />
            <Stat label="Avg PnL" value={`$${(kalshi.summary?.avgPnl || 0).toFixed(2)}`} color={C.cyan} />
            <Stat label="Payoff Ratio" value={`${kalshi.summary?.payoffRatio || 0}x`}
              sub="Avg win / |Avg loss|" color={C.orange} />
          </div>

          {kalshi.cumulativePnl?.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Cumulative PnL</div>
              <CumulativePnLChart data={kalshi.cumulativePnl} />
            </div>
          )}

          {kalshi.pnlDistribution && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>PnL Distribution</div>
              <PnLDistributionChart data={kalshi.pnlDistribution} />
            </div>
          )}

          {kalshi.recentTrades?.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>All Trades</div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: C.mono, fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.dim}22`, position: "sticky", top: 0, background: C.card }}>
                      <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Time</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Market</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Side</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted }}>Entry</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted }}>PnL</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kalshi.recentTrades.map((r: any, i: number) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.dim}11` }}>
                        <td style={{ padding: "5px 8px", color: C.sub, fontSize: 11 }}><ClientTimestamp dateStr={r.timestamp} /></td>
                        <td style={{ padding: "5px 8px", color: C.text, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.marketId}</td>
                        <td style={{ padding: "5px 8px", color: r.side === "BUY" ? C.green : C.red }}>{r.side}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right", color: C.text }}>{(r.entryPrice ?? 0).toFixed(2)}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right", color: (r.pnlUsd ?? 0) >= 0 ? C.green : C.red, fontWeight: 600 }}>{(r.pnlUsd ?? 0) >= 0 ? "+" : ""}{(r.pnlUsd ?? 0).toFixed(2)}</td>
                        <td style={{ padding: "5px 8px" }}><Badge text={r.source} color={r.source === "live" ? C.green : C.cyan} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MATCHED BETTING ── */}
      {section === "matched" && !loading && matched && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
            <Stat label="Est. EV Remaining"
              value={`$${(matched.summary?.totalEstimatedEV || 0).toFixed(0)}`}
              sub={`${matched.summary?.bonusesAvailable || 0} available`} color={C.yellow} />
            <Stat label="Claimed"
              value={matched.summary?.bonusesClaimed || 0}
              sub="Sportsbooks" color={C.orange} />
            <Stat label="Profit Realized"
              value={`$${(matched.summary?.totalProfitRealized || 0).toFixed(2)}`}
              color={matched.summary?.totalProfitRealized >= 0 ? C.green : C.red} />
            <Stat label="Best Conversion"
              value={`${matched.summary?.bestConversionRate || 0}%`}
              sub="Historical best" color={C.cyan} />
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Sportsbooks</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: C.mono, fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.dim}22` }}>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Sportsbook</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Type</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted }}>Amount</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted }}>Rollover</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Status</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted }}>Est. EV</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted }}>Rollover EV</th>
                  </tr>
                </thead>
                <tbody>
                  {matched.sportsbooks?.map((b: any) => {
                    const statusColors: Record<string, string> = {
                      available: C.cyan, claimed: C.yellow, completed: C.green, expired: C.dim,
                    };
                    const rolloverEV = b.rolloverEV;
                    return (
                      <tr key={b.id} style={{ borderBottom: `1px solid ${C.dim}11` }}>
                        <td style={{ padding: "6px 8px", color: C.text, fontWeight: 600 }}>{b.name}</td>
                        <td style={{ padding: "6px 8px", color: C.sub, fontSize: 11 }}>{b.bonusType}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", color: C.green }}>${(b.amount ?? 0).toFixed(0)}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", color: C.sub }}>{b.rollover}x</td>
                        <td style={{ padding: "6px 8px" }}>
                          <Badge text={b.status} color={statusColors[b.status] || C.dim} />
                        </td>
                        <td style={{ padding: "6px 8px", textAlign: "right", color: C.yellow }}>
                          ${b.status === "available" ? ((b.amount ?? 0) * 0.70).toFixed(0) : "—"}
                        </td>
                        <td style={{ padding: "6px 8px", textAlign: "right", color: (rolloverEV ?? 0) >= 0 ? C.green : C.red, fontWeight: 600 }}>
                          ${(rolloverEV ?? 0).toFixed(0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {matched.conversions?.length > 0 ? (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Conversion History</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: C.mono, fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.dim}22` }}>
                      <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Sportsbook</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted }}>Bonus</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted }}>Conversion</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted }}>Guaranteed</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted }}>Actual</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matched.conversions.map((c: any, i: number) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.dim}11` }}>
                        <td style={{ padding: "6px 8px", color: C.text }}>{c.sportsbookName}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", color: C.green }}>${c.bonusAmount.toFixed(0)}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", color: C.cyan }}>{c.conversionRate.toFixed(1)}%</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", color: C.yellow }}>${c.guaranteedProfit.toFixed(2)}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", color: c.actualProfit >= 0 ? C.green : C.red }}>${c.actualProfit.toFixed(2)}</td>
                        <td style={{ padding: "6px 8px", color: C.sub, fontSize: 11 }}><ClientTimestamp dateStr={c.completedAt} format="date" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: "center" }}>
              <div style={{ color: C.sub, fontFamily: C.mono, fontSize: 13, marginBottom: 8 }}>No conversions yet</div>
              <div style={{ color: C.dim, fontFamily: C.mono, fontSize: 11 }}>Use the CLI to track bets:</div>
              <pre style={{ background: "rgba(0,0,0,0.3)", padding: "10px 14px", borderRadius: 6, fontFamily: C.mono, fontSize: 11, color: C.green, marginTop: 10, textAlign: "left" }}>
{`python3 strategies/matched_betting/cli.py calc \\
  --back-stake 100 --back-odds +200 \\
  --lay-odds -200 --bonus-type free_bet`}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── BOOTSTRAP ── */}
      {section === "bootstrap" && !loading && bootstrap && (
        <div>
          {bootstrap.latest ? (
            <>
              {/* Verdict banner */}
              <div style={{
                background: `${verdictColor(bootstrap.latest.verdict)}08`,
                border: `2px solid ${verdictColor(bootstrap.latest.verdict)}44`,
                borderRadius: 14, padding: "20px 28px", marginBottom: 20,
              }}>
                <div style={{ fontFamily: C.mono, fontSize: 28, fontWeight: 700, color: verdictColor(bootstrap.latest.verdict), marginBottom: 6 }}>
                  {bootstrap.latest.verdict}
                </div>
                <div style={{ color: C.sub, fontFamily: C.mono, fontSize: 13 }}>{bootstrap.latest.reason}</div>
                <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
                  <div style={{ color: C.dim, fontFamily: C.mono, fontSize: 11 }}>
                    p-value: <span style={{ color: C.text }}>{bootstrap.latest.pValue?.toFixed(4) ?? "—"}</span>
                  </div>
                  <div style={{ color: C.dim, fontFamily: C.mono, fontSize: 11 }}>
                    Strategy: <span style={{ color: C.cyan }}>{bootstrap.latest.strategyType}</span>
                  </div>
                  <div style={{ color: C.dim, fontFamily: C.mono, fontSize: 11 }}>
                    Trades: <span style={{ color: C.text }}>{bootstrap.latest.trades}</span>
                  </div>
                  <div style={{ color: C.dim, fontFamily: C.mono, fontSize: 11 }}>
                    Observed win rate: <span style={{ color: C.green }}>{((bootstrap.latest.observedWinRate ?? 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ color: C.dim, fontFamily: C.mono, fontSize: 11 }}>
                    Breakeven: <span style={{ color: C.yellow }}>{(bootstrap.latest.observedWinRate > (bootstrap.latest.pValue || 0) ? "✓" : "✗")} {((bootstrap.latest.pValue ?? 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Metrics row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                <Stat label="Trades Analyzed" value={bootstrap.latest.trades} color={C.cyan} />
                <Stat label="Observed Win Rate" value={`${((bootstrap.latest.observedWinRate ?? 0) * 100).toFixed(1)}%`}
                  color={C.green} />
                <Stat label="Payoff Ratio"
                  value={`${bootstrap.latest.ci95MeanPnl ? "" : "—"}`}
                  sub="Avg win / |Avg loss|"
                  color={C.orange} />
              </div>

              {/* CI visualization */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>95% Confidence Intervals</div>
                {[
                  { label: "Mean PnL", ci: bootstrap.latest.ci95MeanPnl },
                  { label: "Sharpe Ratio", ci: bootstrap.latest.ci95Sharpe },
                  { label: "Win Rate", ci: bootstrap.latest.ci95WinRate },
                ].map(item => item.ci ? (
                  <div key={item.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: C.mono, fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: C.sub }}>{item.label}</span>
                      <span style={{ color: C.green }}>{((item.ci?.[0]) ?? 0).toFixed(4)} – {((item.ci?.[1]) ?? 0).toFixed(4)}</span>
                    </div>
                    <div style={{ position: "relative", height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 5 }}>
                      <div style={{
                        position: "absolute", height: "100%", borderRadius: 5,
                        background: `${C.green}40`,
                        left: `${item.ci[0] * 100}%`,
                        width: `${(item.ci[1] - item.ci[0]) * 100}%`,
                      }} />
                      <div style={{
                        position: "absolute", height: "100%", width: 2, background: C.green,
                        left: `${((item.ci[1] + item.ci[0]) / 2) * 100}%`,
                      }} />
                    </div>
                  </div>
                ) : null)}
              </div>

              {/* History */}
              {bootstrap.history?.length > 0 && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Proof History</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {bootstrap.history.map((h: any, i: number) => (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "8px 10px", borderRadius: 6, background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${C.dim}11`,
                      }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <Badge text={h.verdict} color={verdictColor(h.verdict)} />
                          <span style={{ color: C.sub, fontFamily: C.mono, fontSize: 11 }}>
                            <ClientTimestamp dateStr={h.date} />
                          </span>
                          <span style={{ color: C.dim, fontFamily: C.mono, fontSize: 11 }}>
                            {h.trades} trades · p={h.pValue?.toFixed(4)}
                          </span>
                        </div>
                        <span style={{ color: C.dim, fontFamily: C.mono, fontSize: 10 }}>{h.file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, textAlign: "center" }}>
              <div style={{ color: C.sub, fontFamily: C.mono, fontSize: 14, marginBottom: 8 }}>No bootstrap validation yet</div>
              <div style={{ color: C.dim, fontFamily: C.mono, fontSize: 12 }}>Bootstrap validation runs weekly on shadow trade data</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
