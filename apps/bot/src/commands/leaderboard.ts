/**
 * Super Snail leaderboard command.
 * Ported from /opt/slimy/app/commands/leaderboard.js
 */

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { mcpClient } from "../lib/mcp-client.js";

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

      const result = await mcpClient.getSnailLeaderboard(interaction.guildId, limit) as {
        leaderboard?: Array<{
          userId: string;
          analysis_count?: number;
          last_analysis?: string;
        }>;
      };

      if (
        !result.leaderboard ||
        result.leaderboard.length === 0
      ) {
        await interaction.editReply({
          content:
            "📊 No leaderboard data available yet. Start analyzing screenshots with `/snail analyze`!",
        });
        return;
      }

      const leaderboardText = await Promise.all(
        result.leaderboard.map(async (entry, index) => {
          const medal =
            index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";

          let username = `User ${entry.userId}`;
          try {
            const user = await interaction.client.users.fetch(entry.userId);
            username = user.username;
          } catch {
            // User not found or left server
          }

          const count = entry.analysis_count || 0;
          const lastAnalysis = entry.last_analysis
            ? `<t:${Math.floor(new Date(entry.last_analysis).getTime() / 1000)}:R>`
            : "Never";

          return `${medal} **${index + 1}.** ${username} - ${count} ${count === 1 ? "analysis" : "analyses"} (Last: ${lastAnalysis})`;
        }),
      );

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("🏆 Super Snail Leaderboard")
        .setDescription(leaderboardText.join("\n"))
        .setFooter({
          text: `Top ${limit} players in ${interaction.guild.name}`,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("[leaderboard] Error:", error);

      let errorMessage = "❌ Failed to fetch leaderboard. ";
      const msg = (error as Error).message || "";

      if (msg.includes("ECONNREFUSED")) {
        errorMessage += "Analytics service is currently unavailable.";
      } else if (msg.includes("Authentication")) {
        errorMessage += "Authentication error with analytics service.";
      } else {
        errorMessage += "Please try again later.";
      }

      await interaction.editReply({ content: errorMessage });
    }
  },
};
