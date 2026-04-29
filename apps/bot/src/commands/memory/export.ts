/**
 * Export memories command.
 * Ported from /opt/slimy/app/commands/export.js
 */

import {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  MessageFlags,
  ChatInputCommandInteraction,
} from "discord.js";
import { database } from "../../lib/database.js";
import { memoryStore } from "../../lib/memory.js";

function parseMaybeJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(fallback) && Array.isArray(value)) return value as T;
  if (typeof value === "object" && !Array.isArray(value)) return value as T;
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("export")
    .setDescription("Export your memories (latest 25)"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const userId = interaction.user.id;
      const guildId = interaction.guildId || null;
      const databaseConfigured = database.isConfigured();

      const recordsRaw = databaseConfigured
        ? await database.getMemories(userId, guildId, 25)
        : await memoryStore.listMemos({ userId, guildId, limit: 25 });

      const memories = (recordsRaw || []).map((record: unknown) => {
        const r = record as Record<string, unknown>;
        if (databaseConfigured) {
          return {
            id: (r as { id?: string }).id,
            note: (r as { note?: string }).note,
            tags: parseMaybeJson((r as { tags?: unknown }).tags, []),
            context: parseMaybeJson((r as { context?: unknown }).context, {}),
            createdAt: (r as { createdAt?: string }).createdAt || (r as { created_at?: string }).created_at || null,
          };
        }

        return {
          id: (r as { _id?: string })._id || (r as { id?: string }).id,
          note: (r as { content?: string }).content,
          tags: Array.isArray((r as { tags?: unknown }).tags)
            ? ((r as { tags: unknown[] }).tags as string[])
            : [],
          context: (r as { context?: Record<string, unknown> }).context || {},
          createdAt: (r as { createdAt?: string }).createdAt || null,
        };
      });

      if (memories.length === 0) {
        await interaction.editReply({
          content: "📝 No memories found for this server.\n\nUse `/remember` to save notes!",
        });
        return;
      }

      const payload = JSON.stringify(
        {
          user: interaction.user.id,
          username: interaction.user.username,
          guild: interaction.guildId || null,
          guildName: interaction.guild?.name || "Unknown",
          exportedAt: new Date().toISOString(),
          count: memories.length,
          memories: memories.map((m: Record<string, unknown>) => ({
            id: m.id,
            note: m.note,
            tags: m.tags,
            context: m.context,
            created_at: m.createdAt || m.created_at,
          })),
        },
        null,
        2,
      );

      if (payload.length < 1900) {
        const embed = new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle("📦 Memory Export")
          .setDescription(
            `**Server:** ${interaction.guild?.name}\n**Memories:** ${memories.length}`,
          )
          .setTimestamp();

        (memories as Array<Record<string, unknown>>).slice(0, 5).forEach((mem) => {
          const createdAt = mem.createdAt || mem.created_at;
          const safeNote = String(mem.note || "");
          embed.addFields({
            name: `#${mem.id} - ${createdAt ? new Date(createdAt as string).toLocaleDateString() : "unknown"}`,
            value: safeNote.slice(0, 100) + (safeNote.length > 100 ? "..." : ""),
            inline: false,
          });
        });

        if (memories.length > 5) {
          embed.setFooter({
            text: `Showing 5 of ${memories.length} memories. Download full export below.`,
          });
        }

        const file = new AttachmentBuilder(Buffer.from(payload, "utf8"), {
          name: `slimy-memories-${interaction.user.id}.json`,
        });

        await interaction.editReply({ embeds: [embed], files: [file] });
      } else {
        const file = new AttachmentBuilder(Buffer.from(payload, "utf8"), {
          name: `slimy-memories-${interaction.user.id}.json`,
        });

        await interaction.editReply({
          content: `📦 **${memories.length} memories exported**\n\nServer: ${interaction.guild?.name}`,
          files: [file],
        });
      }
    } catch (err) {
      console.error("[export] Error:", err);
      const errorMsg = "❌ Export failed. Please try again.";
      try {
        await interaction.editReply({ content: errorMsg });
      } catch {
        await interaction.reply({ content: errorMsg, flags: MessageFlags.Ephemeral });
      }
    }
  },
};
