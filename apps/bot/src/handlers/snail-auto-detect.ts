/**
 * Snail Auto-Detect Handler — automatically analyzes snail screenshots.
 * Ported from /opt/slimy/app/handlers/snail-auto-detect.js
 */

import { Events, Message, GuildTextBasedChannel } from 'discord.js';
import { analyzeSnailScreenshot, formatSnailAnalysis } from '../lib/snail-vision.js';
import { getEffectiveModesForChannel } from '../lib/modes.js';

const COOLDOWN_MS = 10000;

const visionCooldown = new Map<string, number>();

export function attachSnailAutoDetect(client: {
  on: (event: string, callback: (...args: never[]) => unknown) => void;
  _snailAutoDetectAttached?: boolean;
}): void {
  if (client._snailAutoDetectAttached) return;
  client._snailAutoDetectAttached = true;

  client.on(Events.MessageCreate, async (message: Message) => {
    try {
      if (message.author.bot) return;
      if (!message.attachments.size) return;

      // Feature gate
      if (process.env.FEATURE_SNAIL_AUTO_DETECT !== "true") return;

      // Check if super_snail mode is active in this channel
      if (!message.guild || !message.channel) return;
      const effectiveModes = getEffectiveModesForChannel(message.guild, message.channel as unknown as import('discord.js').GuildChannel);
      if (!effectiveModes.super_snail) return;

      // Find image attachment
      const imageAttachment = message.attachments.find((att) =>
        att.contentType?.startsWith("image/"),
      );
      if (!imageAttachment) return;

      // Role gating — only Admin/Managers can trigger auto-detect
      const allowedRoleIds = (process.env.SNAIL_ALLOWED_ROLE_IDS || "")
        .split(",")
        .filter(Boolean);
      if (allowedRoleIds.length > 0 && message.member) {
        const hasRole = allowedRoleIds.some((roleId) =>
          (message.member!.roles as unknown as { cache: { has: (id: string) => boolean } }).cache.has(roleId.trim()),
        );
        if (!hasRole) return;
      }

      // Channel containment — also allow threads inside permitted forum channels
      const allowedChannelIds = (process.env.SNAIL_AUTO_DETECT_CHANNEL_IDS || "")
        .split(",")
        .filter(Boolean);
      if (allowedChannelIds.length > 0) {
        const channelId = message.channel.id;
        const parentId = (message.channel as unknown as { parentId?: string }).parentId || "";
        const grandparentId = (message.channel as unknown as { parent?: { parentId?: string } }).parent?.parentId || "";
        const isAllowed = allowedChannelIds.some((id) => {
          const trimmed = id.trim();
          return channelId === trimmed || parentId === trimmed || grandparentId === trimmed;
        });
        if (!isAllowed) return;
      }

      // Cooldown check
      const key = `${message.guildId || "dm"}:${message.author.id}`;
      const now = Date.now();
      const last = visionCooldown.get(key) || 0;
      if (now - last < COOLDOWN_MS) {
        await message.reply({
          content: "⏳ Vision analysis cooldown active. Please wait a moment.",
          allowedMentions: { repliedUser: false },
        }).catch(() => {});
        return;
      }
      visionCooldown.set(key, now);

      // Auto-analyze
      if (message.channel.isTextBased() && 'sendTyping' in message.channel) {
        await (message.channel as GuildTextBasedChannel).sendTyping();
      }

      const analysis = await analyzeSnailScreenshot(imageAttachment.url);
      const response = formatSnailAnalysis(analysis);

      await message.reply({
        content: response,
        allowedMentions: { repliedUser: false },
      });
    } catch (err) {
      console.error("Snail auto-detect error:", err);
      const msg = err instanceof Error ? err.message : "Failed to analyze screenshot";
      await message.reply({
        content: `❌ Vision error: ${msg}`,
        allowedMentions: { repliedUser: false },
      }).catch(() => {});
    }
  });
}

export default { attachSnailAutoDetect };
