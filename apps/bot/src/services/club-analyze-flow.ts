/**
 * Club Analyze — Shared Flow Service
 *
 * Shared session management, OCR pipeline, and UI helpers used by both
 * the slash command (/club-analyze) and the context menu command
 * ("Analyze Club Roster").
 */

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import { extractRoster, dedupeRosterRows } from './roster-ocr.js';
import type { RawRosterRow } from './roster-ocr.js';

function dedupeRows<T extends { name: string; power: bigint }>(rows: T[]): T[] {
  const kept: T[] = [];
  for (const row of rows) {
    const key = row.name.toLowerCase().replace(/\s+/g, '');
    const dup = kept.findIndex((k) => {
      const kKey = k.name.toLowerCase().replace(/\s+/g, '');
      return k.power === row.power && (kKey === key || simpleLev1(kKey, key));
    });
    if (dup === -1) {
      kept.push(row);
    } else if (row.name.length > kept[dup].name.length) {
      kept[dup] = row;
    }
  }
  return kept;
}

function simpleLev1(a: string, b: string): boolean {
  if (a === b) return false;
  if (Math.abs(a.length - b.length) > 1) return false;
  let diff = 0;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  let si = 0, li = 0;
  while (si < short.length && li < long.length) {
    if (short[si] === long[li]) { si++; li++; }
    else { diff++; if (diff > 1) return false; li++; }
  }
  return diff <= 1;
}

export const BUTTON_PREFIX = 'club-analyze';
export const CONTEXT_BUTTON_PREFIX = 'Analyze Club Roster';
export const MAX_IMAGES = 10;
const SESSION_TTL_MS = 60 * 60 * 1000;

// ─── Types ────────────────────────────────────────────────────────────────

export interface PageRow {
  name: string;
  power: bigint;
  edited: boolean;
}

export interface Page {
  screenshotFilename: string;
  rows: PageRow[];
}

export interface ScanSession {
  interactionId: string;
  guildId: string;
  userId: string;
  username: string;
  metric: 'sim' | 'total';
  currentPage: number;
  pages: Page[];
  canonicalMerged: Array<{ name: string; power: bigint }>;
  dirty: boolean;
  createdAt: number;
}

export interface PendingContextSession {
  id: string;
  guildId: string;
  userId: string;
  username: string;
  attachments: Array<{ url: string; name: string }>;
  createdAt: number;
}

// ─── Session Store ────────────────────────────────────────────────────────

export const sessions = new Map<string, ScanSession>();
const pendingContextSessions = new Map<string, PendingContextSession>();

export function cleanExpiredSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
  for (const [id, pending] of pendingContextSessions.entries()) {
    if (now - pending.createdAt > SESSION_TTL_MS) {
      pendingContextSessions.delete(id);
    }
  }
}

export function getSession(interactionId: string): ScanSession | null {
  const session = sessions.get(interactionId);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(interactionId);
    return null;
  }
  return session;
}

// ─── Pending Context Sessions ─────────────────────────────────────────────

export function storePendingContext(pending: PendingContextSession): void {
  pendingContextSessions.set(pending.id, pending);
}

export function getPendingContextSession(id: string): PendingContextSession | null {
  const pending = pendingContextSessions.get(id);
  if (!pending) return null;
  if (Date.now() - pending.createdAt > SESSION_TTL_MS) {
    pendingContextSessions.delete(id);
    return null;
  }
  return pending;
}

export function deletePendingContextSession(id: string): void {
  pendingContextSessions.delete(id);
}

// ─── Shared OCR Pipeline ──────────────────────────────────────────────────

export interface ClubAnalyzeOptions {
  metric: 'sim' | 'total';
  attachments: Array<{ url: string; name: string }>;
  guildId: string;
  userId: string;
  username: string;
  onProgress?: (completed: number, total: number, imageName: string) => void;
}

export async function runClubAnalyze(options: ClubAnalyzeOptions): Promise<string> {
  const { metric, attachments, guildId, userId, username } = options;

  const ocrResults = await extractRoster(
    attachments.map((att) => ({ url: att.url, name: att.name || 'image' })),
    {
      metric,
      skipLiveOcr: process.env.SKIP_LIVE_OCR === '1',
      onProgress: options.onProgress,
    },
  );

  const allRawRows: RawRosterRow[] = [];
  for (let i = 0; i < ocrResults.length; i++) {
    for (const row of ocrResults[i].rows) {
      allRawRows.push({ name: row.name, power: row.power, source_screenshot: i });
    }
  }

  const canonicalMerged = dedupeRosterRows(allRawRows);

  const pages: Page[] = ocrResults.map((result) => {
    const raw = result.rows.map((row) => ({
      name: row.name,
      power: row.power,
      edited: false,
    }));
    return {
      screenshotFilename: attachments[result.imageIndex]?.name || `screenshot_${result.imageIndex + 1}`,
      rows: dedupeRows(raw),
    };
  });

  const sessionId = uuidv4();
  const session: ScanSession = {
    interactionId: sessionId,
    guildId,
    userId,
    username,
    metric,
    currentPage: 0,
    pages,
    canonicalMerged,
    dirty: false,
    createdAt: Date.now(),
  };
  sessions.set(sessionId, session);

  return sessionId;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────

export function buildPageEmbed(session: ScanSession): EmbedBuilder {
  const page = session.pages[session.currentPage];
  const metricLabel = session.metric === 'sim' ? 'SIM' : 'TOTAL';
  const totalPages = session.pages.length;
  const currentPageNum = session.currentPage + 1;

  const embed = new EmbedBuilder()
    .setTitle(`Club Analyze — ${metricLabel} Power — Screenshot ${currentPageNum}/${totalPages}`)
    .setDescription(`\`${page.screenshotFilename}\``)
    .setColor(0x3b82f6);

  for (let i = 0; i < page.rows.length; i++) {
    const row = page.rows[i];
    const editedFlag = row.edited ? ' ✏️' : '';
    embed.addFields({
      name: `${i + 1}. ${row.name}${editedFlag}`,
      value: `Power: **${row.power.toLocaleString()}**`,
      inline: false,
    });
  }

  const dirtyCount = session.pages.reduce(
    (sum, p) => sum + p.rows.filter((r) => r.edited).length,
    0,
  );
  const dirtyText = dirtyCount > 0 ? ` • ${dirtyCount} unsaved edit${dirtyCount === 1 ? '' : 's'}` : ' • no pending edits';

  embed.setFooter({
    text: `Page ${currentPageNum} of ${totalPages}${dirtyText}`,
  });

  return embed;
}

export function buildNavigationRow(
  session: ScanSession,
  sessionId: string,
): ActionRowBuilder<ButtonBuilder>[] {
  const isFirstPage = session.currentPage === 0;
  const isLastPage = session.currentPage === session.pages.length - 1;
  const dirtyCount = session.pages.reduce(
    (sum, p) => sum + p.rows.filter((r) => r.edited).length,
    0,
  );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:prev:${sessionId}`)
      .setLabel('⬅ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(isFirstPage),
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:edit:${sessionId}`)
      .setLabel('✏️ Edit Row')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:save:${sessionId}`)
      .setLabel(dirtyCount > 0 ? `💾 Save All (${dirtyCount})` : '💾 Save All')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:next:${sessionId}`)
      .setLabel('Next ➡')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(isLastPage),
  );

  const cancelRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:cancel:${sessionId}`)
      .setLabel('❌ Cancel')
      .setStyle(ButtonStyle.Danger),
  );

  return [row, cancelRow];
}
