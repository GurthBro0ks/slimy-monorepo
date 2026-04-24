/**
 * Club Stats — Paginated roster of all club members.
 */

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  ButtonInteraction,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import {
  fetchClubStats,
  buildRosterPage,
  buildCsv,
  sortMembers,
  MEMBERS_PER_PAGE,
} from '../lib/club-stats-service.js';
import { database } from '../lib/database.js';
import { trackCommand } from '../lib/metrics.js';
import { createLogger } from '../lib/logger.js';

const logger = createLogger({ context: 'club-stats' });
const BUTTON_PREFIX = 'club-stats';
const COLLECTOR_TIMEOUT = 120_000;

interface RosterSession {
  members: ReturnType<typeof sortMembers>;
  page: number;
  totalPages: number;
  metric: string;
  totalMembers: number;
  expiresAt: number;
  messageId: string | null;
}

const sessions = new Map<string, RosterSession>();

function cleanExpiredSessions(): void {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (s.expiresAt <= now) sessions.delete(id);
  }
}

function buildButtons(session: RosterSession, sessionId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:prev:${sessionId}`)
      .setLabel('◀ Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(session.page === 0),
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:next:${sessionId}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(session.page >= session.totalPages - 1),
  );
}

function ensureDatabase(): void {
  if (!database.isConfigured()) {
    throw new Error("Database not configured for club analytics.");
  }
}

function hasStatsPermission(interaction: ChatInputCommandInteraction): boolean {
  if (!interaction.member) return false;
  const perms = interaction.member.permissions as unknown as { has: (flag: bigint) => boolean };
  if (perms.has(PermissionFlagsBits.Administrator)) return true;
  const roleId = process.env.CLUB_ROLE_ID;
  if (roleId) {
    const rolesManager = interaction.member.roles as unknown as { cache: { has: (id: string) => boolean } };
    if (rolesManager.cache.has(roleId)) return true;
  }
  return false;
}

function resolveMetric(raw: string | null): string {
  if (raw === "sim" || raw === "total") return raw;
  return "total";
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("club-stats")
    .setDescription("Show paginated club roster sorted by power.")
    .addStringOption((option) =>
      option
        .setName("metric")
        .setDescription("Sort column")
        .setRequired(false)
        .addChoices(
          { name: "Total Power", value: "total" },
          { name: "Sim Power", value: "sim" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("format")
        .setDescription("Embed (default) or CSV export")
        .setRequired(false)
        .addChoices(
          { name: "Embed", value: "embed" },
          { name: "CSV", value: "csv" },
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const startTime = Date.now();
    try {
      ensureDatabase();

      if (!hasStatsPermission(interaction)) {
        await interaction.reply({
          content: "You need administrator permissions or the configured club role to run this command.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const metric = resolveMetric(interaction.options.getString("metric"));
      const format = interaction.options.getString("format") || "embed";

      await interaction.deferReply({ ephemeral: false });

      const statsData = await fetchClubStats(interaction.guildId!);

      if (!statsData.latest.length) {
        await interaction.editReply({
          content: "No club stats available yet. Run /club-analyze to generate data.",
        });
        trackCommand("club-stats", Date.now() - startTime, true);
        return;
      }

      if (format === "csv") {
        const csv = buildCsv(statsData.latest);
        await interaction.editReply({
          content: "Club stats CSV export",
          files: [{ attachment: Buffer.from(csv, "utf8"), name: "club-stats.csv" }],
        });
        trackCommand("club-stats", Date.now() - startTime, true);
        return;
      }

      cleanExpiredSessions();

      const sorted = sortMembers(statsData.latest, metric);
      const totalPages = Math.max(1, Math.ceil(sorted.length / MEMBERS_PER_PAGE));
      const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const session: RosterSession = {
        members: sorted,
        page: 0,
        totalPages,
        metric,
        totalMembers: sorted.length,
        expiresAt: Date.now() + 15 * 60 * 1000,
        messageId: null,
      };
      sessions.set(sessionId, session);

      const embed = buildRosterPage(sorted, 0, totalPages, metric, sorted.length);
      const buttons = buildButtons(session, sessionId);
      const reply = await interaction.editReply({ embeds: [embed], components: [buttons] });
      session.messageId = reply.id;

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: COLLECTOR_TIMEOUT,
      });

      collector.on('collect', async (btn: ButtonInteraction) => {
        const parts = btn.customId.split(':');
        if (parts[0] !== BUTTON_PREFIX || parts.length < 3) return;

        const action = parts[1];
        const sid = parts[2];
        const sess = sessions.get(sid);
        if (!sess) {
          await btn.reply({ content: 'Session expired. Run `/club-stats` again.', flags: MessageFlags.Ephemeral });
          return;
        }

        if (action === 'prev' && sess.page > 0) sess.page--;
        else if (action === 'next' && sess.page < sess.totalPages - 1) sess.page++;

        const updatedEmbed = buildRosterPage(sess.members, sess.page, sess.totalPages, sess.metric, sess.totalMembers);
        const updatedButtons = buildButtons(sess, sid);
        await btn.update({ embeds: [updatedEmbed], components: [updatedButtons] });
      });

      collector.on('end', async () => {
        sessions.delete(sessionId);
        try {
          const finalEmbed = buildRosterPage(session.members, session.page, session.totalPages, session.metric, session.totalMembers);
          await interaction.editReply({ embeds: [finalEmbed], components: [] });
        } catch {
          // message may have been deleted
        }
      });

      trackCommand("club-stats", Date.now() - startTime, true);
    } catch (err) {
      const error = err as Error;
      logger.error("Command failed", error);
      trackCommand("club-stats", Date.now() - startTime, false);
      if (interaction.deferred) {
        await interaction.editReply({ content: `❌ ${error.message}` });
      } else {
        await interaction.reply({ content: `❌ ${error.message}`, flags: MessageFlags.Ephemeral });
      }
    }
  },

  async handleButton(interaction: ButtonInteraction): Promise<void> {
    const parts = String(interaction.customId || '').split(':');
    if (parts[0] !== BUTTON_PREFIX) return;

    cleanExpiredSessions();
    const sid = parts[2];
    const session = sessions.get(sid);
    if (!session) {
      await interaction.reply({ content: 'Session expired. Run `/club-stats` again.', flags: MessageFlags.Ephemeral });
      return;
    }

    const action = parts[1];
    if (action === 'prev' && session.page > 0) session.page--;
    else if (action === 'next' && session.page < session.totalPages - 1) session.page++;

    const embed = buildRosterPage(session.members, session.page, session.totalPages, session.metric, session.totalMembers);
    const buttons = buildButtons(session, sid);
    await interaction.update({ embeds: [embed], components: [buttons] });
  },
};
