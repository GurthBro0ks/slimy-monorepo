/**
 * Club stats service — paginated roster + CSV export.
 */

import { EmbedBuilder } from 'discord.js';
import { getAggregates, getLatestForGuild, getTopMovers, LatestMemberRow } from './club-store.js';

export const DEFAULT_TOP = 10;
export const MIN_TOP = 3;
export const MAX_TOP = 25;
export const MEMBERS_PER_PAGE = 10;

function toNumber(value: unknown): number | null {
  if (value === null || typeof value === "undefined") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function formatNumber(value: unknown, options: {
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  notation?: string;
  compactDisplay?: string;
} = {}): string {
  const num = toNumber(value);
  if (num === null) return "—";
  const localeOptions: Intl.NumberFormatOptions = {
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  };
  if (options.notation) (localeOptions as { notation?: string }).notation = options.notation;
  if (options.compactDisplay) (localeOptions as { compactDisplay?: string }).compactDisplay = options.compactDisplay;
  return num.toLocaleString("en-US", localeOptions);
}

export function formatDelta(current: unknown, previous: unknown): string {
  const curr = toNumber(current);
  const prev = toNumber(previous);
  if (curr === null || prev === null) return "—";
  const delta = curr - prev;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toLocaleString("en-US")}`;
}

function pad(value: string, length: number, align: "left" | "right" = "left"): string {
  const str = String(value);
  if (str.length >= length) return str;
  const padding = " ".repeat(length - str.length);
  return align === "right" ? padding + str : str + padding;
}

export function sortMembers(members: LatestMemberRow[], metric: string): LatestMemberRow[] {
  const sorted = [...members];
  if (metric === "sim") {
    sorted.sort((a, b) => {
      const av = toNumber(a.sim_power) ?? -1;
      const bv = toNumber(b.sim_power) ?? -1;
      if (bv !== av) return bv - av;
      return a.name_display.localeCompare(b.name_display);
    });
  } else {
    sorted.sort((a, b) => {
      const av = toNumber(a.total_power) ?? -1;
      const bv = toNumber(b.total_power) ?? -1;
      if (bv !== av) return bv - av;
      return a.name_display.localeCompare(b.name_display);
    });
  }
  return sorted;
}

function formatPct(pct: unknown): string {
  const num = toNumber(pct);
  if (num === null) return "  —";
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(1)}%`;
}

export function buildRosterPage(
  members: LatestMemberRow[],
  page: number,
  totalPages: number,
  metric: string,
  totalMembers: number,
): EmbedBuilder {
  const start = page * MEMBERS_PER_PAGE;
  const pageMembers = members.slice(start, start + MEMBERS_PER_PAGE);
  const metricLabel = metric === "sim" ? "Sim Power" : "Total Power";
  const showSim = metric === "sim";

  const nameWidth = Math.max(14, ...pageMembers.map(m => m.name_display.length)) + 1;
  const powerWidth = 13;

  const header = `${pad("#", 3)} ${pad("Name", nameWidth)} ${pad("Sim Power", powerWidth, "right")} ${pad("Total Power", powerWidth + 2, "right")} ${pad("WoW", 7, "right")}`;

  const lines: string[] = [header];
  for (let i = 0; i < pageMembers.length; i++) {
    const m = pageMembers[i];
    const rank = start + i + 1;
    const sim = formatNumber(m.sim_power);
    const total = formatNumber(m.total_power);
    const wow = showSim ? formatPct(m.sim_pct_change) : formatPct(m.total_pct_change);
    lines.push(`${pad(`${rank}`, 3)} ${pad(m.name_display, nameWidth)} ${pad(sim, powerWidth, "right")} ${pad(total, powerWidth + 2, "right")} ${pad(wow, 7, "right")}`);
  }

  const table = "```\n" + lines.join("\n") + "\n```";

  return new EmbedBuilder()
    .setTitle(`Club Roster — Page ${page + 1}/${totalPages}`)
    .setColor(0x00ff88)
    .setDescription(table)
    .setFooter({ text: `${totalMembers} members | Sorted by ${metricLabel} | Page ${page + 1}/${totalPages}` });
}

export function buildCsv(latest: LatestMemberRow[]): string {
  const header = "Name,SimPower,TotalPower,SimWoW%,TotalWoW%";
  const rows = latest.map(row => {
    const simPct = row.sim_pct_change !== null && row.sim_pct_change !== undefined ? row.sim_pct_change : "";
    const totalPct = row.total_pct_change !== null && row.total_pct_change !== undefined ? row.total_pct_change : "";
    return [
      `"${row.name_display.replace(/"/g, '""')}"`,
      toNumber(row.sim_power) ?? "",
      toNumber(row.total_power) ?? "",
      simPct,
      totalPct,
    ].join(",");
  });
  return [header, ...rows].join("\n");
}

interface TableRow {
  name_display: string;
  pct_change: number | null;
  current_value: number | null;
  previous_value: number | null;
}

function normalizeTop(top: unknown): number {
  const num = Number(top);
  if (!Number.isFinite(num)) return DEFAULT_TOP;
  return Math.max(MIN_TOP, Math.min(MAX_TOP, Math.floor(num)));
}

export interface ClubStatsData {
  aggregates: { members: number; membersWithTotals: number; totalPower: number | null; averagePower: number | null };
  latest: LatestMemberRow[];
  totalMovers: { gainers: TableRow[]; losers: TableRow[] } | null;
  simMovers: { gainers: TableRow[]; losers: TableRow[] } | null;
}

export async function fetchClubStats(guildId: string, options: { metric?: string; top?: unknown } = {}): Promise<ClubStatsData> {
  const metric = options.metric || "both";
  const top = normalizeTop(options.top);

  const [aggregates, latest] = await Promise.all([
    getAggregates(guildId),
    getLatestForGuild(guildId),
  ]);

  if (!latest.length) {
    return { aggregates, latest, totalMovers: null, simMovers: null };
  }

  const [totalMovers, simMovers] = await Promise.all([
    metric === "sim" ? Promise.resolve(null) : getTopMovers(guildId, "total", top),
    metric === "total" ? Promise.resolve(null) : getTopMovers(guildId, "sim", top),
  ]);

  return { aggregates, latest, totalMovers, simMovers };
}
