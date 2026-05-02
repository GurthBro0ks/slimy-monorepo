/**
 * Save a memory command.
 * Ported from /opt/slimy/app/commands/remember.js
 */

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { database } from "../../lib/database.js";
import { memoryStore } from "../../lib/memory.js";
import { rateLimiter } from "../../lib/rate-limiter.js";
import { metrics } from "../../lib/metrics.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remember")
    .setDescription("Save a memory (server-wide memory with /consent)")
    .addStringOption((o) =>
      o.setName("note").setDescription("What should I remember?").setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("tags").setDescription("Optional tags (comma-separated)").setRequired(false),
    ),

  async execute(interaction: {
    options: {
      getString: (name: string, required?: boolean) => string | null;
    };
    user: { id: string };
    guildId: string | null;
    guild: { name: string } | null;
    channelId: string;
    channel: { name?: string };
    deferReply: (opts: { flags: MessageFlags }) => Promise<void>;
    editReply: (opts: { embeds?: EmbedBuilder[] }) => Promise<void>;
    reply: (opts: { content: string; flags: MessageFlags }) => Promise<void>;
  }): Promise<void> {
    const startTime = Date.now();

    try {
      const check = rateLimiter.checkCooldown(interaction.user.id, "remember", 3);
      if (check.limited) {
        metrics.trackCommand("remember", Date.now() - startTime, false);
        await interaction.reply({
          content: `⏳ Slow down! Please wait ${check.remaining}s before saving another memory.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const note = interaction.options.getString("note", true);
      const tagsInput = interaction.options.getString("tags");
      const tags = tagsInput ? tagsInput.split(",").map((t) => t.trim()) : [];
      const userId = interaction.user.id;
      const guildId = interaction.guildId || null;

      const hasConsent = database.isConfigured()
        ? await database.getUserConsent(userId)
        : await memoryStore.getConsent({ userId, guildId });

      if (!hasConsent) {
        await interaction.reply({
          content:
            "❌ Memory consent required.\n\nEnable it with `/consent set allow:true`.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const context = {
        channelId: interaction.channelId,
        channelName: interaction.channel?.name || "unknown",
        timestamp: Date.now(),
      };

      let memoryRecord: { id?: string; _id?: string } | null = null;
      const safeGuildId: string | null = guildId ?? null;
      const safeNote: string = note as string;
      if (database.isConfigured()) {
        memoryRecord = await database.saveMemory(userId, safeGuildId, safeNote, tags, context);
      } else {
        memoryRecord = await memoryStore.addMemo({ userId, guildId: safeGuildId, content: safeNote, tags, context });
      }

      const memoryId = memoryRecord?.id || memoryRecord?._id || "unknown";

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("📝 Memory Saved")
        .setDescription(`**Note:** ${note}`)
        .addFields(
          { name: "Memory ID", value: `\`${memoryId}\``, inline: true },
          {
            name: "Server",
            value: interaction.guild?.name || "Unknown",
            inline: true,
          },
        )
        .setTimestamp();

      if (tags.length > 0) {
        embed.addFields({
          name: "Tags",
          value: tags.map((t) => `\`${t}\``).join(" "),
          inline: false,
        });
      }

      embed.setFooter({
        text: "Use /export to view all memories or /forget to delete",
      });

      metrics.trackCommand("remember", Date.now() - startTime, true);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      metrics.trackCommand("remember", Date.now() - startTime, false);
      metrics.trackError("remember_command", (err as Error).message);
      console.error("[remember] Error:", err);

      const errorMsg = "❌ Failed to save memory. Please try again.";

      try {
        await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(errorMsg)] });
      } catch {
        await interaction.reply({
          content: errorMsg,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
