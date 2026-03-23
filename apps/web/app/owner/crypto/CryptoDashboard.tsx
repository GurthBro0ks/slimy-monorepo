"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import "./crypto-dashboard.css";
import TradingTab from "./TradingTab";

const MOCK = {
  // Most data now from real APIs:
  // - Bot data from /api/owner/crypto/bot (NUC1)
  // - Wallets from /api/owner/crypto/wallets
  // - Farming from /api/owner/crypto/farming
  // - Logs from /api/owner/crypto/logs
  // Settings fallback values (used when DB has no settings)
  settings: { kelly_fraction: "0.20", max_position_pct: "0.05", min_edge: "0.05", max_drawdown: "0.30", max_concurrent: "10", min_position_usd: "1.00", farming_budget: "5.00", farming_mode: "dry_run", cron_interval: "*/10 * * * *", base_rpc: "https://mainnet.base.org", eth_rpc: "https://rpc.ankr.com/eth" },
};

const RD = {
  "Circuit Breaker": "Halts ALL trading when bankroll drops 30% from peak. At $99.66 → halt at $69.76. Manual reset required.",
  "Kelly Fraction": "Uses 20% of optimal bet size. ~80% growth with ~10% ruin risk.",
  "EV Threshold": "Min 5% edge to enter ANY trade. Below this, bot waits.",
  "Max Position %": "Hard cap: no trade >5% of bankroll ($4.98).",
  "Max Concurrent": "Max 10 positions. 50% max deployed.",
  "Min Position $": "Below $1, fees eat edge. Bot skips.",
  "Drawdown": "Distance from peak. Breaker trips at 30%.",
  "Positions": "3/10 filled. 70% capacity free.",
  "EV Estimate": "Probability-weighted expected value across active targets. Σ(est × probability%).",
  "Est. Gas Cost": "Total gas fees to farm all targets. Depends on network congestion.",
  "Active Targets": "Protocols worth farming. S=confirmed, A=season live, F=dead.",
  "Main Wallet": "Primary wallet balance across 9+ networks via RPC.",
  "Scanning": "Markets evaluated per cycle. Kalshi + crypto arb pairs.",
  "Farm Quality": "Activity diversity score. LOW→MEDIUM→HIGH based on 30-day activity.",
  "Bot Proofs": "JSON proof files per cycle. Immutable audit trail.",
  "Kelly Pipeline": "7-step gate: Signal → Circuit Breaker → Position Limit → Bayesian P() → EV ≥5% → Kelly Size → Execute. Any fail = skip.",
};

const GLOSSARY = [
  { term: "Kelly Criterion", def: "1956 formula for optimal bet sizing. We use 20% fractional Kelly." },
  { term: "Fractional Kelly", def: "15-25% of full Kelly. ~80% growth, ~10% blowup risk." },
  { term: "Expected Value (EV)", def: "EV = (prob × payout) - cost. Bot needs >5% to enter." },
  { term: "Bayesian Updating", def: "Adjusts probabilities after each trade. Gets smarter over time." },
  { term: "Circuit Breaker", def: "Emergency stop at 30% drawdown. All trading halts." },
  { term: "Sybil Detection", def: "AI to spot bot wallets. Your farmer randomizes to look human." },
  { term: "Wallet Narrative", def: "Your tx history as reputation. 6 months consistent > 6 days intensive." },
  { term: "DEX-CEX Arbitrage", def: "Buy DEX, sell CEX when prices differ. Bot needs >1% spread." },
  { term: "Paper Trading", def: "Simulated trading. No real money risked." },
  { term: "Shadow Mode", def: "Full analysis but paper execution only." },
  { term: "Airdrop Farming", def: "Using protocols before token launch. Quality > quantity in 2026." },
  { term: "TGE", def: "Token Generation Event — first token distribution." },
  { term: "Tier S / A / F", def: "S=confirmed, A=season live, F=dead/completed." },
  { term: "DexScreener", def: "DEX price aggregator used by bot." },
  { term: "RPC Endpoint", def: "Blockchain API URL. Bot uses fallbacks for reliability." },
];

const C = { bg: "#0a0612", card: "rgba(14,8,28,0.92)", border: "rgba(0,255,157,0.12)", green: "#00ff9d", pink: "#ff2d95", cyan: "#00e5ff", yellow: "#ffe700", red: "#ff3355", orange: "#ff8a2d", text: "#eee4ff", sub: "#c0b0e0", muted: "#9080b8", dim: "#5a4a7a", mono: "'JetBrains Mono',monospace", sans: "'Space Grotesk',sans-serif" };

// ─── TOOLTIP — hover-persistent, positioned near trigger ─────
const Tip = ({ term, text, children }) => {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, above: false });
  const triggerRef = useRef(null);
  const timerRef = useRef(null);

  const open = useCallback(() => {
    clearTimeout(timerRef.current);
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const above = window.innerHeight - r.bottom < 240;
      setPos({ top: above ? r.top - 12 : r.bottom + 12, left: Math.min(Math.max(r.left, 170), window.innerWidth - 170), above });
    }
    setShow(true);
  }, []);

  const startClose = useCallback(() => {
    timerRef.current = setTimeout(() => setShow(false), 250);
  }, []);

  const cancelClose = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <span ref={triggerRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={open} onMouseLeave={startClose}>
      {children}
      <span style={{ marginLeft: 5, cursor: "help", fontSize: 10, color: C.pink, border: `1px solid ${C.pink}66`, borderRadius: 10, width: 15, height: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700 }}>?</span>
      {show && (
        <div onMouseEnter={cancelClose} onMouseLeave={startClose} style={{
          position: "fixed",
          top: pos.above ? undefined : pos.top,
          bottom: pos.above ? `${window.innerHeight - pos.top}px` : undefined,
          left: pos.left, transform: "translateX(-50%)",
          width: 320, padding: "16px 18px", background: "#1c0e38", border: `1px solid ${C.pink}55`, borderRadius: 10,
          fontSize: 13, lineHeight: 1.7, color: C.text, zIndex: 9999,
          boxShadow: `0 8px 40px rgba(255,45,149,0.25)`,
        }}>
          <div style={{ fontSize: 11, color: C.pink, fontWeight: 700, marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: C.mono }}>{term || "Info"}</div>
          <div style={{ color: "#eee4ff" }}>{text}</div>
        </div>
      )}
    </span>
  );
};

