/**
 * User usage statistics command.
 * Ported from /opt/slimy/app/commands/stats.js
 */

import { SlashCommandBuilder, EmbedBuilder, User } from "discord.js";
import { mcpClient } from "../lib/mcp-client.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View your Slimy.ai usage statistics")
    .addUserOption((option) =>
      option.setName("user").setDescription("User to view stats for (admin/club only)").setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("period").setDescription("Time period for stats").addChoices(
        { name: "7 days", value: "7d" },
        { name: "30 days", value: "30d" },
        { name: "90 days", value: "90d" },
        { name: "1 year", value: "1y" },
      ).setRequired(false),
    ),

  async execute(interaction: {
    options: {
      getUser: (name: string) => { id: string; username: string; displayAvatarURL: () => string; displayName: string } | null;
      getString: (name: string) => string | null;
    };
    user: { id: string };
    member: {
      permissions: { has: (perm: string) => boolean };
      roles: { cache: { some: (pred: (role: { name: string }) => boolean) => boolean } };
    } | null;
    guildId: string | null;
    deferReply: (opts: { ephemeral: boolean }) => Promise<void>;
    editReply: (opts: { embeds?: EmbedBuilder[]; content?: string }) => Promise<void>;
    reply: (opts: { content: string; ephemeral?: boolean }) => Promise<void>;
  }): Promise<void> {
    try {
      await interaction.deferReply({ ephemeral: true });

      const optUser = interaction.options.getUser("user");
      const targetUser: User = (optUser ?? interaction.user) as User;
      const period = interaction.options.getString("period") || "30d";

      if (targetUser.id !== interaction.user.id) {
        const member = interaction.member;
        const isAdmin = member?.permissions.has("Administrator");
        const hasModRole = member?.roles.cache.some((role: { name: string }) =>
          role.name.toLowerCase().includes("mod") ||
          role.name.toLowerCase().includes("club"),
        );

        if (!isAdmin && !hasModRole) {
          await interaction.editReply({
            content:
              "❌ You can only view your own statistics unless you have admin/club permissions.",
          });
          return;
        }
      }

      const stats = await mcpClient.getUserStats(
        targetUser.id,
        interaction.guildId,
        period,
      ) as {
        stats: {
          messageCount?: number;
          imageGenerationCount?: number;
          lastActive?: string;
        };
      };

      const periodLabels: Record<string, string> = {
        "7d": "Last 7 days",
        "30d": "Last 30 days",
        "90d": "Last 90 days",
        "1y": "Last year",
      };

      const embed = new EmbedBuilder()
        .setColor(0x00ae86)
        .setTitle(`📊 Stats for ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .setDescription(`Statistics for ${periodLabels[period]}`)
        .addFields(
          {
            name: "💬 Messages",
            value: String(stats.stats?.messageCount ?? 0),
            inline: true,
          },
          {
            name: "🎨 Images Generated",
            value: String(stats.stats?.imageGenerationCount ?? 0),
            inline: true,
          },
          {
            name: "⏰ Last Active",
            value: stats.stats?.lastActive
              ? `<t:${Math.floor(new Date(stats.stats.lastActive).getTime() / 1000)}:R>`
              : "Never",
            inline: true,
          },
        )
        .setFooter({ text: `User ID: ${targetUser.id}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("[stats] Error:", error);

      let errorMessage = "❌ Failed to fetch statistics. ";
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
