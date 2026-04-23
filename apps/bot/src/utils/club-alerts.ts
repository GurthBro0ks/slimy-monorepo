/**
 * Club Alerts — Monitors member changes in club_latest and posts alerts to Discord.
 *
 * Runs on a periodic interval, comparing snapshots of club_latest data to detect:
 * - New members (appeared since last check)
 * - Departed members (gone since last check)
 * - Big movers (SIM power changed > threshold %)
 *
 * Snapshots are held in-memory. No database tables are used for alert state.
 */

import { EmbedBuilder, TextChannel } from 'discord.js';
import { database } from '../lib/database.js';

const BIG_MOVER_THRESHOLD_PCT = 10;
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

interface MemberSnapshot {
  name_display: string;
  sim_power: number | null;
  total_power: number | null;
}

interface ClubDiff {
  newMembers: Array<{ name: string; sim: number | null; total: number | null }>;
  departedMembers: Array<{ name: string; sim: number | null; total: number | null }>;
  bigMovers: Array<{ name: string; direction: 'up' | 'down'; pct: number; sim: number | null }>;
}

let previousSnapshot: Map<string, MemberSnapshot> | null = null;
let lastCheckTime: Date | null = null;
let alertTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

export function getAlertStatus(): {
  running: boolean;
  lastCheck: Date | null;
  channelConfigured: boolean;
  memberCount: number;
} {
  return {
    running: isRunning,
    lastCheck: lastCheckTime,
    channelConfigured: Boolean(process.env.CLUB_ALERT_CHANNEL_ID),
    memberCount: previousSnapshot?.size ?? 0,
  };
}

async function captureSnapshot(guildId: string): Promise<Map<string, MemberSnapshot>> {
  const rows = await database.query<
    Array<{ name_display: string; sim_power: string | null; total_power: string | null }>
  >(
    `SELECT name_display, sim_power, total_power
     FROM club_latest
     WHERE guild_id = ?
     ORDER BY name_display ASC`,
    [guildId],
  );

  const snapshot = new Map<string, MemberSnapshot>();
  for (const row of rows) {
    snapshot.set(row.name_display, {
      name_display: row.name_display,
      sim_power: row.sim_power != null ? Number(row.sim_power) : null,
      total_power: row.total_power != null ? Number(row.total_power) : null,
    });
  }
  return snapshot;
}

function computeDiff(
  prev: Map<string, MemberSnapshot>,
  curr: Map<string, MemberSnapshot>,
): ClubDiff {
  const newMembers: ClubDiff['newMembers'] = [];
  const departedMembers: ClubDiff['departedMembers'] = [];
  const bigMovers: ClubDiff['bigMovers'] = [];

  for (const [name, data] of curr) {
    if (!prev.has(name)) {
      newMembers.push({ name, sim: data.sim_power, total: data.total_power });
    }
  }

  for (const [name, data] of prev) {
    if (!curr.has(name)) {
      departedMembers.push({ name, sim: data.sim_power, total: data.total_power });
    }
  }

  for (const [name, currData] of curr) {
    const prevData = prev.get(name);
    if (!prevData) continue;

    if (prevData.sim_power != null && currData.sim_power != null && prevData.sim_power !== 0) {
      const pctChange = ((currData.sim_power - prevData.sim_power) / prevData.sim_power) * 100;
      if (Math.abs(pctChange) >= BIG_MOVER_THRESHOLD_PCT) {
        bigMovers.push({
          name,
          direction: pctChange > 0 ? 'up' : 'down',
          pct: Math.round(pctChange * 100) / 100,
          sim: currData.sim_power,
        });
      }
    }
  }

  bigMovers.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));

  return { newMembers, departedMembers, bigMovers };
}

