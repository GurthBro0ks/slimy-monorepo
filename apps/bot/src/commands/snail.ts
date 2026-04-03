/**
 * Snail — Super Snail stats command (analyze, stats, sheet).
 * Ported from /opt/slimy/app/commands/snail.js
 * Simplified port with vision stub.
 */

import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../lib/database.js';
import { trackCommand } from '../lib/metrics.js';
import { analyzeSnailScreenshot, formatSnailAnalysis } from '../lib/snail-vision.js';

const PENDING_TTL_MS = 15 * 60 * 1000;

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

    // Save to DB
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

async function handleSheet(interaction: {
  user: { id: string };
  deferReply: (opts: { ephemeral: boolean }) => Promise<unknown>;
  editReply: (opts: Record<string, unknown>) => Promise<unknown>;
}): Promise<unknown> {
  await interaction.deferReply({ ephemeral: true });
  return interaction.editReply({ content: "📊 Google Sheets integration not yet configured. Use `/snail stats` to view stored stats." });
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
      sub.setName("sheet").setDescription("Export stats to Google Sheet"),
    ),

  async execute(interaction: {
    isCommand?: () => boolean;
    options: { getSubcommand: () => string; getAttachment: (name: string) => { url: string; name: string } | null };
    deferReply: (opts: { ephemeral: boolean }) => Promise<unknown>;
    editReply: (opts: Record<string, unknown>) => Promise<unknown>;
    reply: (opts: { content: string; ephemeral?: boolean }) => Promise<unknown>;
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
        case "sheet":
          trackCommand("snail-sheet", Date.now() - startTime, true);
          return handleSheet(interaction as Parameters<typeof handleSheet>[0]);
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
};