// ─── UI PRIMITIVES ───────────────────────────────────────────
const Card = ({ children, s = {} }) => <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", ...s }}>{children}</div>;
const Head = ({ children, right }) => <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 14, fontWeight: 700, color: C.cyan, letterSpacing: 2.5, textTransform: "uppercase", fontFamily: C.mono }}>{children}</span>{right && <span suppressHydrationWarning style={{ fontSize: 12, color: C.green, fontFamily: C.mono }}>{right}</span>}</div>;
const Stat = ({ label, value, sub, color = C.green, desc }) => (
  <div style={{ background: C.card, border: `1px solid ${color}22`, borderRadius: 12, padding: "16px 20px" }}>
    <div style={{ fontSize: 13, color: C.green, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: C.mono, marginBottom: 4, fontWeight: 600 }}>{desc ? <Tip term={label} text={desc}>{label}</Tip> : label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: C.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>{sub}</div>}
  </div>
);
const Bar = ({ label, val, max, unit = "", color = C.green, desc }) => {
  const p = Math.min(Math.max((val / max) * 100, 0), 100);
  return <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.sub, marginBottom: 4, fontFamily: C.mono }}><span>{desc ? <Tip term={label} text={desc}>{label}</Tip> : label}</span><span style={{ color: C.text }}>{typeof val === "number" ? (Number.isInteger(val) ? val : val.toFixed(1)) : val}{unit} / {max}{unit}</span></div>
    <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${p}%`, background: color, borderRadius: 3, transition: "width 0.5s" }} /></div>
  </div>;
};

// ─── MAIN ────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [d] = useState(MOCK);
  const [now, setNow] = useState(new Date());
  const [, _setExpanded] = useState(null);
  const [, _setScanSt] = useState({});
  const [, _setNewAddr] = useState(""); const [, _setNewLbl] = useState("");
  const [, _setWallets] = useState<any[]>([]); // Now from API
  const [, _setLogCat] = useState("trading");
  const [edits, setEdits] = useState({});
  const [gFilter, setGFilter] = useState(""); const [gHover, setGHover] = useState(null);

  // Airdrop state — real data from API
  const [airdrops, setAirdrops] = useState<any[]>([]);
  const [airdropsLoading, setAirdropsLoading] = useState(false);
  const [expandedAirdrop, setExpandedAirdrop] = useState<string | null>(null);
  const [, _setCalendarData] = useState<Record<string, any[]>>({});
  const [, _setCalendarYear] = useState(new Date().getFullYear());
  const [, _setCalendarMonth] = useState(new Date().getMonth() + 1);

  // Completion modal state
  const [completionModal, setCompletionModal] = useState<{ taskId: string; airdropId: string; taskName: string } | null>(null);
  const [completionTxLink, setCompletionTxLink] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionSubmitting, setCompletionSubmitting] = useState(false);

  // Add airdrop modal state
  const [showAddAirdrop, setShowAddAirdrop] = useState(false);
  const [newAirdrop, setNewAirdrop] = useState({ protocol: "", token: "", tier: "B", status: "EXPLORING", frequency: "daily", notes: "" });

  // Task management state
  const [_addingTaskFor, setAddingTaskFor] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskFrequency, setNewTaskFrequency] = useState("daily");
  const [newTaskBotKey, setNewTaskBotKey] = useState("");
  const [editingTask, setEditingTask] = useState<{ taskId: string; airdropId: string; name: string; frequency: string; botActionKey?: string } | null>(null);
  const [_taskSaving, setTaskSaving] = useState(false);

  // Airdrop edit state
  const [editingAirdrop, setEditingAirdrop] = useState<any | null>(null);
  const [_airdropSaving, setAirdropSaving] = useState(false);

  // Dashboard settings state
  const [dashSettings, setDashSettings] = useState<any>(null);
  const [dashSettingsLoading, setDashSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Wallet balance state
  const [walletData, setWalletData] = useState<any>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  // Farming stats state
  const [farmingStats, setFarmingStats] = useState<any>(null);
  const [farmingLoading, setFarmingLoading] = useState(false);

  // Logs state
  const [logsData, setLogsData] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsCategory, setLogsCategory] = useState("all");

  // Bot data from NUC1 via proxy API
  const [botData, setBotData] = useState<any>(null);
  const [botLoading, setBotLoading] = useState(false);
  const [botError, setBotError] = useState<string | null>(null);

  // Bot sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Fetch functions
  const fetchAirdrops = async () => {
    setAirdropsLoading(true);
    try {
      const res = await fetch("/api/owner/airdrops", { credentials: "include" });
      const data = await res.json();
      setAirdrops(data.airdrops || []);
    } catch (err) {
      console.error("Failed to fetch airdrops:", err);
    } finally {
      setAirdropsLoading(false);
    }
  };

  const fetchCalendar = async (year: number, month: number) => {
    try {
      const res = await fetch(`/api/owner/airdrops/calendar?year=${year}&month=${month}`, { credentials: "include" });
      const data = await res.json();
      setCalendarData(data.days || {});
    } catch (err) {
      console.error("Failed to fetch calendar:", err);
    }
  };

  const syncBotData = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/owner/crypto/sync-bot", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      setSyncResult(data);
      // Refresh airdrops and calendar after sync
      fetchAirdrops();
      fetchCalendar(calendarYear, calendarMonth);
    } catch (err) {
      console.error("Sync failed:", err);
      setSyncResult({ error: "Sync failed" });
    } finally {
      setSyncing(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch("/api/owner/airdrops/export", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `slimy-completions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export error:", err);
    }
  };

  const submitCompletion = async () => {
    if (!completionModal) return;
    setCompletionSubmitting(true);
    try {
      const body: any = { source: "manual" };
      if (completionTxLink.trim()) body.txLink = completionTxLink.trim();
      if (completionNotes.trim()) body.notes = completionNotes.trim();

      const res = await fetch(
        `/api/owner/airdrops/${completionModal.airdropId}/tasks/${completionModal.taskId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.completion) {
        setCompletionModal(null);
        setCompletionTxLink("");
        setCompletionNotes("");
        fetchAirdrops();
        fetchCalendar(calendarYear, calendarMonth);
      } else {
        alert(data.error || "Failed to log completion");
      }
    } catch (err) {
      console.error("Completion failed:", err);
    } finally {
      setCompletionSubmitting(false);
    }
  };

  const createAirdrop = async () => {
    if (!newAirdrop.protocol || !newAirdrop.token) {
      alert("Protocol and token are required");
      return;
    }
    try {
      const res = await fetch("/api/owner/airdrops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAirdrop),
        credentials: "include",
      });
      const data = await res.json();
      if (data.airdrop) {
        setShowAddAirdrop(false);
        setNewAirdrop({ protocol: "", token: "", tier: "B", status: "EXPLORING", frequency: "daily", notes: "" });
        fetchAirdrops();
      }
    } catch (err) {
      console.error("Create airdrop failed:", err);
    }
  };

  const _createTask = async (airdropId: string) => {
    if (!newTaskName.trim()) return;
    setTaskSaving(true);
    try {
      const body: any = { name: newTaskName.trim(), frequency: newTaskFrequency };
      if (newTaskBotKey.trim()) body.botActionKey = newTaskBotKey.trim();

      const res = await fetch(`/api/owner/airdrops/${airdropId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json();
      if (data.task) {
        setNewTaskName("");
        setNewTaskFrequency("daily");
        setNewTaskBotKey("");
        setAddingTaskFor(null);
        fetchAirdrops();
      } else {
        alert(data.error || "Failed to create task");
      }
    } catch (err) {
      console.error("Create task failed:", err);
    } finally {
      setTaskSaving(false);
    }
  };

  const _updateTask = async () => {
    if (!editingTask) return;
    setTaskSaving(true);
    try {
      const res = await fetch(
        `/api/owner/airdrops/${editingTask.airdropId}/tasks/${editingTask.taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editingTask.name, frequency: editingTask.frequency }),
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.task) {
        setEditingTask(null);
        fetchAirdrops();
      } else {
        alert(data.error || "Failed to update task");
      }
    } catch (err) {
      console.error("Update task failed:", err);
    } finally {
      setTaskSaving(false);
    }
  };

  const _deleteTask = async (airdropId: string, taskId: string, taskName: string) => {
    if (!window.confirm(`Delete task "${taskName}"? This will also delete all its completions.`)) return;
    try {
      const res = await fetch(`/api/owner/airdrops/${airdropId}/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        fetchAirdrops();
      }
    } catch (err) {
      console.error("Delete task failed:", err);
    }
  };

  const updateAirdrop = async () => {
    if (!editingAirdrop) return;
    setAirdropSaving(true);
    try {
      const res = await fetch(`/api/owner/airdrops/${editingAirdrop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocol: editingAirdrop.protocol,
          token: editingAirdrop.token,
          tier: editingAirdrop.tier,
          status: editingAirdrop.status,
          frequency: editingAirdrop.frequency,
          notes: editingAirdrop.notes,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.airdrop) {
        setEditingAirdrop(null);
        fetchAirdrops();
      } else {
        alert(data.error || "Failed to update airdrop");
      }
    } catch (err) {
      console.error("Update airdrop failed:", err);
    } finally {
      setAirdropSaving(false);
    }
  };

  const deleteAirdrop = async (id: string, protocol: string) => {
    if (!window.confirm(`Delete "${protocol}" and ALL its tasks and completions? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/owner/airdrops/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        if (expandedAirdrop === id) setExpandedAirdrop(null);
        fetchAirdrops();
      }
    } catch (err) {
      console.error("Delete airdrop failed:", err);
    }
  };

  const fetchDashSettings = async () => {
    setDashSettingsLoading(true);
    try {
      const res = await fetch("/api/owner/crypto/settings", { credentials: "include" });
      const data = await res.json();
      setDashSettings(data.settings || null);
    } catch (err) {
      console.error("Failed to fetch dashboard settings:", err);
    } finally {
      setDashSettingsLoading(false);
    }
  };

  const saveDashSettings = async (updates: Record<string, any>) => {
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/owner/crypto/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      const data = await res.json();
      if (data.settings) {
        setDashSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSettingsSaving(false);
    }
  };

  const fetchWallets = async () => {
    setWalletLoading(true);
    try {
      const res = await fetch("/api/owner/crypto/wallets", { credentials: "include" });
      const data = await res.json();
      setWalletData(data);
    } catch (err) {
      console.error("Failed to fetch wallets:", err);
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchFarmingStats = async () => {
    setFarmingLoading(true);
    try {
      const res = await fetch("/api/owner/crypto/farming", { credentials: "include" });
      const data = await res.json();
      setFarmingStats(data);
    } catch (err) {
      console.error("Failed to fetch farming stats:", err);
    } finally {
      setFarmingLoading(false);
    }
  };

  const fetchLogs = async (category: string = "all") => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/owner/crypto/logs?category=${category}&limit=50`, { credentials: "include" });
      const data = await res.json();
      let logs = data.logs || [];

      // Merge bot farming log if category is "all" or "bot"
      if ((category === "all" || category === "bot") && botData?.farmingLog?.actions?.length > 0) {
        const botLogs = botData.farmingLog.actions.map((action: any, i: number) => ({
          id: `bot-${i}`,
          category: "bot",
          timestamp: action.timestamp || action.date || action.created_at || new Date().toISOString(),
          message: `Bot: ${action.type || action.protocol || JSON.stringify(action).slice(0, 80)}`,
          details: action,
        }));
        logs = [...logs, ...botLogs];
      }

      // Sort by timestamp descending
      logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setLogsData(logs.slice(0, 50));
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchBotData = async () => {
    setBotLoading(true);
    setBotError(null);
    try {
      const res = await fetch("/api/owner/crypto/bot", { credentials: "include" });
      const data = await res.json();
      setBotData(data);
      if (data.health?.error || data.trading?.error) {
        setBotError("Some bot data unavailable");
      }
    } catch (err) {
      console.error("Failed to fetch bot data:", err);
      setBotError("Bot API unreachable");
    } finally {
      setBotLoading(false);
    }
  };

  // Load data when airdrops tab is active
  useEffect(() => {
    if (tab === "airdrops") {
      fetchAirdrops();
      fetchCalendar(calendarYear, calendarMonth);
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "airdrops") {
      fetchCalendar(calendarYear, calendarMonth);
    }
  }, [calendarYear, calendarMonth]);

  // Load dashboard settings when settings tab is active
  useEffect(() => {
    if (tab === "settings" && !dashSettings) {
      fetchDashSettings();
    }
  }, [tab]);

  // Load settings on mount (for Overview tab later)
  useEffect(() => {
    fetchDashSettings();
    fetchBotData();
  }, []);

  // Refresh bot data periodically (every 60s)
  useEffect(() => {
    const interval = setInterval(fetchBotData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load overview data when overview tab is active
  useEffect(() => {
    if (tab === "overview") {
      fetchWallets();
      fetchFarmingStats();
    }
  }, [tab]);

  // Load logs when logs tab is active
  useEffect(() => {
    if (tab === "logs") {
      fetchLogs(logsCategory);
    }
  }, [tab, logsCategory]);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  // Calculate total from real wallet data
  const _all$ = walletData?.wallets ? walletData.wallets.reduce((sum: number, w: any) => sum + w.chains.reduce((s: number, c: any) => s + (parseFloat(c.balance) || 0), 0), 0) : 0;
  const _pC = (botData?.trading?.bankroll?.pnl || 0) >= 0 ? C.green : C.red;
  const _mx = 1; // Not used anymore - wallet data shows each chain separately
  const _act = airdrops.filter(a => a.tier !== "F");
  const _evL = _act.reduce((s, a) => s + a.est_low * (a.probability / 100), 0);
  const _evH = _act.reduce((s, a) => s + a.est_high * (a.probability / 100), 0);
  const scan = (p) => { _setScanSt(s => ({ ...s, [p]: "scanning" })); setTimeout(() => _setScanSt(s => ({ ...s, [p]: Math.random() > .3 ? "eligible" : "unknown" })), 1400); };
  const _scanAll = () => _act.forEach((a, i) => setTimeout(() => scan(a.protocol), i * 700));
  const tabs = [{ id: "overview", l: "Overview", i: "◈" }, { id: "airdrops", l: "Airdrops", i: "◎" }, { id: "risk", l: "Risk", i: "△" }, { id: "logs", l: "Logs", i: "▤" }, { id: "howto", l: "How-To", i: "📖" }, { id: "trading", l: "Trading", i: "📈" }, { id: "settings", l: "Settings", i: "⚙" }];
  const _chainColors = { Base: C.cyan, ETH: C.green, Linea: C.pink, Monad: C.orange, Optimism: C.red };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: C.sans, width: "100%", maxWidth: 1240, margin: "0 auto" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${C.dim};border-radius:2px}input,select{background:rgba(255,255,255,0.06);border:1px solid ${C.dim};color:#f0e8ff;padding:10px 14px;border-radius:7px;font-family:${C.mono};font-size:13px;outline:none}input:focus,select:focus{border-color:${C.pink}}button{cursor:pointer;font-family:${C.mono}}a{color:${C.cyan};text-decoration:none}a:hover{color:${C.green}}`}</style>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200, background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.02) 3px,rgba(0,0,0,0.02) 6px)" }} />

      <header style={{ padding: "14px 0", borderBottom: `1px solid ${C.pink}22`, background: "rgba(10,6,18,0.95)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 28 }}>🐌</span><div><div style={{ fontSize: 24, fontWeight: 700, fontFamily: C.mono }}><span style={{ color: C.green }}>slimy</span><span style={{ color: C.pink }}>.</span><span style={{ color: C.cyan }}>crypto</span></div><div style={{ fontSize: 10, color: C.muted, letterSpacing: 3, textTransform: "uppercase" }}>Command Center v1.0</div></div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="https://slimyai.xyz" style={{ fontSize: 11, color: C.cyan, fontFamily: C.mono, padding: "5px 12px", border: `1px solid ${C.cyan}33`, borderRadius: 5 }}>🏠 Menu</a>
            <a href="https://slimyai.xyz/chat" style={{ fontSize: 11, color: C.green, fontFamily: C.mono, padding: "5px 12px", border: `1px solid ${C.green}33`, borderRadius: 5 }}>💬 Chat</a>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: `${botData?.trading?.mode === "live" ? C.green : C.yellow}0c`, borderRadius: 5, border: `1px solid ${botData?.trading?.mode === "live" ? C.green : C.yellow}22` }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: botData?.health?.ok ? C.green : C.red, animation: "pulse 2s infinite" }} /><span style={{ fontSize: 11, color: botData?.trading?.mode === "live" ? C.green : C.yellow, fontWeight: 700, fontFamily: C.mono }}>{botData?.trading?.mode?.toUpperCase() || "OFFLINE"}</span></div>
            <span style={{ fontSize: 11, color: C.muted, fontFamily: C.mono }} suppressHydrationWarning>{now.toLocaleTimeString()}</span>
          </div>
        </div>
      </header>

      <nav className="crypto-tab-bar" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(10,6,18,0.7)" }}><div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "center", gap: 2 }}>{tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "12px 18px", fontSize: 12, fontWeight: 600, border: "none", background: tab === t.id ? `${C.green}0c` : "transparent", color: tab === t.id ? C.green : C.muted, borderBottom: tab === t.id ? `2px solid ${C.green}` : "2px solid transparent", letterSpacing: 1 }}><span style={{ marginRight: 5, opacity: .6 }}>{t.i}</span>{t.l}</button>)}</div></nav>

      <main className="crypto-dashboard-root" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>

        {/* OVERVIEW */}
        {tab === "overview" && <div style={{ animation: "fadeUp 0.3s" }}>
          {/* Top stats row - mix of real and mock */}
          <div style={{ background: `linear-gradient(135deg,${C.green}0a,${C.cyan}0a)`, border: `1px solid ${C.green}1a`, borderRadius: 12, padding: "18px 24px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 2, textTransform: "uppercase" }}>Total All Wallets</div>
              {walletLoading ? (
                <div style={{ fontSize: 36, fontWeight: 700, color: C.sub, fontFamily: C.mono }}>Loading...</div>
              ) : walletData?.wallets?.length > 0 ? (
                <div style={{ fontSize: 36, fontWeight: 700, color: C.green, fontFamily: C.mono }}>
                  ${(walletData?.wallets ?? []).reduce((sum: number, w: any) => sum + (w.chains ?? []).reduce((s: number, c: any) => s + (parseFloat(c.balance) || 0), 0), 0).toFixed(2)}
                </div>
              ) : (
                <div style={{ fontSize: 36, fontWeight: 700, color: C.sub, fontFamily: C.mono }}>$0.00</div>
              )}
              <div style={{ fontSize: 13, color: C.sub }}>{walletData?.wallets?.length || 0} wallets • ETH + Base</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono }}>Trading Bot <span style={{ fontSize: 10, color: botData?.health?.ok ? C.green : C.dim }}>{botData?.health?.ok ? "● HEALTHY" : "○ DEGRADED"}</span></div>
              {botLoading && !botData ? (
                <div style={{ fontSize: 24, fontWeight: 700, color: C.sub, fontFamily: C.mono }}>Connecting...</div>
              ) : botData?.trading ? (
                <>
                  <div style={{ fontSize: 24, fontWeight: 700, color: C.green, fontFamily: C.mono }}>${botData.trading.bankroll?.total?.toFixed(2) || "—"}</div>
                  <div style={{ fontSize: 12, color: (botData.trading.bankroll?.pnl || 0) >= 0 ? C.green : C.red }}>
                    {(botData.trading.bankroll?.pnl || 0) >= 0 ? "+" : ""}{botData.trading.bankroll?.pnl?.toFixed(2) || "0.00"} ({botData.trading.bankroll?.pnl_pct || 0}%)
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 24, fontWeight: 700, color: C.dim, fontFamily: C.mono }}>Not connected</div>
              )}
            </div>
          </div>

          {/* Stats row - 4 cards */}
          <div className="crypto-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
            <Stat
              label="Main Wallet"
              value={walletLoading ? "..." : walletData?.wallets?.[0]?.chains?.[0]?.balance ? parseFloat(walletData.wallets[0].chains[0].balance).toFixed(4) : "0.0000"}
              sub={walletData?.wallets?.[0]?.chains?.[0]?.error ? "RPC error" : (walletData?.wallets?.[0]?.address ? `${walletData.wallets[0].address.slice(0, 8)}...` : "No wallet configured")}
              color={walletData?.wallets?.[0]?.chains?.[0]?.error ? C.red : C.cyan}
              desc={RD["Main Wallet"]}
            />
            <Stat label="Scanning" value={botData?.trading?.mode ? "Active" : "—"} sub={botData?.trading?.mode ? `Mode: ${botData.trading.mode}` : "Not connected"} color={C.sub} desc={RD["Scanning"]} />
            <Stat
              label="Farm Quality"
              value={farmingLoading ? "..." : (farmingStats?.farming?.quality || "N/A")}
              sub={farmingStats?.farming ? `${farmingStats.farming.dailyTasksDoneToday}/${farmingStats.farming.dailyTasks} daily` : "Loading..."}
              color={farmingStats?.farming?.quality === "HIGH" ? C.green : farmingStats?.farming?.quality === "MEDIUM" ? C.yellow : farmingStats?.farming?.quality === "LOW" ? C.orange : C.sub}
              desc={RD["Farm Quality"]}
            />
            <Stat
              label="Bot Mode"
              value={botData?.trading?.mode ? botData.trading.mode.toUpperCase() : "—"}
              sub={botData?.trading?.positions?.length || 0}
              color={botData?.trading?.mode === "paper" ? C.yellow : botData?.trading?.mode === "live" ? C.green : C.sub}
              desc="Trading mode: paper (simulated) or live"
            />
          </div>

          {/* Wallet and Portfolio row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            {/* Trading Bot Status */}
            <Card>
              <Head right={botData?.fetchedAt ? new Date(botData.fetchedAt).toLocaleTimeString() : ""}>
                Trading Bot
              </Head>
              <div style={{ padding: "12px 20px" }}>
                {botLoading && !botData ? (
                  <div style={{ color: C.sub, padding: 20 }}>Connecting to bot...</div>
                ) : botError && !botData ? (
                  <div style={{ color: C.red, padding: 20 }}>{botError}</div>
                ) : botData?.trading ? (
                  <>
                    {/* Bankroll cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      <div style={{ textAlign: "center", padding: 10, background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.green }}>${botData.trading.bankroll?.total?.toFixed(2) || "—"}</div>
                        <div style={{ fontSize: 10, color: C.sub }}>Total</div>
                      </div>
                      <div style={{ textAlign: "center", padding: 10, background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: (botData.trading.bankroll?.pnl || 0) >= 0 ? C.green : C.red }}>
                          {(botData.trading.bankroll?.pnl || 0) >= 0 ? "+" : ""}{botData.trading.bankroll?.pnl?.toFixed(2) || "0.00"}
                        </div>
                        <div style={{ fontSize: 10, color: C.sub }}>P&L</div>
                      </div>
                    </div>
                    {/* Active phases */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>Active Phases</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {Object.entries(botData.trading.phases || {}).map(([phase, active]: [string, any]) => (
                          <span key={phase} style={{
                            fontSize: 10, padding: "3px 8px", borderRadius: 4, fontFamily: C.mono,
                            background: active ? `${C.green}18` : "rgba(0,0,0,0.3)",
                            color: active ? C.green : C.dim,
                            border: active ? `1px solid ${C.green}33` : "1px solid transparent"
                          }}>
                            {phase.replace(/^\d+_/, "")} {active ? "●" : "○"}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Pending signals */}
                    {botData.signals?.pending?.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>Pending Signals</div>
                        {botData.signals.pending.map((s: any, i: number) => (
                          <div key={i} style={{ fontSize: 11, color: C.yellow, padding: "2px 0" }}>
                            {typeof s === "string" ? s : JSON.stringify(s).slice(0, 60)}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Recent trades */}
                    {botData.trading.recentTrades?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>Recent Trades</div>
                        {botData.trading.recentTrades.slice(0, 3).map((t: any, i: number) => (
                          <div key={i} style={{ fontSize: 11, color: C.text, padding: "2px 0", fontFamily: C.mono }}>
                            {t.symbol || t.market || "?"} — {t.side || t.action || "?"}
                          </div>
                        ))}
                      </div>
                    )}
                    {botData.trading.recentTrades?.length === 0 && !botData.signals?.pending?.length && (
                      <div style={{ fontSize: 12, color: C.dim }}>No recent activity</div>
                    )}
                  </>
                ) : (
                  <div style={{ color: C.sub, padding: 20 }}>Bot not connected. Check NUC1 API.</div>
                )}
              </div>
            </Card>

            {/* All Wallets - real data */}
            <Card><Head right={walletData?.timestamp ? new Date(walletData.timestamp).toLocaleTimeString() : ""}>All Wallets</Head>
              <div style={{ padding: "12px 20px" }}>
                {walletLoading ? (
                  <div style={{ color: C.sub, padding: 20 }}>Loading wallet data...</div>
                ) : walletData?.wallets?.length > 0 ? (
                  <>
                    {walletData.wallets.map((w: any, i: number) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 13, color: C.pink, fontWeight: 700, marginBottom: 4, fontFamily: C.mono }}>★ {w.label}: {w.address.slice(0, 10)}...</div>
                        {w.chains.map((c: any, j: number) => (
                          <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", paddingLeft: 10 }}>
                            <span style={{ fontSize: 12, color: c.chain === "ethereum" ? C.green : C.cyan, minWidth: 60, fontFamily: C.mono }}>{c.chain === "ethereum" ? "ETH" : "Base"}</span>
                            {c.error ? (
                              <span style={{ fontSize: 11, color: C.red }}>RPC error</span>
                            ) : (
                              <>
                                <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${Math.min(parseFloat(c.balance) * 10, 100)}%`, background: `linear-gradient(90deg,${C.cyan},${C.green})`, borderRadius: 2 }} />
                                </div>
                                <span style={{ fontSize: 12, color: C.text, minWidth: 70, textAlign: "right", fontFamily: C.mono }}>{(parseFloat(c.balance) || 0).toFixed(4)} ETH</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ color: C.sub, padding: 10 }}>No wallets configured. Add addresses in Settings.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Farming activity section - real data */}
          {farmingStats?.farming && (
            <Card style={{ marginBottom: 14 }}>
              <Head right={`Streak: ${farmingStats.farming.streak} days`}>Farming Activity</Head>
              <div style={{ padding: "12px 20px" }}>
                <div className="crypto-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 12 }}>
                  <div style={{ textAlign: "center", padding: 8, background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: farmingStats.farming.quality === "HIGH" ? C.green : farmingStats.farming.quality === "MEDIUM" ? C.yellow : C.orange }}>{farmingStats.farming.quality}</div>
                    <div style={{ fontSize: 10, color: C.sub }}>Quality</div>
                  </div>
                  <div style={{ textAlign: "center", padding: 8, background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.cyan }}>{farmingStats.farming.streak}</div>
                    <div style={{ fontSize: 10, color: C.sub }}>Day Streak</div>
                  </div>
                  <div style={{ textAlign: "center", padding: 8, background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{farmingStats.farming.dailyTasksDoneToday}/{farmingStats.farming.dailyTasks}</div>
                    <div style={{ fontSize: 10, color: C.sub }}>Daily Tasks</div>
                  </div>
                  <div style={{ textAlign: "center", padding: 8, background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.purple }}>{farmingStats.farming.weeklyActions}</div>
                    <div style={{ fontSize: 10, color: C.sub }}>This Week</div>
                  </div>
                </div>
                {farmingStats.recentCompletions?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>Recent Activity</div>
                    {farmingStats.recentCompletions.map((c: any) => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12, borderBottom: `1px solid ${C.border}22` }}>
                        <span><span style={{ color: C.green }}>{c.protocol}</span>: {c.taskName}</span>
                        <span suppressHydrationWarning style={{ color: C.dim }}>{new Date(c.completedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Bot Phases - real data from NUC1 */}
          {botData?.trading && (
            <Card>
              <Head right={botData?.trading?.timestamp ? new Date(botData.trading.timestamp).toLocaleTimeString() : ""}>
                Bot Status
              </Head>
              <div style={{ padding: "10px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div style={{ textAlign: "center", padding: 10, background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: botData.trading.mode === "paper" ? C.yellow : botData.trading.mode === "live" ? C.green : C.sub }}>
                      {botData.trading.mode?.toUpperCase() || "—"}
                    </div>
                    <div style={{ fontSize: 10, color: C.sub }}>Mode</div>
                  </div>
                  <div style={{ textAlign: "center", padding: 10, background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: botData.health?.ok ? C.green : C.red }}>
                      {botData.health?.ok ? "HEALTHY" : "DEGRADED"}
                    </div>
                    <div style={{ fontSize: 10, color: C.sub }}>Health</div>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>Active Phases</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {Object.entries(botData.trading.phases || {}).map(([phase, active]: [string, any]) => (
                      <span key={phase} style={{
                        fontSize: 12, padding: "4px 10px", borderRadius: 5, fontFamily: C.mono,
                        background: active ? `${C.green}18` : "rgba(0,0,0,0.3)",
                        color: active ? C.green : C.dim,
                        border: active ? `1px solid ${C.green}33` : "1px solid transparent"
                      }}>
                        {phase.replace(/^\d+_/, "")}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Bot farming stats from NUC1 */}
                {botData?.farming?.stats && (
                  <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: 10, marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: C.pink, marginBottom: 6 }}>Bot Farming (NUC1)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, fontSize: 11 }}>
                      <div>
                        <span style={{ color: C.dim }}>Weekly:</span>{" "}
                        <span style={{ color: C.text }}>${botData?.farming?.stats?.weekly_spend_usd?.toFixed(2) || "0"}</span>
                      </div>
                      <div>
                        <span style={{ color: C.dim }}>Actions:</span>{" "}
                        <span style={{ color: C.text }}>{botData?.farming?.stats?.total_actions || 0}</span>
                      </div>
                      <div>
                        <span style={{ color: C.dim }}>Protocols:</span>{" "}
                        <span style={{ color: C.text }}>{botData?.farming?.stats?.unique_protocols_30d || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
          {!botData?.trading && (
            <Card>
              <Head>Bot Status</Head>
              <div style={{ padding: 20, textAlign: "center", color: C.dim }}>
                {botLoading ? "Connecting to bot..." : "Bot not connected. Check NUC1 API server."}
              </div>
            </Card>
          )}
        </div>}

        {/* AIRDROPS */}

        {/* AIRDROPS */}
        {tab === "airdrops" && <div style={{ animation: "fadeUp 0.3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h2 className="crypto-section-title" style={{ color: C.green, fontSize: 20, fontWeight: 700 }}>Active Airdrops</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={syncBotData}
                disabled={syncing}
                style={{ padding: "8px 16px", background: syncing ? "#374151" : C.cyan, color: "white", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 6, cursor: syncing ? "not-allowed" : "pointer", opacity: syncing ? 0.6 : 1 }}
              >
                {syncing ? "⟳ Syncing..." : "⟳ Sync Bot"}
              </button>
              <button
                onClick={handleExportCSV}
                style={{ padding: "8px 16px", background: "#15803d", color: "white", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                ⬇ Export CSV
              </button>
              <button
                onClick={() => setShowAddAirdrop(true)}
                style={{ padding: "8px 16px", background: C.pink, color: "white", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                + Add Airdrop
              </button>
            </div>
          </div>

          {syncResult && (
            <div style={{
              marginBottom: 16,
              padding: "12px 16px",
              borderRadius: 8,
              background: syncResult.error ? "rgba(127, 29, 29, 0.3)" : syncResult.synced > 0 ? "rgba(22, 101, 52, 0.3)" : "rgba(55, 65, 81, 0.3)",
              border: `1px solid ${syncResult.error ? "#7f1d1d" : syncResult.synced > 0 ? "#166534" : "#374151"}`,
              color: syncResult.error ? "#fca5a5" : syncResult.synced > 0 ? "#86efac" : "#d1d5db",
              fontSize: 13,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span>
                {syncResult.error ? syncResult.error : (
                  <>
                    Synced {syncResult.synced} new completions
                    {syncResult.skipped > 0 && <span style={{ marginLeft: 8 }}>• {syncResult.skipped} duplicates skipped</span>}
                    {syncResult.unmatched > 0 && <span style={{ marginLeft: 8 }}>• {syncResult.unmatched} unmatched</span>}
                  </>
                )}
              </span>
              <button
                onClick={() => setSyncResult(null)}
                style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16 }}
              >
                ×
              </button>
            </div>
          )}

          {airdropsLoading && <div style={{ color: C.sub, padding: 20 }}>Loading airdrops...</div>}
          {!airdropsLoading && airdrops.length === 0 && <div style={{ color: C.sub, padding: 20 }}>No airdrops yet</div>}
          {!airdropsLoading && airdrops.length > 0 && (
            <div className="crypto-table-scroll" style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
              <div className="crypto-airdrop-grid" style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 100px 80px 60px 80px", gap: 10, padding: "12px 20px", borderBottom: "1px solid " + C.border, fontSize: 11, color: C.muted, fontFamily: C.mono, fontWeight: 600, textTransform: "uppercase" }}>
                <span>Protocol</span>
                <span>Token</span>
                <span>Tier</span>
                <span>Status</span>
                <span>Frequency</span>
                <span>Tasks</span>
                <span>Action</span>
              </div>
              {airdrops.map((a) => (
                <div className="crypto-airdrop-grid" key={a.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 100px 80px 60px 80px", gap: 10, padding: "12px 20px", borderBottom: "1px solid " + C.border }}>
                  <span style={{ fontWeight: 600, color: C.text }}>{a.protocol}</span>
                  <span style={{ color: C.green }}>{a.token}</span>
                  <span style={{ fontWeight: 700, color: a.tier === "S" ? C.yellow : a.tier === "A" ? C.pink : a.tier === "B" ? C.cyan : C.dim }}>{a.tier}</span>
                  <span style={{ color: C.cyan, fontSize: 12 }}>{a.status}</span>
                  <span style={{ color: C.sub, fontSize: 12 }}>{a.frequency}</span>
                  <span style={{ color: C.sub, fontSize: 12 }}>{a.tasks ? a.tasks.length : 0}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => setEditingAirdrop({ id: a.id, protocol: a.protocol, token: a.token, tier: a.tier, status: a.status, frequency: a.frequency, notes: a.notes || "" })}
                      style={{ padding: "3px 8px", background: "#374151", color: "white", fontSize: 11, border: "none", borderRadius: 3, cursor: "pointer" }}
                      title="Edit airdrop"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAirdrop(a.id, a.protocol)}
                      style={{ padding: "3px 8px", background: "#7f1d1d", color: "white", fontSize: 11, border: "none", borderRadius: 3, cursor: "pointer" }}
                      title="Delete airdrop"
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}

        {/* RISK */}
        {tab === "risk" && <div style={{ animation: "fadeUp 0.3s" }}>
          {/* Bot Status from NUC1 */}
          {botData?.trading && (
            <div style={{ marginBottom: 18 }}>
              <h3 className="crypto-section-title" style={{ color: C.green, fontSize: 16, marginBottom: 12 }}>Bot Status (NUC1)</h3>
              <div className="crypto-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: botData.trading.mode === "paper" ? C.yellow : botData.trading.mode === "live" ? C.green : C.sub }}>
                    {botData.trading.mode?.toUpperCase() || "—"}
                  </div>
                  <div style={{ fontSize: 10, color: C.sub }}>Mode</div>
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: botData.health?.ok ? C.green : C.red }}>
                    {botData.health?.ok ? "HEALTHY" : "DEGRADED"}
                  </div>
                  <div style={{ fontSize: 10, color: C.sub }}>Health</div>
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.cyan }}>
                    {botData.trading.positions?.length || 0}
                  </div>
                  <div style={{ fontSize: 10, color: C.sub }}>Positions</div>
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                    ${botData.trading.bankroll?.total?.toFixed(0) || "0"}
                  </div>
                  <div style={{ fontSize: 10, color: C.sub }}>Bankroll</div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>Active Phases</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(botData.trading.phases || {}).map(([phase, active]: [string, any]) => (
                    <span key={phase} style={{
                      fontSize: 11, padding: "4px 10px", borderRadius: 5, fontFamily: C.mono,
                      background: active ? `${C.green}18` : "rgba(0,0,0,0.3)",
                      color: active ? C.green : C.dim,
                      border: active ? `1px solid ${C.green}33` : "1px solid transparent",
                      textDecoration: active ? "none" : "line-through"
                    }}>
                      {phase.replace(/^\d+_/, "")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
            <Stat label="Circuit Breaker" value={botData?.health?.ok !== false ? "✓ OK" : "⚡ TRIPPED"} sub={`Max drawdown: ${((dashSettings?.maxDrawdown || 0.3) * 100).toFixed(0)}%`} color={botData?.health?.ok !== false ? C.green : C.red} desc={RD["Circuit Breaker"]} />
            <Stat label="Kelly Fraction" value={`${(dashSettings?.kellyFraction || 0.2) * 100}%`} sub={`Max: ${((botData?.trading?.bankroll?.total || 100) * (dashSettings?.maxPositionPct || 0.05)).toFixed(2)}`} color={C.cyan} desc={RD["Kelly Fraction"]} />
            <Stat label="EV Threshold" value={`${(dashSettings?.minEdge || 0.05) * 100}%`} sub="Min edge" color={C.yellow} desc={RD["EV Threshold"]} />
          </div>
          <Card s={{ marginBottom: 16 }}><Head>Risk Parameters</Head><div style={{ padding: "16px 20px" }}><Bar label="Positions" val={botData?.trading?.positions?.length || 0} max={dashSettings?.maxConcurrent || 10} color={C.cyan} desc={RD["Positions"]} /><Bar label="Drawdown" val={Number(((1 - (botData?.trading?.bankroll?.total || 100) / 100) * 100).toFixed(1))} max={(dashSettings?.maxDrawdown || 0.3) * 100} unit="%" color={C.green} desc={RD["Drawdown"]} /><Bar label="Kelly" val={(dashSettings?.kellyFraction || 0.2) * 100} max={50} unit="%" color={C.cyan} desc={RD["Kelly Fraction"]} /><Bar label="Max Position" val={(dashSettings?.maxPositionPct || 0.05) * 100} max={20} unit="%" color={C.pink} desc={RD["Max Position %"]} /></div></Card>
          <Card><Head>Kelly Pipeline</Head><div style={{ padding: "16px 20px" }}><Tip term="Kelly Pipeline" text={RD["Kelly Pipeline"]}><div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", cursor: "help" }}>{["Signal", "→", "Breaker", "→", "Pos Limit", "→", "Bayes P()", "→", "EV ≥5%", "→", "Kelly", "→", "Execute"].map((s, i) => s === "→" ? <span key={i} style={{ color: C.dim, fontSize: 14 }}>→</span> : <div key={i} style={{ padding: "5px 10px", borderRadius: 5, fontSize: 11, fontWeight: 700, background: `${C.green}0a`, border: `1px solid ${C.green}1a`, color: C.green, fontFamily: C.mono }}>{s}</div>)}</div></Tip><div style={{ fontSize: 13, color: C.text, padding: "12px 16px", background: `${C.cyan}08`, border: `1px solid ${C.cyan}14`, borderRadius: 8, lineHeight: 1.7, marginTop: 14 }}>🐌 <strong style={{ color: C.cyan }}>Coach:</strong> 0.20x Kelly + 5% cap = max <strong style={{ color: C.green }}>$4.98/trade</strong>. Three losses = $14.94 (15%) — under 30% breaker.</div></div></Card>
        </div>}

        {/* LOGS */}
        {tab === "logs" && <div style={{ animation: "fadeUp 0.3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 className="crypto-section-title" style={{ color: C.green, fontSize: 20, fontWeight: 700 }}>Activity Logs</h2>
            <div style={{ display: "flex", gap: 4 }}>
              {["all", "airdrop", "bot", "system"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setLogsCategory(cat)}
                  style={{
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    border: "none",
                    background: logsCategory === cat ? `${C.green}14` : "transparent",
                    color: logsCategory === cat ? C.green : C.muted,
                    borderRadius: 6,
                    border: logsCategory === cat ? `1px solid ${C.green}33` : "1px solid transparent",
                  }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {logsLoading ? (
            <div style={{ color: C.sub, padding: 20, textAlign: "center" }}>Loading logs...</div>
          ) : logsData.length > 0 ? (
            <Card>
              <div style={{ padding: "12px 20px" }}>
                {logsData.map((log: any, i: number) => (
                  <div key={log.id || i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}44` }}>
                    <span style={{
                      fontSize: 10,
                      padding: "3px 8px",
                      borderRadius: 4,
                      fontFamily: C.mono,
                      fontWeight: 600,
                      whitespace: "nowrap",
                      background: log.category === "airdrop" ? `${C.green}22` : log.category === "bot" ? `${C.pink}22` : `${C.blue}22`,
                      color: log.category === "airdrop" ? C.green : log.category === "bot" ? C.pink : C.blue,
                    }}>
                      {log.category}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: C.text }}>{log.message}</span>
                    {log.details?.txLink && (
                      <a
                        href={log.details.txLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11, color: C.cyan, textDecoration: "none", whitespace: "nowrap" }}
                      >
                        TX ↗
                      </a>
                    )}
                    <span suppressHydrationWarning style={{ fontSize: 11, color: C.dim, whitespace: "nowrap" }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: C.muted, fontFamily: C.mono }}>— end —</div>
              </div>
            </Card>
          ) : (
            <Card>
              <div style={{ padding: 40, textAlign: "center", color: C.sub }}>
                No logs yet. Complete some airdrop tasks to see activity here.
              </div>
            </Card>
          )}
        </div>}

        {/* HOW-TO */}
        {tab === "howto" && <div style={{ animation: "fadeUp 0.3s" }}>
          <Card s={{ marginBottom: 16 }}><Head>Quick Start Guide</Head><div style={{ padding: "18px 22px", fontSize: 14, color: C.text, lineHeight: 1.9 }}><div style={{ color: C.pink, fontWeight: 700, fontFamily: C.mono, marginBottom: 8, fontSize: 14 }}>YOUR BOT IN 30 SECONDS:</div>{["Bot runs every 10 min on cron.", `Scans ${(d.scanner?.kalshi_series ?? 0).toLocaleString()} Kalshi + ${d.scanner?.crypto_pairs ?? '—'} crypto pairs.`, "5-gate Kelly pipeline on every trade.", "No edge ≥5%? Does nothing. Correct.", "Farms airdrops alongside trading.", `${(d.bot?.proofs ?? 0).toLocaleString()} JSON proofs generated.`].map((s, i) => <div key={i}><span style={{ color: C.green, fontWeight: 700 }}>{i + 1}.</span> {s}</div>)}<div style={{ marginTop: 12, color: C.yellow, fontWeight: 600 }}>SHADOW MODE — paper trading only.</div></div></Card>
          <Card s={{ marginBottom: 16 }}><Head>Key Instructions</Head><div style={{ padding: "18px 22px", fontSize: 14, color: C.text, lineHeight: 1.9 }}>{[{ t: "Trigger farming", s: ["/farm in Discord", "Default: dry run", "/farm --live for real", "/farm-status"] }, { t: "Go LIVE", s: ["Settings → Farm Mode → live", "≥0.05 ETH on Base", "Watch Logs → Airdrops", "Capped $5/wk"] }, { t: "Add wallet", s: ["Overview → All Wallets", "Paste 0x + label", "+Add"] }, { t: "Circuit Breaker trips", s: ["Don't panic", "Settings → Reset", "Check Logs → Trading", "Reset if normal"] }, { t: "Read Risk tab", s: ["Green = OK", "Yellow = watch", "Red = tripped", "(?) for details"] }].map((sec, i) => <div key={i} style={{ marginBottom: 18 }}><div style={{ color: C.pink, fontWeight: 700, fontFamily: C.mono, fontSize: 13, marginBottom: 6 }}>{sec.t.toUpperCase()}</div>{sec.s.map((s, j) => <div key={j} style={{ paddingLeft: 18 }}><span style={{ color: C.cyan, fontWeight: 700 }}>{j + 1}.</span> {s}</div>)}</div>)}</div></Card>
          <Card><Head right={`${GLOSSARY.length} terms`}>Glossary</Head><div style={{ padding: "14px 20px" }}><input value={gFilter} onChange={e => setGFilter(e.target.value)} placeholder="Search..." style={{ width: "100%", marginBottom: 14 }} />{GLOSSARY.filter(g => !gFilter || g.term.toLowerCase().includes(gFilter.toLowerCase()) || g.def.toLowerCase().includes(gFilter.toLowerCase())).map((g, i) => <div key={i} onMouseEnter={() => setGHover(g.term)} onMouseLeave={() => setGHover(null)} onClick={() => setGHover(gHover === g.term ? null : g.term)} style={{ padding: gHover === g.term ? "14px 16px" : "10px 0", borderBottom: `1px solid ${C.border}`, transition: "all 0.2s", background: gHover === g.term ? `${C.cyan}0c` : "transparent", borderRadius: gHover === g.term ? 8 : 0, margin: gHover === g.term ? "4px 0" : 0, cursor: "pointer", transform: gHover === g.term ? "scale(1.015)" : "" }}><div style={{ fontSize: gHover === g.term ? 17 : 14, fontWeight: 700, color: gHover === g.term ? C.green : C.cyan, fontFamily: C.mono, transition: "all 0.2s" }}>{g.term}</div><div style={{ fontSize: gHover === g.term ? 14 : 13, color: C.text, lineHeight: 1.6, marginTop: 3 }}>{g.def}</div></div>)}</div></Card>
        </div>}

        {/* SETTINGS */}
        {tab === "settings" && <div style={{ animation: "fadeUp 0.3s" }}>
          {dashSettingsLoading && !dashSettings ? (
            <div style={{ padding: 40, textAlign: "center", color: C.sub }}>Loading settings...</div>
          ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Card><Head>Risk Management</Head><div style={{ padding: "16px 20px" }}>{[{ k: "kellyFraction", m: "kelly_fraction", l: "Kelly Fraction", d: RD["Kelly Fraction"] }, { k: "maxPositionPct", m: "max_position_pct", l: "Max Position %", d: RD["Max Position %"] }, { k: "minEdge", m: "min_edge", l: "Min Edge (EV)", d: RD["EV Threshold"] }, { k: "maxDrawdown", m: "max_drawdown", l: "Max Drawdown", d: RD["Circuit Breaker"] }, { k: "maxConcurrent", m: "max_concurrent", l: "Max Positions", d: RD["Max Concurrent"], t: "int" }, { k: "minPositionUsd", m: "min_position_usd", l: "Min Position $", d: RD["Min Position $"] }].map(({ k, m, l, d: desc, t }) => <div key={k} style={{ marginBottom: 16 }}><label style={{ display: "block", fontSize: 14, color: "#d1d5db", marginBottom: 6, fontFamily: C.mono, fontWeight: 600 }}><Tip term={l} text={desc}>{l}</Tip></label><input value={edits[k] ?? (dashSettings?.[k] ?? MOCK.settings[m])} onChange={e => { const v = t === "int" ? e.target.value : e.target.value; setEdits(p => ({ ...p, [k]: v })); saveDashSettings({ [k]: v }); }} style={{ width: "100%", background: "#374151", border: "1px solid #4b5563", borderRadius: 6, padding: "10px 14px", color: "white", fontSize: 14, outline: "none" }} /></div>)}</div></Card>
            <Card><Head>Farming & Bot Config</Head><div style={{ padding: "16px 20px" }}>{[{ k: "farmingBudget", m: "farming_budget", l: "Weekly Budget ($)" }, { k: "farmingMode", m: "farming_mode", l: "Farm Mode", t: "select", o: ["dry_run", "live"] }, { k: "cronInterval", m: "cron_interval", l: "Cron Schedule" }, { k: "ethRpc", m: "eth_rpc", l: "ETH RPC" }].map(({ k, m, l, t, o }) => <div key={k} style={{ marginBottom: 16 }}><label style={{ display: "block", fontSize: 14, color: "#d1d5db", marginBottom: 6, fontFamily: C.mono, fontWeight: 600 }}>{l}</label>{t === "select" ? <select value={edits[k] ?? (dashSettings?.[k] ?? MOCK.settings[m])} onChange={e => { setEdits(p => ({ ...p, [k]: e.target.value })); saveDashSettings({ [k]: e.target.value }); }} style={{ width: "100%", background: "#374151", border: "1px solid #4b5563", borderRadius: 6, padding: "10px 14px", color: "white", fontSize: 14, outline: "none" }}>{o.map(v => <option key={v} value={v}>{v}</option>)}</select> : <input value={edits[k] ?? (dashSettings?.[k] ?? MOCK.settings[m])} onChange={e => { setEdits(p => ({ ...p, [k]: e.target.value })); saveDashSettings({ [k]: e.target.value }); }} style={{ width: "100%", background: "#374151", border: "1px solid #4b5563", borderRadius: 6, padding: "10px 14px", color: "white", fontSize: 14, outline: "none" }} />}</div>)}<div style={{ display: "flex", gap: 10, marginTop: 16 }}><button onClick={() => { setEdits({}); alert("Reset to saved values"); }} style={{ flex: 1, padding: "11px", fontSize: 13, fontWeight: 700, background: "transparent", color: C.sub, border: `1px solid ${C.dim}`, borderRadius: 6 }}>Reset</button><button disabled={settingsSaving} style={{ flex: 1, padding: "11px", fontSize: 13, fontWeight: 700, background: `${C.green}18`, color: C.green, border: `1px solid ${C.green}33`, borderRadius: 6, opacity: settingsSaving ? 0.6 : 1 }}>{settingsSaving ? "Saving..." : "Saved"}</button></div></div></Card>
          </div>
          )}
          <Card s={{ marginTop: 14 }}><Head>Diagnostics</Head><div style={{ padding: "16px 20px", display: "flex", gap: 10, flexWrap: "wrap" }}>{[{ l: "🔧 Diagnostic", c: C.yellow }, { l: "▶ Bot Cycle", c: C.green }, { l: "⚡ Reset Breaker", c: C.red }, { l: "🔍 Scan Wallets", c: C.cyan }].map(b => <button key={b.l} onClick={() => alert(b.l)} style={{ padding: "12px 20px", fontSize: 14, fontWeight: 600, background: `${b.c}0c`, color: b.c, border: `1px solid ${b.c}33`, borderRadius: 6 }}>{b.l}</button>)}</div></Card>
        </div>}

        {/* TRADING */}
        {tab === "trading" && <TradingTab isActive={tab === "trading"} />}
      </main>

      {/* Completion Modal */}
      {completionModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setCompletionModal(null)}>
          <div className="crypto-modal" style={{ background: C.card, border: `1px solid ${C.green}`, borderRadius: 12, padding: 24, width: "100%", maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h3 className="crypto-section-title" style={{ color: C.green, fontSize: 18, marginBottom: 16 }}>Log Completion</h3>
            <p style={{ color: C.sub, fontSize: 13, marginBottom: 16 }}>Task: <span style={{ color: "white" }}>{completionModal.taskName}</span></p>

            <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4 }}>TX Link (optional)</label>
            <input
              type="url"
              value={completionTxLink}
              onChange={(e) => setCompletionTxLink(e.target.value)}
              placeholder="https://basescan.org/tx/0x..."
              style={{ width: "100%", background: "black", border: `1px solid ${C.dim}`, borderRadius: 6, padding: "10px 14px", color: "white", fontSize: 13, marginBottom: 12, outline: "none" }}
            />

            <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4 }}>Notes (optional)</label>
            <input
              type="text"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="e.g., Swapped 50 USDC"
              style={{ width: "100%", background: "black", border: `1px solid ${C.dim}`, borderRadius: 6, padding: "10px 14px", color: "white", fontSize: 13, marginBottom: 16, outline: "none" }}
            />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setCompletionModal(null)}
                style={{ padding: "10px 16px", background: C.dim, color: "white", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={submitCompletion}
                disabled={completionSubmitting}
                style={{ padding: "10px 16px", background: C.green, color: "black", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer", opacity: completionSubmitting ? 0.5 : 1 }}
              >
                {completionSubmitting ? "Saving..." : "✓ Mark Complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Airdrop Modal */}
      {showAddAirdrop && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setShowAddAirdrop(false)}>
          <div className="crypto-modal" style={{ background: C.card, border: `1px solid ${C.pink}`, borderRadius: 12, padding: 24, width: "100%", maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h3 className="crypto-section-title" style={{ color: C.pink, fontSize: 18, marginBottom: 16 }}>Add Airdrop</h3>

            <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4 }}>Protocol *</label>
            <input
              value={newAirdrop.protocol}
              onChange={(e) => setNewAirdrop({ ...newAirdrop, protocol: e.target.value })}
              placeholder="e.g., Uniswap"
              style={{ width: "100%", background: "black", border: `1px solid ${C.dim}`, borderRadius: 6, padding: "10px 14px", color: "white", fontSize: 13, marginBottom: 12, outline: "none" }}
            />

            <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4 }}>Token *</label>
            <input
              value={newAirdrop.token}
              onChange={(e) => setNewAirdrop({ ...newAirdrop, token: e.target.value })}
              placeholder="e.g., $UNI"
              style={{ width: "100%", background: "black", border: `1px solid ${C.dim}`, borderRadius: 6, padding: "10px 14px", color: "white", fontSize: 13, marginBottom: 12, outline: "none" }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4 }}>Tier</label>
                <select
                  value={newAirdrop.tier}
                  onChange={(e) => setNewAirdrop({ ...newAirdrop, tier: e.target.value })}
                  style={{ width: "100%", background: "black", border: `1px solid ${C.dim}`, borderRadius: 6, padding: "10px", color: "white", fontSize: 12, outline: "none" }}
                >
                  <option value="S">S</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4 }}>Status</label>
                <select
                  value={newAirdrop.status}
                  onChange={(e) => setNewAirdrop({ ...newAirdrop, status: e.target.value })}
                  style={{ width: "100%", background: "black", border: `1px solid ${C.dim}`, borderRadius: 6, padding: "10px", color: "white", fontSize: 12, outline: "none" }}
                >
                  <option value="EXPLORING">EXPLORING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="SEASON 1">SEASON 1</option>
                  <option value="SEASON 2">SEASON 2</option>
                  <option value="SEASON 3">SEASON 3</option>
                  <option value="SEASON 4">SEASON 4</option>
                  <option value="SEASON 5">SEASON 5</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="DEAD">DEAD</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4 }}>Frequency</label>
                <select
                  value={newAirdrop.frequency}
                  onChange={(e) => setNewAirdrop({ ...newAirdrop, frequency: e.target.value })}
                  style={{ width: "100%", background: "black", border: `1px solid ${C.dim}`, borderRadius: 6, padding: "10px", color: "white", fontSize: 12, outline: "none" }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
            </div>

            <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4 }}>Notes</label>
            <input
              value={newAirdrop.notes}
              onChange={(e) => setNewAirdrop({ ...newAirdrop, notes: e.target.value })}
              placeholder="Optional notes..."
              style={{ width: "100%", background: "black", border: `1px solid ${C.dim}`, borderRadius: 6, padding: "10px 14px", color: "white", fontSize: 13, marginBottom: 16, outline: "none" }}
            />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowAddAirdrop(false)}
                style={{ padding: "10px 16px", background: C.dim, color: "white", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={createAirdrop}
                style={{ padding: "10px 16px", background: C.pink, color: "white", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Airdrop Modal */}
      {editingAirdrop && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setEditingAirdrop(null)}>
          <div className="crypto-modal" style={{ background: C.card, border: "1px solid " + C.green, borderRadius: 12, padding: 24, width: "100%", maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h3 className="crypto-section-title" style={{ color: C.green, fontSize: 18, marginBottom: 16 }}>Edit Airdrop</h3>

            <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4 }}>Protocol *</label>
            <input
              value={editingAirdrop.protocol}
              onChange={(e) => setEditingAirdrop({ ...editingAirdrop, protocol: e.target.value })}
              style={{ width: "100%", background: "black", border: "1px solid " + C.dim, borderRadius: 6, padding: "10px 14px", color: "white", fontSize: 13, marginBottom: 12, outline: "none" }}
            />

            <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4 }}>Token *</label>
            <input
              value={editingAirdrop.token}
              onChange={(e) => setEditingAirdrop({ ...editingAirdrop, token: e.target.value })}
              style={{ width: "100%", background: "black", border: "1px solid " + C.dim, borderRadius: 6, padding: "10px 14px", color: "white", fontSize: 13, marginBottom: 12, outline: "none" }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4 }}>Tier</label>
                <select
                  value={editingAirdrop.tier}
                  onChange={(e) => setEditingAirdrop({ ...editingAirdrop, tier: e.target.value })}
                  style={{ width: "100%", background: "black", border: "1px solid " + C.dim, borderRadius: 6, padding: "10px", color: "white", fontSize: 12, outline: "none" }}
                >
                  <option value="S">S</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="F">F</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4 }}>Status</label>
                <select
                  value={editingAirdrop.status}
                  onChange={(e) => setEditingAirdrop({ ...editingAirdrop, status: e.target.value })}
                  style={{ width: "100%", background: "black", border: "1px solid " + C.dim, borderRadius: 6, padding: "10px", color: "white", fontSize: 12, outline: "none" }}
                >
                  <option value="EXPLORING">EXPLORING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="SEASON 1">SEASON 1</option>
                  <option value="SEASON 2">SEASON 2</option>
                  <option value="SEASON 3">SEASON 3</option>
                  <option value="SEASON 4">SEASON 4</option>
                  <option value="SEASON 5">SEASON 5</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="DEAD">DEAD</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4 }}>Frequency</label>
                <select
                  value={editingAirdrop.frequency}
                  onChange={(e) => setEditingAirdrop({ ...editingAirdrop, frequency: e.target.value })}
                  style={{ width: "100%", background: "black", border: "1px solid " + C.dim, borderRadius: 6, padding: "10px", color: "white", fontSize: 12, outline: "none" }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
            </div>

            <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4 }}>Notes</label>
            <input
              value={editingAirdrop.notes || ""}
              onChange={(e) => setEditingAirdrop({ ...editingAirdrop, notes: e.target.value })}
              style={{ width: "100%", background: "black", border: "1px solid " + C.dim, borderRadius: 6, padding: "10px 14px", color: "white", fontSize: 13, marginBottom: 16, outline: "none" }}
            />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditingAirdrop(null)}
                style={{ padding: "10px 16px", background: C.dim, color: "white", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={updateAirdrop}
                style={{ padding: "10px 16px", background: C.green, color: "white", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ padding: "10px 0", borderTop: `1px solid ${C.pink}22` }}><div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: C.mono, letterSpacing: 2 }}><span style={{ color: C.pink }}>SLIMY_CRYPTO_V1.0</span><span style={{ color: C.cyan }}>{botData?.farming?.stats?.total_actions || 0} bot actions • {botData?.trading?.mode?.toUpperCase() || "OFFLINE"}</span><span suppressHydrationWarning style={{ color: C.green }}>{botData?.fetchedAt ? new Date(botData.fetchedAt).toLocaleTimeString() : "—"}</span></div></footer>
    </div>
  );
}
