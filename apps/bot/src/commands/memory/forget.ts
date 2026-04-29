/**
 * Delete memories command.
 * Ported from /opt/slimy/app/commands/forget.js
 */

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { database } from "../../lib/database.js";
import { memoryStore } from "../../lib/memory.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("forget")
    .setDescription("Delete memories")
    .addStringOption((o) =>
      o
        .setName("id")
        .setDescription(
          'Memory ID to delete (use /export to see IDs), or "ALL" to delete everything',
        )
        .setRequired(true),
    ),

  async execute(interaction: {
    options: { getString: (name: string, required?: boolean) => string };
    user: { id: string };
    guildId: string | null;
    guild: { name: string } | null;
    deferReply: (opts: { flags: MessageFlags }) => Promise<void>;
    editReply: (opts: { embeds?: EmbedBuilder[]; content?: string }) => Promise<void>;
    reply: (opts: { content: string; flags: MessageFlags }) => Promise<void>;
  }): Promise<void> {
    try {
      const id = interaction.options.getString("id", true);
      const userId = interaction.user.id;
      const guildId = interaction.guildId || null;

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      if (id.toUpperCase() === "ALL") {
        const deleted = database.isConfigured()
          ? await database.deleteAllMemories(userId, guildId)
          : await memoryStore.deleteAllMemos({ userId, guildId });

        const embed = new EmbedBuilder()
          .setColor(0xff6b6b)
          .setTitle("🧽 All Memories Deleted")
          .setDescription(
            `Deleted **${deleted} ${deleted === 1 ? "memory" : "memories"}** from **${interaction.guild?.name}**`,
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const deleted = database.isConfigured()
        ? await database.deleteMemory(userId, guildId, id.trim())
        : await memoryStore.deleteMemo({ id: id.trim(), userId, guildId });

      if (deleted) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle("✅ Memory Deleted")
          .setDescription(`Memory #${id} has been removed`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          content: `❌ Memory #${id} not found or you don't have permission to delete it.`,
        });
      }
    } catch (err) {
      console.error("[forget] Error:", err);
      const errorMsg = "❌ Failed to delete memory. Please try again.";
      try {
        await interaction.editReply({ content: errorMsg });
      } catch {
        await interaction.reply({ content: errorMsg, flags: MessageFlags.Ephemeral });
      }
    }
  },
};
