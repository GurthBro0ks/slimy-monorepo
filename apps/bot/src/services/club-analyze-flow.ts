/**
 * Club Analyze — Shared Flow Service
 *
 * Exposes session management, parsing, and commit logic used by both
 * the slash command (/club-analyze) and the context menu command
 * ("Analyze Club Roster").
 */

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import {
  parseManageMembersImage,
  parseManageMembersImageEnsemble,
} from '../lib/club-vision.js';
import {
  canonicalize,
  upsertMembers,
  createSnapshot,
  insertMetrics,
  recomputeLatestForGuild,
  getLatestForGuild,
} from '../lib/club-store.js';
import { getSheetConfig } from '../lib/guild-settings.js';

export const BUTTON_PREFIX = "club-analyze";
const _LOW_CONFIDENCE_THRESHOLD = 0.7;
const MIN_ROWS_FOR_COMMIT = 3;
const SESSION_TTL_MS = 15 * 60 * 1000;
const USE_ENSEMBLE = process.env.CLUB_USE_ENSEMBLE === "1";

export interface MetricEntry {
  canonical: string;
  display: string;
  value: number | null;
  confidence: number;
  sources?: Set<string>;
}

export interface Session {
  id: string;
  guildId: string;
  userId: string;
  channelId: string;
  type: "quick" | "full" | "both";
  attachments: { url: string; name: string }[];
  metrics: { sim: Map<string, MetricEntry>; total: Map<string, MetricEntry> };
  displayNames: Map<string, string>;
  previousByCanonical: Map<string, { memberId: number; display: string; totalPower: number | null; simPower: number | null }>;
  lastWeekSet: Set<string>;
  ensembleMetadata: Record<string, number> | null;
  sheetConfig: { url: string | null; sheetId: string | null };
  qa: Record<string, unknown> | null;
  approvals: Set<string>;
  forceCommit: boolean;
  strictRuns: number;
  createdAt: number;
  useEnsemble: boolean;
}

export const sessions = new Map<string, Session>();

export function cleanExpiredSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

export function ensureDatabase(): void {
  const { database } = require('../lib/database.js');
  if (!database.isConfigured()) {
    throw new Error("Database not configured for club analyze.");
  }
}

function toNumber(value: unknown): number | null {
  if (value === null || typeof value === "undefined") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function mergeRows(session: Session, metric: string, rows: { canonical: string; display: string; value: number | null; confidence: number }[], _url: string): void {
  const map = metric === "sim" ? session.metrics.sim : session.metrics.total;
  for (const row of rows) {
    const canonical = row.canonical || canonicalize(row.display);
    if (!canonical) continue;

    if (row.display) session.displayNames.set(canonical, row.display);

    const existing = map.get(canonical);
    if (!existing) {
      map.set(canonical, { canonical, display: row.display || canonical, value: row.value, confidence: row.confidence });
    } else if (row.value !== null && (existing.value === null || row.confidence > existing.confidence)) {
      existing.value = row.value;
      existing.display = row.display || existing.display;
      existing.confidence = row.confidence;
    }
  }
}

export async function parseAttachments(session: Session, strict = false): Promise<void> {
  const forcedMetric: string | null = null;
  const useEnsemble = session.useEnsemble && !strict;

  for (const attachment of session.attachments) {
    try {
      let result;
      if (useEnsemble) {
        result = await parseManageMembersImageEnsemble(attachment.url, forcedMetric);
        if (result.ensembleMetadata) {
          session.ensembleMetadata = result.ensembleMetadata as Record<string, number>;
        }
      } else {
        result = await parseManageMembersImage(attachment.url, forcedMetric, { strict });
      }
      mergeRows(session, result.metric, result.rows, attachment.url);
    } catch (err) {
      console.error("[club-analyze] Vision parse failed", { url: attachment.url, error: (err as Error).message });
      throw err;
    }
  }
}

export async function loadPreviousState(session: Session): Promise<void> {
  const latest = await getLatestForGuild(session.guildId);
  for (const row of latest) {
    session.previousByCanonical.set(row.name_canonical, {
      memberId: row.member_id,
      display: row.name_display,
      totalPower: toNumber(row.total_power),
      simPower: toNumber(row.sim_power),
    });
  }
  session.lastWeekSet = new Set(session.previousByCanonical.keys());
}

export function buildPreviewEmbed(session: Session): EmbedBuilder {
  const qa = session.qa as { coverageGuardTriggered?: boolean; missingGuardTriggered?: boolean; coveragePct?: number; missing?: string[]; newNames?: string[]; suspicious?: { display: string; pct: number }[]; lowConfidence?: { display: string; metric: string; confidence: number }[]; requiresSecondApprover?: boolean; totalRows?: number } | null;
  const coverageColor = qa?.coverageGuardTriggered ? 0xff3366 : qa?.missingGuardTriggered ? 0xffa500 : 0x3b82f6;

  const totalSim = session.metrics.sim.size;
  const totalTotal = session.metrics.total.size;

  const embed = new EmbedBuilder()
    .setTitle("Club Analyze — Preview")
    .setColor(coverageColor)
    .setDescription([
      `• Parsed **${totalSim + totalTotal}** rows`,
      `  • Sim: ${totalSim}`,
      `  • Total: ${totalTotal}`,
    ].join("\n"));

  if (qa) {
    if (qa.missing?.length) {
      embed.addFields({
        name: `Missing vs last week (${qa.missing.length})`,
        value: qa.missing.slice(0, 5).join("\n") || "—",
      });
    }
    if (qa.suspicious?.length) {
      embed.addFields({
        name: `Suspicious changes (${qa.suspicious.length})`,
        value: qa.suspicious.slice(0, 3).map((r) => `${r.pct > 0 ? "+" : ""}${r.pct}% • ${r.display}`).join("\n") || "—",
      });
    }
    if (qa.requiresSecondApprover) {
      embed.addFields({
        name: "🔐 Second Approval Required",
        value: "Awaiting approval from 2 admins",
      });
    }
    if (qa.totalRows !== undefined && qa.totalRows < MIN_ROWS_FOR_COMMIT) {
      embed.addFields({
        name: "⚠️ Not enough rows",
        value: `Need ${MIN_ROWS_FOR_COMMIT}, got ${qa.totalRows}`,
      });
    }
  }

  return embed;
}

export function buildPreviewComponents(session: Session): ActionRowBuilder<ButtonBuilder>[] {
  const qa = session.qa as { totalRows?: number; requiresSecondApprover?: boolean; coverageGuardTriggered?: boolean; missingGuardTriggered?: boolean } | null;
  const notEnoughRows = (qa?.totalRows ?? 0) < MIN_ROWS_FOR_COMMIT;
  let approveDisabled = notEnoughRows;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:approve:${session.id}`)
      .setEmoji("✅")
      .setLabel("Approve & Commit")
      .setStyle(ButtonStyle.Success)
      .setDisabled(approveDisabled),
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:cancel:${session.id}`)
      .setEmoji("🛑")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Danger),
  );

  return [row];
}

