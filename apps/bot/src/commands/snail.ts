/**
 * Snail — Super Snail stats command (analyze, stats, codes).
 * Ported from /opt/slimy/app/commands/snail.js
 */

import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ButtonInteraction,
  MessageFlags,
} from 'discord.js';
import { database } from '../lib/database.js';
import { trackCommand } from '../lib/metrics.js';
import { analyzeSnailScreenshot, formatSnailAnalysis } from '../lib/snail-vision.js';

const CODES_API = 'https://slimyai.xyz/api/codes';
const CODES_PER_PAGE = 20;
const BUTTON_PREFIX = 'snail';

interface CodeEntry {
  code: string;
  source: string;
  ts: string;
  tags: string[];
  expires: string | null;
  region: string;
}

interface CodesResponse {
  codes: CodeEntry[];
  count: number;
}

interface CodesSession {
  allCodes: CodeEntry[];
  filtered: CodeEntry[];
  filter: 'active' | 'recent' | 'all';
  page: number;
  totalPages: number;
  expiresAt: number;
}

const codesSessions = new Map<string, CodesSession>();

function cleanExpiredSessions(): void {
  const now = Date.now();
  for (const [id, s] of codesSessions) {
    if (s.expiresAt <= now) codesSessions.delete(id);
  }
}

function filterCodes(codes: CodeEntry[], filter: 'active' | 'recent' | 'all'): CodeEntry[] {
  if (filter === 'all') return codes;
  if (filter === 'active') return codes.filter((c) => c.tags.includes('active'));
  if (filter === 'recent') {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return codes.filter((c) => {
      const t = new Date(c.ts).getTime();
      return Number.isFinite(t) && t >= cutoff;
    });
  }
  return codes;
}

function buildCodesEmbed(session: CodesSession): EmbedBuilder {
  const start = session.page * CODES_PER_PAGE;
  const pageCodes = session.filtered.slice(start, start + CODES_PER_PAGE);
  const filterLabel = session.filter === 'active' ? 'Active' : session.filter === 'recent' ? 'Recent 7 Days' : 'All Archive';

  const lines = pageCodes.map((c) => {
    const dateStr = (() => {
      const t = new Date(c.ts).getTime();
      if (!Number.isFinite(t)) return 'Unknown date';
      return `<t:${Math.floor(t / 1000)}:d>`;
    })();
    return `\`${c.code}\` — ${c.source} ${dateStr}`;
  });

  return new EmbedBuilder()
    .setTitle(`🐌 Super Snail Codes (${filterLabel})`)
    .setColor(0x00ae86)
    .setDescription(lines.join('\n') || 'No codes found.')
    .setFooter({ text: `Page ${session.page + 1}/${session.totalPages} — ${session.filtered.length} codes` });
}

