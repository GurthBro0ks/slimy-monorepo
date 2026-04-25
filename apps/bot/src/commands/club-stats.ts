/**
 * Club Stats — Paginated roster of all club members with metric toggle.
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
const COLLECTOR_TIMEOUT = 300_000;
type Metric = 'sim' | 'total' | 'both';

interface RosterSession {
  allMembers: ReturnType<typeof sortMembers>;
  page: number;
  totalPages: number;
  metric: Metric;
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

function resolveMetric(raw: string | null): Metric {
  if (raw === 'sim') return 'sim';
  if (raw === 'total') return 'total';
  return 'total';
}

function getSortMetric(m: Metric): string {
  return m === 'sim' ? 'sim' : 'total';
}

function buildMetricButtons(session: RosterSession, sessionId: string): ActionRowBuilder<ButtonBuilder> {
  const metrics: Metric[] = ['sim', 'total', 'both'];
  const labels: Record<Metric, string> = { sim: 'Sim Power', total: 'Total Power', both: 'Both' };
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...metrics.map(m =>
      new ButtonBuilder()
        .setCustomId(`${BUTTON_PREFIX}:metric-${m}:${sessionId}`)
        .setLabel(labels[m])
        .setStyle(session.metric === m ? ButtonStyle.Primary : ButtonStyle.Secondary),
    ),
  );
}

function buildNavButtons(session: RosterSession, sessionId: string): ActionRowBuilder<ButtonBuilder> {
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

function buildAllButtons(session: RosterSession, sessionId: string): ActionRowBuilder<ButtonBuilder>[] {
  return [buildMetricButtons(session, sessionId), buildNavButtons(session, sessionId)];
}

function recomputeSession(session: RosterSession): void {
  const sorted = sortMembers(session.allMembers, getSortMetric(session.metric));
  session.allMembers = sorted;
  session.totalPages = Math.max(1, Math.ceil(sorted.length / MEMBERS_PER_PAGE));
  session.page = 0;
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

      const sorted = sortMembers(statsData.latest, getSortMetric(metric));
      const totalPages = Math.max(1, Math.ceil(sorted.length / MEMBERS_PER_PAGE));
      const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const session: RosterSession = {
        allMembers: sorted,
        page: 0,
        totalPages,
        metric,
        totalMembers: sorted.length,
        expiresAt: Date.now() + 15 * 60 * 1000,
        messageId: null,
      };
      sessions.set(sessionId, session);

      const embed = buildRosterPage(sorted, 0, totalPages, getSortMetric(metric), sorted.length);
      const buttons = buildAllButtons(session, sessionId);
      const reply = await interaction.editReply({ embeds: [embed], components: buttons });
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

        if (action.startsWith('metric-')) {
          const newMetric = action.replace('metric-', '') as Metric;
          if (newMetric !== sess.metric) {
            sess.metric = newMetric;
            recomputeSession(sess);
          }
        } else if (action === 'prev' && sess.page > 0) {
          sess.page--;
        } else if (action === 'next' && sess.page < sess.totalPages - 1) {
          sess.page++;
        }

        const updatedEmbed = buildRosterPage(sess.allMembers, sess.page, sess.totalPages, getSortMetric(sess.metric), sess.totalMembers);
        const updatedButtons = buildAllButtons(sess, sid);
        await btn.update({ embeds: [updatedEmbed], components: updatedButtons });
      });

      collector.on('end', async () => {
        sessions.delete(sessionId);
        try {
          const finalEmbed = buildRosterPage(session.allMembers, session.page, session.totalPages, getSortMetric(session.metric), session.totalMembers);
          await interaction.editReply({ embeds: [finalEmbed], components: [] });
        } catch {
          // message may have been deleted
        }
      });

      trackCommand("club-stats", Date.now() - startTime, true);
    } catch (err) {
      const error = err as Error;
      logger.error('Command failed', error);
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

    if (action.startsWith('metric-')) {
      const newMetric = action.replace('metric-', '') as Metric;
      if (newMetric !== session.metric) {
        session.metric = newMetric;
        recomputeSession(session);
      }
    } else if (action === 'prev' && session.page > 0) {
      session.page--;
    } else if (action === 'next' && session.page < session.totalPages - 1) {
      session.page++;
    }

    const embed = buildRosterPage(session.allMembers, session.page, session.totalPages, getSortMetric(session.metric), session.totalMembers);
    const buttons = buildAllButtons(session, sid);
    await interaction.update({ embeds: [embed], components: buttons });
  },
};
