/**
 * Club Stats — Weekly club stats with movers and aggregates.
 * Ported from /opt/slimy/app/commands/club-stats.js
 */

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
} from 'discord.js';
import { fetchClubStats, buildClubStatsEmbed, buildCsv } from '../lib/club-stats-service.js';
import { database } from '../lib/database.js';
import { trackCommand } from '../lib/metrics.js';

const DEFAULT_TOP = 10;
const MIN_TOP = 3;
const MAX_TOP = 25;

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
    .setDescription("Show weekly club stats with movers and aggregates.")
    .addStringOption((option) =>
      option
        .setName("metric")
        .setDescription("Which metric to display")
        .setRequired(false)
        .addChoices(
          { name: "Both", value: "both" },
          { name: "Total Power", value: "total" },
          { name: "Sim Power", value: "sim" },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("top")
        .setDescription(`Top N gainers/losers (${MIN_TOP}-${MAX_TOP})`)
        .setMinValue(MIN_TOP)
        .setMaxValue(MAX_TOP)
        .setRequired(false),
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
          ephemeral: true,
        });
        return;
      }

      const metric = interaction.options.getString("metric") || "both";
      const top = interaction.options.getInteger("top") || DEFAULT_TOP;
      const safeTop = Math.max(MIN_TOP, Math.min(MAX_TOP, top));
      const format = interaction.options.getString("format") || "embed";

      await interaction.deferReply({ ephemeral: false });

      const statsData = await fetchClubStats(interaction.guildId!, {
        metric,
        top: safeTop,
      });

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
          files: [
            {
              attachment: Buffer.from(csv, "utf8"),
              name: "club-stats.csv",
            },
          ],
        });
        trackCommand("club-stats", Date.now() - startTime, true);
        return;
      }

      const { embed, components } = buildClubStatsEmbed(interaction.guildId!, statsData, { metric });

      await interaction.editReply({
        embeds: [embed],
        components,
      });

      trackCommand("club-stats", Date.now() - startTime, true);
    } catch (err) {
      const error = err as Error;
      console.error("[club-stats] Failed", { error: error.message });
      trackCommand("club-stats", Date.now() - startTime, false);
      if (interaction.deferred) {
        await interaction.editReply({ content: `❌ ${error.message}` });
      } else {
        await interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
      }
    }
  },
};
