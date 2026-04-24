/**
 * Club stats service — aggregates and leaderboard data.
 * Ported from /opt/slimy/app/lib/club-stats-service.js
 */

import { EmbedBuilder } from 'discord.js';
import { getAggregates, getLatestForGuild, getTopMovers, LatestMemberRow } from './club-store.js';
import { formatAnchorDisplay } from './week-anchor.js';

export const DEFAULT_TOP = 10;
export const MIN_TOP = 3;
export const MAX_TOP = 25;

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

function buildBar(pctValue: unknown): string {
  const pct = toNumber(pctValue);
  if (pct === null) return "   ";
  const capped = Math.max(Math.min(pct, 50), -50);
  const magnitude = Math.abs(capped);
  const levels = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉"];
  const index = Math.min(7, Math.max(1, Math.round((magnitude / 50) * 7)));
  const block = levels[index];
  if (!block) return "   ";
  const prefix = pct >= 0 ? "+" : "−";
  return `${prefix}${block} `;
}

function pad(value: string, length: number, align: "left" | "right" = "left"): string {
  const str = String(value);
  if (str.length >= length) return str;
  const padding = " ".repeat(length - str.length);
  return align === "right" ? padding + str : str + padding;
}

function formatTableSide(rows: { name_display: string; pct_change: number | null; current_value: number | null; previous_value: number | null }[], metricLabel: string, direction: "up" | "down"): string {
  if (!rows.length) return `${direction === "up" ? "Top ↑" : "Top ↓"} (${metricLabel})\n(no data)`;

  const nameWidth = Math.max(10, ...rows.map(r => r.name_display.length)) + 1;
  const lines: string[] = [];
  lines.push(`${direction === "up" ? "Top ↑" : "Top ↓"} (${metricLabel})`);
  lines.push(`${pad("", 3)} ${pad("Name", nameWidth)} ${pad("Δ%", 8)} ${pad("ΔAbs", 12, "right")} ${pad("Now", 12, "right")} Bar`);

  rows.forEach((row, index) => {
    const pct = toNumber(row.pct_change);
    const pctStr = pct === null ? "—" : `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(1)}%`;
    const delta = formatDelta(row.current_value, row.previous_value);
    const now = formatNumber(row.current_value);
    const bar = buildBar(pct);
    lines.push(`${pad(`${index + 1})`, 3)} ${pad(row.name_display, nameWidth)} ${pad(pctStr, 8)} ${pad(delta, 12, "right")} ${pad(now, 12, "right")} ${bar}`);
  });

  return lines.join("\n");
}

interface TableRow {
  name_display: string;
  pct_change: number | null;
  current_value: number | null;
  previous_value: number | null;
}

const MAX_FIELD_VALUE = 1024;