function formatAbbrev(n: number | null): string {
  if (n == null) return '—';
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function buildAlertEmbed(diff: ClubDiff, memberCount: number): EmbedBuilder | null {
  const { newMembers, departedMembers, bigMovers } = diff;
  const totalChanges = newMembers.length + departedMembers.length + bigMovers.length;
  if (totalChanges === 0) return null;

  const embed = new EmbedBuilder()
    .setTitle('Club Activity Alert')
    .setColor(0x5865f2)
    .setTimestamp();

  if (newMembers.length > 0) {
    const lines = newMembers.slice(0, 15).map((m) => {
      const sim = formatAbbrev(m.sim);
      const total = formatAbbrev(m.total);
      return `+ **${m.name}** — SIM: ${sim} | Total: ${total}`;
    });
    const extra = newMembers.length > 15 ? `\n...and ${newMembers.length - 15} more` : '';
    embed.addFields({
      name: `New Members (${newMembers.length})`,
      value: lines.join('\n') + extra,
      inline: false,
    });
  }

  if (departedMembers.length > 0) {
    const lines = departedMembers.slice(0, 15).map((m) => {
      const sim = formatAbbrev(m.sim);
      const total = formatAbbrev(m.total);
      return `- **${m.name}** — SIM: ${sim} | Total: ${total}`;
    });
    const extra = departedMembers.length > 15 ? `\n...and ${departedMembers.length - 15} more` : '';
    embed.addFields({
      name: `Departed Members (${departedMembers.length})`,
      value: lines.join('\n') + extra,
      inline: false,
    });
  }

  if (bigMovers.length > 0) {
    const lines = bigMovers.slice(0, 15).map((m) => {
      const arrow = m.direction === 'up' ? '▲' : '▼';
      const sim = formatAbbrev(m.sim);
      return `${arrow} **${m.name}** — ${m.pct > 0 ? '+' : ''}${m.pct}% (SIM: ${sim})`;
    });
    const extra = bigMovers.length > 15 ? `\n...and ${bigMovers.length - 15} more` : '';
    embed.addFields({
      name: `Big Movers (${bigMovers.length})`,
      value: lines.join('\n') + extra,
      inline: false,
    });
  }

  embed.setFooter({ text: `${memberCount} members tracked | Threshold: ±${BIG_MOVER_THRESHOLD_PCT}%` });

  return embed;
}

export async function runAlertCheck(
  guildId: string,
  channelId: string,
  force = false,
): Promise<{ changes: number; posted: boolean }> {
  const current = await captureSnapshot(guildId);

  if (!previousSnapshot && !force) {
    previousSnapshot = current;
    lastCheckTime = new Date();
    console.log(`[club-alerts] Baseline snapshot captured: ${current.size} members`);
    return { changes: 0, posted: false };
  }

  const prev = force && previousSnapshot ? previousSnapshot : previousSnapshot;
  if (!prev) {
    previousSnapshot = current;
    lastCheckTime = new Date();
    return { changes: 0, posted: false };
  }

  const diff = computeDiff(prev, current);
  const totalChanges = diff.newMembers.length + diff.departedMembers.length + diff.bigMovers.length;

  console.log(
    `[club-alerts] Check at ${new Date().toISOString()}: ${totalChanges} changes ` +
    `(+${diff.newMembers.length} new, -${diff.departedMembers.length} departed, ` +
    `${diff.bigMovers.length} big movers)`,
  );

  let posted = false;
  if (totalChanges > 0) {
    const embed = buildAlertEmbed(diff, current.size);
    if (embed && channelId) {
      try {
        const { Client } = await import('discord.js');
        const globalClient = globalThis.client as InstanceType<typeof Client>;
        if (globalClient) {
          const channel = await globalClient.channels.fetch(channelId);
          if (channel && channel.isTextBased()) {
            await (channel as TextChannel).send({ embeds: [embed] });
            posted = true;
          }
        }
      } catch (err) {
        console.error('[club-alerts] Failed to post alert:', (err as Error).message);
      }
    }
  }

  previousSnapshot = current;
  lastCheckTime = new Date();
  return { changes: totalChanges, posted };
}

export function startAlertScheduler(guildId: string, channelId: string): void {
  if (alertTimer) {
    clearInterval(alertTimer);
  }

  if (!channelId) {
    console.warn('[club-alerts] No CLUB_ALERT_CHANNEL_ID configured — alerts disabled');
    return;
  }

  isRunning = true;
  console.log(`[club-alerts] Starting scheduler: guild=${guildId}, interval=${CHECK_INTERVAL_MS / 60000}min`);

  runAlertCheck(guildId, channelId).catch((err) => {
    console.error('[club-alerts] Initial check failed:', (err as Error).message);
  });

  alertTimer = setInterval(async () => {
    try {
      await runAlertCheck(guildId, channelId);
    } catch (err) {
      console.error('[club-alerts] Scheduled check failed:', (err as Error).message);
    }
  }, CHECK_INTERVAL_MS);
}

export function stopAlertScheduler(): void {
  if (alertTimer) {
    clearInterval(alertTimer);
    alertTimer = null;
  }
  isRunning = false;
  console.log('[club-alerts] Scheduler stopped');
}
