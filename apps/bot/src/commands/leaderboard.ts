/**
 * Super Snail leaderboard command.
 * Ported from /opt/slimy/app/commands/leaderboard.js
 */

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { database } from "../lib/database.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View Super Snail leaderboard for this server")
    .addIntegerOption((option) =>
      option
        .setName("limit")
        .setDescription("Number of users to show (default: 10)")
        .setMinValue(5)
        .setMaxValue(50)
        .setRequired(false),
    ),

  async execute(interaction: {
    guildId: string | null;
    options: { getInteger: (name: string) => number | null };
    deferReply: () => Promise<void>;
    editReply: (opts: { embeds?: EmbedBuilder[]; content?: string }) => Promise<void>;
    reply: (opts: { content: string; ephemeral?: boolean }) => Promise<void>;
    client: { users: { fetch: (id: string) => Promise<{ username: string }> } };
    guild: { name: string };
  }): Promise<void> {
    try {
      if (!interaction.guildId) {
        await interaction.reply({
          content: "❌ This command can only be used in a server.",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();

      const limit = interaction.options.getInteger("limit") || 10;

      const rows = await database.getSnailLeaderboard(interaction.guildId, limit);

      if (!rows || rows.length === 0) {
        await interaction.editReply({
          content:
            "📊 No activity data available yet. Use bot commands like `/dream`, `/snail analyze`, or `/chat` to get on the board!",
        });
        return;
      }

      const leaderboardText = await Promise.all(
        rows.map(async (entry: Record<string, unknown>, index: number) => {
          const medal =
            index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";

          const userId = String(entry.userId ?? '');
          let username = `User ${userId}`;
          try {
            const user = await interaction.client.users.fetch(userId);
            username = user.username;
          } catch {
          }

          const count = Number(entry.analysis_count) || 0;
          const lastAnalysis = entry.last_analysis
            ? `<t:${Math.floor(new Date(String(entry.last_analysis)).getTime() / 1000)}:R>`
            : "Never";

          return `${medal} **${index + 1}.** ${username} - ${count} ${count === 1 ? "action" : "actions"} (Last: ${lastAnalysis})`;
        }),
      );

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("🏆 Server Leaderboard")
        .setDescription(leaderboardText.join("\n"))
        .setFooter({
          text: `Top ${limit} users in ${interaction.guild.name}`,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("[leaderboard] Error:", error);
      await interaction.editReply({ content: "❌ Failed to fetch leaderboard. Please try again later." });
    }
  },
};
