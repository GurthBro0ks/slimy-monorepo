import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { database } from "../lib/database.js";

function abbreviatePower(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + "B";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
  return value.toLocaleString();
}

function formatRankList(
  rows: { name_display: string; sim_power?: number; total_power?: number }[],
  field: "sim_power" | "total_power",
): string {
  return rows
    .map((row, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
      const power = Number(row[field]) || 0;
      return `${medal} **${row.name_display}** — ${abbreviatePower(power)}`;
    })
    .join("\n");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View club power rankings for this server")
    .addIntegerOption((option) =>
      option
        .setName("limit")
        .setDescription("Number of members to show (default: 10)")
        .setMinValue(5)
        .setMaxValue(25)
        .setRequired(false),
    ),

  async execute(interaction: {
    guildId: string | null;
    options: { getInteger: (name: string) => number | null };
    deferReply: () => Promise<void>;
    editReply: (opts: { embeds?: EmbedBuilder[]; content?: string }) => Promise<void>;
    reply: (opts: { content: string; ephemeral?: boolean }) => Promise<void>;
    guild: { name: string };
  }): Promise<void> {
    try {
      if (!interaction.guildId) {
        await interaction.reply({
          content: "This command can only be used in a server.",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();

      const limit = interaction.options.getInteger("limit") || 10;

      const data = await database.getClubLeaderboard(interaction.guildId, limit);

      if (!data || data.memberCount === 0) {
        await interaction.editReply({
          content:
            "No club data available yet. Use `/club-analyze` and `/club-push` to populate the roster.",
        });
        return;
      }

      const simSection = formatRankList(data.topSim as any[], "sim_power");
      const totalSection = formatRankList(data.topTotal as any[], "total_power");

      let footer = `${data.memberCount} members total`;
      if (data.latestAt) {
        const ts = Math.floor(new Date(data.latestAt).getTime() / 1000);
        footer += ` | Updated: <t:${ts}:R>`;
      }

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("Club Leaderboard")
        .addFields(
          { name: "Top SIM Power", value: simSection, inline: false },
          { name: "Top Total Power", value: totalSection, inline: false },
        )
        .setFooter({ text: footer })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("[leaderboard] Error:", error);
      await interaction.editReply({
        content: "Failed to fetch leaderboard. Please try again later.",
      });
    }
  },
};