function buildMoversSection(movers: { gainers: TableRow[]; losers: TableRow[] } | null, metricLabel: string): string {
  if (!movers) return "";
  const gainers: TableRow[] = Array.isArray(movers?.gainers) ? movers.gainers : [];
  const losers: TableRow[] = Array.isArray(movers?.losers) ? movers.losers : [];
  if (!gainers.length && !losers.length) return "No prior week yet.";

  let gKeep = gainers.length;
  let lKeep = losers.length;

  for (;;) {
    const gSide = formatTableSide(gainers.slice(0, gKeep), metricLabel, "up");
    const lSide = formatTableSide(losers.slice(0, lKeep), metricLabel, "down");
    const truncNote = (gKeep < gainers.length || lKeep < losers.length)
      ? `\nShowing ${gKeep}/${gainers.length} gainers, ${lKeep}/${losers.length} losers`
      : "";
    const result = `\`\`\`\n${gSide}\n\n${lSide}${truncNote}\n\`\`\``;
    if (result.length <= MAX_FIELD_VALUE) return result;
    if (gKeep > lKeep && gKeep > 0) { gKeep--; }
    else if (lKeep > 0) { lKeep--; }
    else if (gKeep > 0) { gKeep--; }
    else break;
  }

  return "```\nNo movers data available.\n```";
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

async function computeCohorts(latest: LatestMemberRow[]) {
  const newMembers: LatestMemberRow[] = [];
  const veterans: LatestMemberRow[] = [];
  const mostVolatile: (LatestMemberRow & { volatility: number })[] = [];

  for (const member of latest) {
    if (!member.total_prev && !member.sim_prev) {
      newMembers.push(member);
    } else {
      veterans.push(member);
    }
    const volatility = Math.abs(toNumber(member.total_pct_change) || 0);
    if (volatility > 0) {
      mostVolatile.push({ ...member, volatility });
    }
  }

  mostVolatile.sort((a, b) => b.volatility - a.volatility);

  return {
    newMembers,
    veterans,
    mostVolatile: mostVolatile.slice(0, 5),
    newCount: newMembers.length,
    veteranCount: veterans.length,
  };
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
  cohorts: { newMembers: LatestMemberRow[]; veterans: LatestMemberRow[]; mostVolatile: LatestMemberRow[]; newCount: number; veteranCount: number };
}

export async function fetchClubStats(guildId: string, options: { metric?: string; top?: unknown } = {}): Promise<ClubStatsData> {
  const metric = options.metric || "both";
  const top = normalizeTop(options.top);

  const [aggregates, latest] = await Promise.all([
    getAggregates(guildId),
    getLatestForGuild(guildId),
  ]);

  if (!latest.length) {
    return { aggregates, latest, totalMovers: null, simMovers: null, cohorts: { newMembers: [], veterans: [], mostVolatile: [], newCount: 0, veteranCount: 0 } };
  }

  const [totalMovers, simMovers, cohorts] = await Promise.all([
    metric === "sim" ? Promise.resolve(null) : getTopMovers(guildId, "total", top),
    metric === "total" ? Promise.resolve(null) : getTopMovers(guildId, "sim", top),
    computeCohorts(latest),
  ]);

  return { aggregates, latest, totalMovers, simMovers, cohorts };
}

export function buildClubStatsEmbed(
  _guildId: string,
  data: ClubStatsData,
  options: { metric?: string } = {},
): { embed: EmbedBuilder } {
  const { aggregates, latest: _latest, totalMovers, simMovers, cohorts } = data;

  const anchorDisplay = formatAnchorDisplay(_guildId);

  const totalPowerDisplay = aggregates.totalPower === null
    ? "—"
    : formatNumber(aggregates.totalPower, { notation: "compact", maximumFractionDigits: 2 });
  const averagePowerDisplay = aggregates.averagePower === null
    ? "—"
    : Number(aggregates.averagePower).toLocaleString("en-US", { maximumFractionDigits: 0 });

  const embed = new EmbedBuilder()
    .setTitle("Club Weekly Stats")
    .setColor(0x6366f1)
    .setDescription([
      `**Members:** ${aggregates.members} (${cohorts.newCount} new, ${cohorts.veteranCount} returning)`,
      `**Total Power:** ${totalPowerDisplay}`,
      `**Average Power:** ${averagePowerDisplay}`,
    ].join("\n"));

  if (options.metric !== "sim" && totalMovers) {
    embed.addFields({
      name: "Total Power (WoW)",
      value: buildMoversSection(totalMovers, "Total"),
    });
  }

  if (options.metric !== "total" && simMovers) {
    embed.addFields({
      name: "Sim Power (WoW)",
      value: buildMoversSection(simMovers, "Sim"),
    });
  }

  if (cohorts.mostVolatile.length > 0) {
    const volatileLines = cohorts.mostVolatile.map((member, index) => {
      const pct = member.total_pct_change !== null && member.total_pct_change !== undefined ? member.total_pct_change : 0;
      const sign = pct >= 0 ? "▲" : "▼";
      return `${index + 1}. **${member.name_display}** ${sign} ${Math.abs(pct).toFixed(1)}%`;
    });
    embed.addFields({ name: "🔥 Most Volatile (Total Power)", value: volatileLines.join("\n"), inline: false });
  }

  embed.setFooter({ text: `Weekly window: ${anchorDisplay}` });

  return { embed };
}