function buildCodesButtons(session: CodesSession, sessionId: string): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  const filterRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:codes:active:${sessionId}`)
      .setLabel('Active')
      .setStyle(session.filter === 'active' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:codes:recent:${sessionId}`)
      .setLabel('Recent 7 Days')
      .setStyle(session.filter === 'recent' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:codes:all:${sessionId}`)
      .setLabel('All Archive')
      .setStyle(session.filter === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:codes:copy:${sessionId}`)
      .setLabel('Copy All')
      .setStyle(ButtonStyle.Success),
  );
  rows.push(filterRow);

  if (session.totalPages > 1) {
    const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${BUTTON_PREFIX}:codes:prev:${sessionId}`)
        .setLabel('◀ Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(session.page === 0),
      new ButtonBuilder()
        .setCustomId(`${BUTTON_PREFIX}:codes:next:${sessionId}`)
        .setLabel('Next ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(session.page >= session.totalPages - 1),
    );
    rows.push(navRow);
  }

  return rows;
}

async function handleCodes(interaction: {
  deferReply: (opts: { ephemeral: boolean }) => Promise<unknown>;
  editReply: (opts: Record<string, unknown>) => Promise<unknown>;
  reply: (opts: { content: string; ephemeral?: boolean; flags?: number }) => Promise<unknown>;
  fetchReply: () => Promise<unknown>;
}): Promise<unknown> {
  cleanExpiredSessions();

  await interaction.deferReply({ ephemeral: false });

  try {
    const res = await fetch(CODES_API);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = (await res.json()) as CodesResponse;

    const allCodes = data.codes || [];
    if (!allCodes.length) {
      return interaction.editReply({ content: '🐌 No codes available right now.' });
    }

    const filtered = filterCodes(allCodes, 'active');
    const totalPages = Math.max(1, Math.ceil(filtered.length / CODES_PER_PAGE));
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const session: CodesSession = {
      allCodes,
      filtered,
      filter: 'active',
      page: 0,
      totalPages,
      expiresAt: Date.now() + 15 * 60 * 1000,
    };
    codesSessions.set(sessionId, session);

    await interaction.fetchReply();

    const embed = buildCodesEmbed(session);
    const buttons = buildCodesButtons(session, sessionId);
    return interaction.editReply({ embeds: [embed], components: buttons });
  } catch (err) {
    return interaction.editReply({ content: `❌ Failed to fetch codes: ${(err as Error).message}` });
  }
}

interface PendingEntry {
  userId: string;
  guildId: string | null;
  type: string;
  imageUrl: string;
  expiresAt: number;
}

const pendingApprovals = new Map<string, PendingEntry>();

function cleanExpiredPending(): void {
  const now = Date.now();
  for (const [id, entry] of pendingApprovals) {
    if (entry.expiresAt <= now) pendingApprovals.delete(id);
  }
}

async function handleAnalyze(interaction: {
  user: { id: string; username: string };
  guildId: string | null;
  guild?: { name: string };
  options: { getAttachment: (name: string) => { url: string; name: string } | null };
  deferReply: (opts: { ephemeral: boolean }) => Promise<unknown>;
  editReply: (opts: Record<string, unknown>) => Promise<unknown>;
  reply: (opts: { content: string; ephemeral?: boolean }) => Promise<unknown>;
  channel: { sendTyping: () => Promise<void> };
}): Promise<unknown> {
  cleanExpiredPending();

  const attachment = interaction.options.getAttachment("screenshot");
  if (!attachment) {
    return interaction.reply({ content: "❌ Please attach a Super Snail screenshot.", ephemeral: true });
  }

  const userId = interaction.user.id;
  const guildId = interaction.guildId || null;
  const username = interaction.user.username;
  const guildName = interaction.guild?.name || "Unknown";

  await interaction.deferReply({ ephemeral: false });
  await interaction.channel.sendTyping();

  try {
    const analysis = await analyzeSnailScreenshot(attachment.url);
    const responseText = formatSnailAnalysis(analysis);

    const statId = await database.saveSnailStat({
      userId,
      guildId: guildId ?? undefined,
      username,
      guildName,
      screenshotUrl: attachment.url,
      stats: (analysis.stats as Record<string, number | null>) || {},
      wikiEnrichment: undefined,
      confidence: (analysis.confidence as Record<string, number>) || {},
      analysisText: responseText,
      savedToSheet: false,
    });

    const embed = new EmbedBuilder()
      .setTitle("🐌 Super Snail Analysis")
      .setColor(0x00ae86)
      .setDescription(responseText.slice(0, 4000));

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`snail:save:${statId}`)
        .setLabel("Save Stats")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`snail:retry:${attachment.url}`)
        .setLabel("Retry")
        .setStyle(ButtonStyle.Secondary),
    );

    return interaction.editReply({ embeds: [embed], components: [row] });
  } catch (err) {
    return interaction.editReply({ content: `❌ Analysis failed: ${(err as Error).message}` });
  }
}

async function handleStats(interaction: {
  user: { id: string };
  guildId: string | null;
  deferReply: (opts: { ephemeral: boolean }) => Promise<unknown>;
  editReply: (opts: Record<string, unknown>) => Promise<unknown>;
  reply: (opts: { content: string; ephemeral?: boolean }) => Promise<unknown>;
}): Promise<unknown> {
  const startTime = Date.now();
  const userId = interaction.user.id;
  const guildId = interaction.guildId || null;

  await interaction.deferReply({ ephemeral: true });

  try {
    interface RecentStat extends Record<string, unknown> {
      id: number;
      created_at: Date;
      hp: number | null;
      atk: number | null;
      def: number | null;
      rush: number | null;
      fame: number | null;
      tech: number | null;
      art: number | null;
      civ: number | null;
      fth: number | null;
      analysis_text: string | null;
      active_loadout: string | null;
    }
    const rows = await database.getRecentSnailStats(userId, guildId, 5);

    if (!rows.length) {
      trackCommand("snail-stats", Date.now() - startTime, false);
      return interaction.editReply({
        content: "📊 No saved stats found yet. Use `/snail analyze` to capture a screenshot.",
      });
    }

    const latest = rows[0] as RecentStat;
    const timestamp = latest.created_at ? new Date(latest.created_at).toISOString() : "unknown time";

    const statsBlock = [
      `**HP:** ${latest.hp?.toLocaleString() || "???"} | **ATK:** ${latest.atk?.toLocaleString() || "???"} | **DEF:** ${latest.def?.toLocaleString() || "???"} | **RUSH:** ${latest.rush?.toLocaleString() || "???"}`,
      `**FAME:** ${latest.fame?.toLocaleString() || "???"} | **TECH:** ${latest.tech?.toLocaleString() || "???"} | **ART:** ${latest.art?.toLocaleString() || "???"} | **CIV:** ${latest.civ?.toLocaleString() || "???"} | **FTH:** ${latest.fth?.toLocaleString() || "???"}`,
    ].join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x00ae86)
      .setTitle("🐌 Latest Stored Analysis")
      .setDescription(latest.analysis_text || statsBlock)
      .setFooter({ text: `Recorded ${timestamp}` });

    trackCommand("snail-stats", Date.now() - startTime, true);
    return interaction.editReply({ embeds: [embed] });
  } catch (err) {
    trackCommand("snail-stats", Date.now() - startTime, false);
    return interaction.editReply({ content: `❌ Failed: ${(err as Error).message}` });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("snail")
    .setDescription("🐌 Super Snail stats — analyze screenshots and track progress")
    .addSubcommand((sub) =>
      sub
        .setName("analyze")
        .setDescription("Upload a Super Snail screenshot for AI analysis")
        .addAttachmentOption((opt) => opt.setName("screenshot").setDescription("Screenshot to analyze").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName("stats").setDescription("View your most recent stored stats"),
    )
    .addSubcommand((sub) =>
      sub.setName("codes").setDescription("View active Super Snail redemption codes"),
    ),

  async execute(interaction: {
    isCommand?: () => boolean;
    options: { getSubcommand: () => string; getAttachment: (name: string) => { url: string; name: string } | null };
    deferReply: (opts: { ephemeral: boolean }) => Promise<unknown>;
    editReply: (opts: Record<string, unknown>) => Promise<unknown>;
    reply: (opts: { content: string; ephemeral?: boolean; flags?: number }) => Promise<unknown>;
    fetchReply: () => Promise<unknown>;
    channel: { sendTyping: () => Promise<void> };
    user: { id: string; username: string };
    guildId: string | null;
    guild?: { name: string };
  }): Promise<unknown> {
    const startTime = Date.now();
    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "analyze":
          trackCommand("snail-analyze", Date.now() - startTime, true);
          return handleAnalyze(interaction as Parameters<typeof handleAnalyze>[0]);
        case "stats":
          trackCommand("snail-stats", Date.now() - startTime, true);
          return handleStats(interaction as Parameters<typeof handleStats>[0]);
        case "codes":
          trackCommand("snail-codes", Date.now() - startTime, true);
          return handleCodes(interaction as Parameters<typeof handleCodes>[0]);
        default:
          return interaction.reply({ content: "Unknown subcommand.", ephemeral: true });
      }
    } catch (err) {
      const error = err as Error;
      console.error("[snail] Failed", { error: error.message });
      trackCommand("snail", Date.now() - startTime, false);
      return interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
    }
  },

  async handleButton(interaction: ButtonInteraction): Promise<void> {
    const parts = String(interaction.customId || '').split(':');
    if (parts[0] !== BUTTON_PREFIX || parts.length < 4) return;

    const [, action, param, sessionId] = parts;
    if (action !== 'codes') return;

    cleanExpiredSessions();
    const session = codesSessions.get(sessionId);
    if (!session) {
      await interaction.reply({ content: '❌ Session expired. Run `/snail codes` again.', flags: MessageFlags.Ephemeral });
      return;
    }

    if (param === 'copy') {
      const text = session.filtered.map((c) => c.code).join('\n');
      await interaction.reply({ content: `📋 **Codes (${session.filtered.length}):**\n\`\`\`\n${text.slice(0, 1900)}\n\`\`\``, flags: MessageFlags.Ephemeral });
      return;
    }

    if (param === 'prev') {
      session.page = Math.max(0, session.page - 1);
    } else if (param === 'next') {
      session.page = Math.min(session.totalPages - 1, session.page + 1);
    } else if (param === 'active' || param === 'recent' || param === 'all') {
      session.filter = param;
      session.filtered = filterCodes(session.allCodes, param);
      session.totalPages = Math.max(1, Math.ceil(session.filtered.length / CODES_PER_PAGE));
      session.page = 0;
    }

    const embed = buildCodesEmbed(session);
    const buttons = buildCodesButtons(session, sessionId);
    await interaction.update({ embeds: [embed], components: buttons });
  },
};
