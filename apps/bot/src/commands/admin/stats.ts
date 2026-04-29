/**
 * User usage statistics command.
 * Ported from /opt/slimy/app/commands/stats.js
 */

import { SlashCommandBuilder, EmbedBuilder, User, PermissionFlagsBits } from "discord.js";
import { database } from "../../lib/database.js";
import { mcpClient } from "../../lib/mcp-client.js";

const PERIOD_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

const PERIOD_LABELS: Record<string, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "1y": "Last year",
};

async function getLocalStats(userId: string, guildId: string | null, period: string): Promise<{
  messageCount: number;
  imageGenerationCount: number;
  personalityEvents: number;
  snailStats: number;
  lastActive: string | null;
  source: string;
}> {
  if (!database.isConfigured()) {
    return {
      messageCount: 0,
      imageGenerationCount: 0,
      personalityEvents: 0,
      snailStats: 0,
      lastActive: null,
      source: "local fallback (database unavailable)",
    };
  }

  const days = PERIOD_DAYS[period] || PERIOD_DAYS["30d"];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [imageRow] = await database.query<Array<{ total: number; latest: Date | string | null }>>(
    `SELECT COUNT(*) AS total, MAX(created_at) AS latest
     FROM image_generation_log
     WHERE user_id = ?
       AND (? IS NULL OR guild_id <=> ?)
       AND created_at >= ?`,
    [userId, guildId, guildId, since],
  );
  const [personalityRow] = await database.query<Array<{ total: number; latest: Date | string | null }>>(
    `SELECT COUNT(*) AS total, MAX(recorded_at) AS latest
     FROM personality_metrics
     WHERE user_id = ?
       AND (? IS NULL OR guild_id <=> ?)
       AND recorded_at >= ?`,
    [userId, guildId, guildId, since],
  );
  const [snailRow] = await database.query<Array<{ total: number; latest: Date | string | null }>>(
    `SELECT COUNT(*) AS total, MAX(created_at) AS latest
     FROM snail_stats
     WHERE user_id = ?
       AND (? IS NULL OR guild_id <=> ?)
       AND created_at >= ?`,
    [userId, guildId, guildId, since],
  );

  const latestValues = [imageRow?.latest, personalityRow?.latest, snailRow?.latest]
    .filter(Boolean)
    .map((value) => new Date(value as string | Date))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  return {
    messageCount: 0,
    imageGenerationCount: Number(imageRow?.total || 0),
    personalityEvents: Number(personalityRow?.total || 0),
    snailStats: Number(snailRow?.total || 0),
    lastActive: latestValues[0]?.toISOString() || null,
    source: "local database fallback",
  };
}

function buildStatsEmbed(
  targetUser: User,
  period: string,
  stats: {
    messageCount?: number;
    imageGenerationCount?: number;
    personalityEvents?: number;
    snailStats?: number;
    lastActive?: string | null;
    source?: string;
  },
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x00ae86)
    .setTitle(`📊 Stats for ${targetUser.username}`)
    .setThumbnail(targetUser.displayAvatarURL())
    .setDescription(`Statistics for ${PERIOD_LABELS[period] || period}`)
    .addFields(
      {
        name: "💬 Messages",
        value: String(stats.messageCount ?? 0),
        inline: true,
      },
      {
        name: "🎨 Images Generated",
        value: String(stats.imageGenerationCount ?? 0),
        inline: true,
      },
      {
        name: "🐌 Snail Stats",
        value: String(stats.snailStats ?? 0),
        inline: true,
      },
      {
        name: "🎭 Personality Events",
        value: String(stats.personalityEvents ?? 0),
        inline: true,
      },
      {
        name: "⏰ Last Active",
        value: stats.lastActive
          ? `<t:${Math.floor(new Date(stats.lastActive).getTime() / 1000)}:R>`
          : "Never",
        inline: true,
      },
    )
    .setFooter({ text: `User ID: ${targetUser.id}${stats.source ? ` • ${stats.source}` : ""}` })
    .setTimestamp();

  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View your Slimy.ai usage statistics")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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

      let stats: {
        messageCount?: number;
        imageGenerationCount?: number;
        personalityEvents?: number;
        snailStats?: number;
        lastActive?: string | null;
        source?: string;
      };
      try {
        const mcpStats = await mcpClient.getUserStats(
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
        stats = { ...mcpStats.stats, source: "MCP analytics" };
      } catch (error) {
        const msg = (error as Error).message || "";
        if (msg.includes("Authentication") || msg.includes("No authentication token available") || msg.includes("ECONNREFUSED")) {
          console.warn("[stats] MCP unavailable, using local fallback:", msg);
          stats = await getLocalStats(targetUser.id, interaction.guildId, period);
        } else {
          throw error;
        }
      }

      const embed = buildStatsEmbed(targetUser, period, stats);

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      let errorMessage = "❌ Failed to fetch statistics. ";
      const msg = (error as Error).message || "";

      if (msg.includes("ECONNREFUSED")) {
        console.warn("[stats] Analytics service unavailable:", msg);
        errorMessage += "Analytics service is currently unavailable.";
      } else if (msg.includes("Authentication")) {
        console.warn("[stats] Analytics authentication unavailable:", msg);
        errorMessage += "Authentication error with analytics service.";
      } else if (msg.includes("No authentication token available")) {
        console.warn("[stats] Analytics authentication unavailable:", msg);
        errorMessage += "Authentication error with analytics service.";
      } else {
        console.error("[stats] Error:", error);
        errorMessage += "Please try again later.";
      }

      await interaction.editReply({ content: errorMessage });
    }
  },
};
