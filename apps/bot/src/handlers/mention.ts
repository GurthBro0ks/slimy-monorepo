/**
 * Bot mention handler — responds when the bot is mentioned.
 * Ported from /opt/slimy/app/handlers/mention.js
 */

import { Events, Client, GuildChannel } from "discord.js";
import { runConversation, getEffectiveModesForChannel } from "../lib/chat-shared.js";
import { maybeReplyWithImage } from "../lib/auto-image.js";
import { detectImageIntent } from "../lib/image-intent.js";
import { hasConfiguredProvider } from "../lib/llm-fallback.js";
import { messageQueue } from "../lib/message-queue.js";

const COOLDOWN_MS = 5000;
const mentionCooldown = new Map<string, number>();

export function attachMentionHandler(client: Client): void {
  if ((client as unknown as Record<string, boolean>)._mentionHandlerAttached) {
    console.log("[mention-handler] ALREADY ATTACHED - SKIPPING");
    return;
  }
  console.log("[mention-handler] ATTACHING NOW");
  (client as unknown as Record<string, boolean>)._mentionHandlerAttached = true;

  const markReady = (): void => {
    (client as unknown as Record<string, boolean>).mentionHandlerReady = true;
  };
  (client as unknown as Record<string, boolean>).mentionHandlerReady = false;
  if (client.isReady()) {
    markReady();
  } else {
    client.once(Events.ClientReady, markReady);
  }

  client.on(Events.MessageCreate, async (message) => {
    try {
      if (!client.user) return;
      if (message.author.bot) return;

      if (!message.mentions.users.has(client.user.id)) return;

      console.log(
        `[mention-handler] Processing mention from ${message.author.tag}`,
      );

      const mentionRegex = new RegExp(`<@!?${client.user.id}>`, "g");
      const clean = (message.content || "").replace(mentionRegex, "").trim();

      if (!clean) {
        await message.reply({
          content:
            "👋 Drop a message or question with your mention so I can help.",
          allowedMentions: { repliedUser: false },
        });
        return;
      }

      await messageQueue.enqueue(async () => {
        const key = `${message.guildId || "dm"}:${message.author.id}`;
        const now = Date.now();
        const last = mentionCooldown.get(key) || 0;
        const imageIntent = detectImageIntent(clean);

        if (!imageIntent && now - last < COOLDOWN_MS) return;
        mentionCooldown.set(key, now);

        if (!hasConfiguredProvider()) {
          await message.reply({
            content: "❌ No LLM provider is configured.",
            allowedMentions: { repliedUser: false },
          });
          return;
        }

        const parentId =
          (message.channel as { parentId?: string } | null)?.parentId ||
          (message.channel as { parent?: { id?: string } } | null)?.parent?.id;
        const effectiveModes = getEffectiveModesForChannel(
          message.guild,
          message.channel as unknown as GuildChannel | null,
        );
        const rating = effectiveModes.rating_unrated
          ? "unrated"
          : effectiveModes.rating_pg13
            ? "pg13"
            : "default";

        const handledImage = await maybeReplyWithImage({
          message,
          prompt: clean,
          rating,
        });
        if (handledImage) return;

        const result = await runConversation({
          userId: message.author.id,
          channelId: message.channelId,
          guildId: message.guildId || undefined,
          parentId,
          userMsg: clean,
        });

        console.log(
          `[mention-handler] Sending response to ${message.author.tag}`,
        );
        await message.reply({
          content: result.response,
          allowedMentions: { repliedUser: false },
        });
      });
    } catch (err) {
      console.error("Mention handler error:", err);
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message ||
        (err as Error).message ||
        String(err);
      await message
        .reply({
          content: `❌ LLM error: ${msg}`,
          allowedMentions: { repliedUser: false },
        })
        .catch(() => {});
    }
  });
}
