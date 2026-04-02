/**
 * AI chat command with conversation history.
 * Ported from /opt/slimy/app/commands/chat.js
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, GuildChannel } from "discord.js";
import { maybeReplyWithImage } from "../lib/auto-image.js";
import { formatChatDisplay } from "../lib/text-format.js";
import { rateLimiter } from "../lib/rate-limiter.js";
import { metrics } from "../lib/metrics.js";
import { hasConfiguredProvider } from "../lib/llm-fallback.js";
import { messageQueue } from "../lib/message-queue.js";
import { logError } from "../lib/logger.js";
import { runConversation, getEffectiveModesForChannel } from "../lib/chat-shared.js";

export { runConversation, getEffectiveModesForChannel };

module.exports = {
  data: new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Chat with slimy.ai")
    .addStringOption((o) =>
      o.setName("message").setDescription("Your message").setRequired(true),
    )
    .addBooleanOption((o) =>
      o.setName("reset").setDescription("Start a fresh conversation"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const startTime = Date.now();
    const userMsg = interaction.options.getString("message", true);
    const reset = interaction.options.getBoolean("reset") || false;

    const check = rateLimiter.checkCooldown(interaction.user.id, "chat", 5);
    if (check.limited) {
      metrics.trackCommand("chat", Date.now() - startTime, false);
      await interaction.reply({
        content: `⏳ Slow down! Please wait ${check.remaining}s before chatting again.`,
      });
      return;
    }

    if (!hasConfiguredProvider()) {
      metrics.trackCommand("chat", Date.now() - startTime, false);
      await interaction.reply({
        content: "❌ No LLM provider is configured.",
      });
      return;
    }

    await interaction.deferReply();

    await messageQueue.enqueue(async () => {
      try {
        const parentId =
          (interaction.channel as { parentId?: string } | null)?.parentId ||
          (interaction.channel as { parent?: { id: string } } | null)?.parent?.id;
        const effectiveModes = getEffectiveModesForChannel(
          interaction.guild,
          interaction.channel as unknown as GuildChannel | null,
        );

        const rating = effectiveModes.rating_unrated
          ? "unrated"
          : effectiveModes.rating_pg13
            ? "pg13"
            : "default";

        const handledImage = await maybeReplyWithImage({
          interaction,
          prompt: userMsg,
          rating,
        });
        if (handledImage) return;

        const result = await runConversation({
          userId: interaction.user.id,
          channelId: interaction.channelId,
          guildId: interaction.guildId || undefined,
          parentId,
          userMsg,
          reset,
          effectiveOverride: effectiveModes,
        });

        const userLabel =
          ((interaction.member as GuildMember | null)?.displayName ?? interaction.user.username) as string;
        const content = formatChatDisplay({
          userLabel,
          userMsg,
          persona: result.persona,
          response: result.response,
        });
        await interaction.editReply({ content });
        metrics.trackCommand("chat", Date.now() - startTime, true);
      } catch (err) {
        metrics.trackCommand("chat", Date.now() - startTime, false);
        metrics.trackError("chat_command", (err as Error).message);
        logError("Chat command failed", undefined, {
          userId: interaction.user.id,
          error: (err as Error).message,
        });
        console.error("LLM error:", err);
        const msg = (err as Error).message || String(err);
        await interaction.editReply({ content: `❌ LLM error: ${msg}` });
      }
    });
  },
};
