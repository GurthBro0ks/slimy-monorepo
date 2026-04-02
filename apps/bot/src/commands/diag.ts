/**
 * System diagnostics command.
 * Ported from /opt/slimy/app/commands/diag.js
 */

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { exec as execCallback } from "child_process";
import { promisify } from "util";
import { database } from "../lib/database.js";
import { metrics } from "../lib/metrics.js";

const execPromise = promisify(execCallback);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("diag")
    .setDescription("Comprehensive health check and diagnostics"),

  async execute(interaction: {
    deferReply: (opts: { ephemeral: boolean }) => Promise<void>;
    editReply: (opts: { embeds: EmbedBuilder[] }) => Promise<void>;
    client: {
      ws: { ping: number };
      guilds: { cache: { size: number } };
      users: { cache: { size: number } };
    };
  }): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle("🔧 Slimy.AI Diagnostics v2.1")
      .setColor(0x00ff00)
      .setTimestamp();

    // System uptime
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    embed.addFields({
      name: "⏱️ Bot Uptime",
      value: `${days}d ${hours}h ${minutes}m`,
      inline: true,
    });

    // Memory usage
    const mem = process.memoryUsage();
    embed.addFields({
      name: "💾 Memory Usage",
      value: `Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB\nRSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
      inline: true,
    });

    // Database connection
    try {
      if (database.isConfigured()) {
        await database.testConnection();
        const pool = database.getPool();

        try {
          const [memoryCount] = await pool.query(
            "SELECT COUNT(*) as count FROM memories",
          ) as unknown as [Array<{ count: number }>];
          const [imageCount] = await pool.query(
            "SELECT COUNT(*) as count FROM image_generation_log",
          ) as unknown as [Array<{ count: number }>];
          const [snailCount] = await pool.query(
            "SELECT COUNT(*) as count FROM snail_stats",
          ) as unknown as [Array<{ count: number }>];

          embed.addFields({
            name: "🗄️ Database",
            value: `✅ Connected\nMemories: ${memoryCount[0]?.count ?? 0}\nImages: ${imageCount[0]?.count ?? 0}\nSnails: ${snailCount[0]?.count ?? 0}`,
            inline: false,
          });
        } catch {
          embed.addFields({
            name: "🗄️ Database",
            value: "✅ Connected (stats unavailable)",
            inline: false,
          });
        }
      } else {
        embed.addFields({
          name: "🗄️ Database",
          value: "⚠️ Not configured",
          inline: false,
        });
      }
    } catch (err) {
      embed.addFields({
        name: "🗄️ Database",
        value: `❌ Error: ${(err as Error).message}`,
        inline: false,
      });
    }

    // Command metrics
    try {
      const stats = metrics.getStats();

      embed.addFields({
        name: "📊 Command Statistics",
        value: `Total: ${stats.summary.totalCommands}\nSuccess Rate: ${stats.summary.successRate}\nErrors: ${stats.summary.totalErrors}`,
        inline: false,
      });

      const topCommands = Object.entries(stats.commands)
        .sort(([, a], [, b]) => (b as { count: number }).count - (a as { count: number }).count)
        .slice(0, 3)
        .map(([cmd, data]) => `\`/${cmd}\`: ${(data as { count: number }).count} (${(data as { avgTime: string }).avgTime})`)
        .join("\n") || "No commands executed yet";

      embed.addFields({
        name: "🔥 Top Commands",
        value: topCommands,
        inline: false,
      });
    } catch {
      embed.addFields({
        name: "📊 Metrics",
        value: "⚠️ Metrics system unavailable",
        inline: false,
      });
    }

    // Git commit
    try {
      const { stdout } = await execPromise("git rev-parse --short HEAD");
      const commit = stdout.trim();
      embed.addFields({
        name: "📝 Git Commit",
        value: `\`${commit}\``,
        inline: true,
      });
    } catch {
      // Git not available
    }

    // Discord.js info
    embed.addFields({
      name: "🤖 Bot Info",
      value: `Ping: ${interaction.client.ws.ping}ms\nGuilds: ${interaction.client.guilds.cache.size}\nUsers: ${interaction.client.users.cache.size}`,
      inline: true,
    });

    // Health check endpoint
    embed.addFields({
      name: "🏥 Health Endpoints",
      value: `http://localhost:${process.env.HEALTH_PORT || 3000}/health\nhttp://localhost:${process.env.HEALTH_PORT || 3000}/metrics`,
      inline: false,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
