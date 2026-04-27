import { execFile } from 'node:child_process';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import {
  ChannelType,
  ChatInputCommandInteraction,
  GuildMember,
  Message,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import {
  buildChannelExportMarkdown,
  slugify,
  type ExportMessage,
} from '../lib/channelExporter.js';
import { safeHandler } from '../lib/errorHandler.js';
import { createLogger } from '../lib/logger.js';

const execFileAsync = promisify(execFile);
const logger = createLogger({ context: 'read-channel' });

const DEFAULT_EXPORT_ROOT = '/home/slimy/kb/raw/discord-exports';
const MAX_LIMIT = 10000;

type FetchableTextChannel = {
  id: string;
  name?: string;
  type?: ChannelType;
  isThread?: () => boolean;
  messages: {
    fetch: (opts: { limit: number; before?: string }) => Promise<{
      size: number;
      values: () => IterableIterator<Message>;
      last: () => Message | undefined;
    }>;
  };
};

function hasAllowedRole(member: ChatInputCommandInteraction['member'], roleId?: string): boolean {
  if (!roleId || !member) return false;
  if (member instanceof GuildMember) return member.roles.cache.has(roleId);
  const roles = member.roles;
  return Array.isArray(roles) ? roles.includes(roleId) : false;
}

function canReadChannel(interaction: ChatInputCommandInteraction): boolean {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) return true;
  return hasAllowedRole(interaction.member, process.env.READ_CHANNEL_ROLE_ID);
}

function isFetchableTextChannel(channel: unknown): channel is FetchableTextChannel {
  return Boolean(
    channel &&
      typeof channel === 'object' &&
      'messages' in channel &&
      typeof (channel as FetchableTextChannel).messages?.fetch === 'function',
  );
}

function channelDisplayName(channel: FetchableTextChannel): string {
  return channel.name || channel.id;
}

function toExportMessage(message: Message): ExportMessage {
  const memberDisplay = message.member?.displayName ?? null;
  return {
    id: message.id,
    createdAt: message.createdAt,
    content: message.content ?? '',
    author: {
      tag: message.author.tag,
      username: message.author.username,
      globalName: message.author.globalName,
      displayName: memberDisplay,
    },
    attachments: Array.from(message.attachments.values()).map((attachment) => ({
      name: attachment.name || attachment.id,
      url: attachment.url,
    })),
    embeds: message.embeds.map((embed) => ({
      title: embed.title,
      url: embed.url,
    })),
    referencedMessageId: message.reference?.messageId ?? null,
  };
}