export async function commitSession(session: Session, _source: string): Promise<void> {
  const qa = session.qa as { totalRows?: number; coverageGuardTriggered?: boolean; missingGuardTriggered?: boolean; coveragePct?: number; missing?: string[] } | null;
  if ((qa?.totalRows ?? 0) < MIN_ROWS_FOR_COMMIT) {
    throw new Error(`Need at least ${MIN_ROWS_FOR_COMMIT} rows to commit (currently ${qa?.totalRows ?? 0}).`);
  }

  const canonicalSet = new Set<string>();
  for (const [canonical] of session.metrics.sim) canonicalSet.add(canonical);
  for (const [canonical] of session.metrics.total) canonicalSet.add(canonical);

  const members = Array.from(canonicalSet).map(canonical => ({
    canonical,
    display: session.displayNames.get(canonical) || canonical,
  }));

  const memberMap = await upsertMembers(session.guildId, members);

  const snapshot = await createSnapshot(session.guildId, session.userId, null, new Date());

  const metricEntries: { memberId: number; metric: string; value: number | null }[] = [];
  for (const [canonical, entry] of session.metrics.sim) {
    const memberId = memberMap.get(canonical);
    if (memberId) metricEntries.push({ memberId, metric: "sim", value: entry.value });
  }
  for (const [canonical, entry] of session.metrics.total) {
    const memberId = memberMap.get(canonical);
    if (memberId) metricEntries.push({ memberId, metric: "total", value: entry.value });
  }

  await insertMetrics(snapshot.snapshotId, metricEntries as { memberId: number; metric: string; value: number | null }[]);
  await recomputeLatestForGuild(session.guildId, snapshot.snapshotAt);

  sessions.delete(session.id);
}

/**
 * Creates a new club analyze session from a list of attachments.
 */
export async function createSession(
  guildId: string,
  userId: string,
  channelId: string,
  attachments: { url: string; name: string }[]
): Promise<Session> {
  const sessionId = uuidv4();
  const session: Session = {
    id: sessionId,
    guildId,
    userId,
    channelId,
    type: "both",
    attachments,
    metrics: { sim: new Map(), total: new Map() },
    displayNames: new Map(),
    previousByCanonical: new Map(),
    lastWeekSet: new Set(),
    ensembleMetadata: null,
    sheetConfig: await getSheetConfig(guildId),
    qa: null,
    approvals: new Set(),
    forceCommit: false,
    strictRuns: 0,
    createdAt: Date.now(),
    useEnsemble: USE_ENSEMBLE,
  };
  return session;
}

/**
 * Runs the full analysis pipeline: parse attachments → load previous state → compute QA.
 * Returns the session ready for preview rendering.
 */
export async function runAnalysis(session: Session): Promise<void> {
  await parseAttachments(session);
  await loadPreviousState(session);

  const totalRows = session.metrics.sim.size + session.metrics.total.size;
  session.qa = { totalRows, missing: [], suspicious: [], lowConfidence: [], requiresSecondApprover: false };
}

/**
 * Handles approve/cancel button interactions for club analyze sessions.
 * Returns true if this button was handled, false otherwise.
 */
export async function handleButton(interaction: { customId: string; deferUpdate: () => Promise<unknown>; reply: (opts: { content: string; ephemeral?: boolean }) => Promise<unknown> }): Promise<boolean> {
  const parts = String(interaction.customId || "").split(":");
  if (parts[0] !== BUTTON_PREFIX || parts.length < 3) return false;

  const [, action, sessionId] = parts;
  const session = sessions.get(sessionId);

  if (!session) {
    await interaction.reply({ content: "❌ Session expired. Run `/club-analyze quick` again.", ephemeral: true });
    return true;
  }

  if (action === "approve") {
    try {
      await commitSession(session, "button");
      await interaction.reply({ content: "✅ Committed successfully!" });
    } catch (err) {
      await interaction.reply({ content: `❌ Commit failed: ${(err as Error).message}`, ephemeral: true });
    }
    return true;
  }

  if (action === "cancel") {
    sessions.delete(sessionId);
    await interaction.reply({ content: "🛑 Analysis cancelled." });
    return true;
  }

  return false;
}