async function fetchHistory(channel: FetchableTextChannel, requestedLimit: number): Promise<ExportMessage[]> {
  const messages: ExportMessage[] = [];
  const hardLimit = requestedLimit > 0 ? Math.min(requestedLimit, MAX_LIMIT) : MAX_LIMIT;
  let before: string | undefined;
  let nextLogAt = 500;

  while (messages.length < hardLimit) {
    const batchLimit = Math.min(100, hardLimit - messages.length);
    const batch = await channel.messages.fetch({ limit: batchLimit, before });
    if (batch.size === 0) break;

    for (const message of batch.values()) {
      messages.push(toExportMessage(message));
    }

    before = batch.last()?.id;
    if (!before) break;

    if (messages.length >= nextLogAt) {
      logger.info('Channel export progress', {
        channelId: channel.id,
        messageCount: messages.length,
      });
      nextLogAt += 500;
    }

    if (batch.size < batchLimit) break;
  }

  return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

async function uniqueExportPath(root: string, guildSlug: string, channelSlug: string, exportedAt: Date): Promise<string> {
  const yyyyMmDd = exportedAt.toISOString().slice(0, 10);
  const dir = path.join(root, yyyyMmDd);
  await mkdir(dir, { recursive: true });

  const base = path.join(dir, `${guildSlug}-${channelSlug}.md`);
  try {
    await stat(base);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return base;
    throw err;
  }

  const timestamp = exportedAt.toISOString().replace(/[-:.]/g, '').slice(0, 15);
  return path.join(dir, `${guildSlug}-${channelSlug}-${timestamp}.md`);
}

async function syncKb(): Promise<{ ok: boolean; stderr: string }> {
  try {
    const result = await execFileAsync('bash', ['/home/slimy/kb/tools/kb-sync.sh', 'push'], {
      timeout: 120000,
      maxBuffer: 1024 * 1024,
    });
    return { ok: true, stderr: result.stderr };
  } catch (err) {
    const execErr = err as Error & { stderr?: string };
    return { ok: false, stderr: execErr.stderr || execErr.message };
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('read-channel')
    .setDescription('Export a Discord channel or thread to an Obsidian-ready Markdown file')
    .addChannelOption((opt) =>
      opt
        .setName('channel')
        .setDescription('Channel or thread to export (defaults to current channel)')
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.PublicThread,
          ChannelType.PrivateThread,
          ChannelType.AnnouncementThread,
          ChannelType.GuildAnnouncement,
        )
        .setRequired(false),
    )
    .addIntegerOption((opt) =>
      opt
        .setName('limit')
        .setDescription('Max messages to export; 0 means all up to 10000')
        .setMinValue(0)
        .setMaxValue(MAX_LIMIT)
        .setRequired(false),
    )
    .addBooleanOption((opt) =>
      opt
        .setName('include_attachments')
        .setDescription('Include attachment links (default: true)')
        .setRequired(false),
    )
    .addBooleanOption((opt) =>
      opt
        .setName('include_embeds')
        .setDescription('Include embed titles and links (default: true)')
        .setRequired(false),
    ),

  execute: safeHandler(async (interaction: ChatInputCommandInteraction): Promise<void> => {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!canReadChannel(interaction)) {
      await interaction.reply({
        content: 'You need Manage Channels or the configured read-channel role to use this command.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const selected = interaction.options.getChannel('channel') ?? interaction.channel;
      if (!isFetchableTextChannel(selected)) {
        await interaction.editReply('That channel does not expose fetchable message history.');
        return;
      }

      const limit = interaction.options.getInteger('limit') ?? 0;
      const includeAttachments = interaction.options.getBoolean('include_attachments') ?? true;
      const includeEmbeds = interaction.options.getBoolean('include_embeds') ?? true;
      const exportedAt = new Date();
      const guildSlug = slugify(interaction.guild.name);
      const channelName = channelDisplayName(selected);
      const channelSlug = slugify(channelName);
      const exportRoot = process.env.KB_EXPORT_ROOT || DEFAULT_EXPORT_ROOT;

      const messages = await fetchHistory(selected, limit);
      const markdown = buildChannelExportMarkdown(messages, {
        guildName: interaction.guild.name,
        guildId: interaction.guild.id,
        guildSlug,
        channelName,
        channelId: selected.id,
        channelSlug,
        exportedAt,
        exportedBy: interaction.user.tag,
        includeAttachments,
        includeEmbeds,
      });

      const filePath = await uniqueExportPath(exportRoot, guildSlug, channelSlug, exportedAt);
      await writeFile(filePath, markdown, 'utf8');
      const bytes = Buffer.byteLength(markdown, 'utf8');
      const sync = await syncKb();

      const threadHint =
        typeof selected.isThread === 'function' && !selected.isThread()
          ? '\nThread export is available by selecting a specific thread; parent channel exports do not recurse into threads yet.'
          : '';

      if (!sync.ok) {
        logger.warn('KB sync failed after channel export', {
          channelId: selected.id,
          filePath,
          stderr: sync.stderr.slice(0, 500),
        });
      }

      await interaction.editReply(
        [
          `Exported ${messages.length} messages to ${filePath}`,
          `Byte size: ${bytes}`,
          sync.ok ? 'synced ✅' : 'local-only ⚠ retry with `bash /home/slimy/kb/tools/kb-sync.sh push`',
          threadHint,
        ].filter(Boolean).join('\n'),
      );

      logger.info('Channel export complete', {
        guildId: interaction.guild.id,
        channelId: selected.id,
        messageCount: messages.length,
        bytes,
        synced: sync.ok,
      });
    } catch (err) {
      logger.error('Channel export failed', err as Error, {
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        channelId: interaction.channelId,
      });
      await interaction.editReply(`Export failed: ${(err as Error).message}`);
    }
  }, 'read-channel'),
};
