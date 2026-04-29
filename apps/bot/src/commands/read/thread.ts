import { execFile } from 'node:child_process';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import {
  ChannelType,
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { buildChannelExportMarkdown, slugify } from '../../lib/channelExporter.js';
import { fetchAllMessages, type FetchableChannel } from '../../lib/discordFetcher.js';
import { safeHandler } from '../../lib/errorHandler.js';
import { createLogger } from '../../lib/logger.js';

const execFileAsync = promisify(execFile);
const logger = createLogger({ context: 'read-thread' });

const DEFAULT_EXPORT_ROOT = '/home/slimy/kb/raw/discord-exports';
const MAX_LIMIT = 10000;

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

function isFetchableTextChannel(channel: unknown): channel is FetchableChannel {
  return Boolean(
    channel &&
      typeof channel === 'object' &&
      'messages' in channel &&
      typeof (channel as FetchableChannel).messages?.fetch === 'function',
  );
}

function isThreadChannel(channel: unknown): boolean {
  return Boolean(
    channel &&
      typeof channel === 'object' &&
      typeof (channel as any).isThread === 'function' &&
      (channel as any).isThread(),
  );
}

async function uniqueExportPath(root: string, filenameBase: string, exportedAt: Date): Promise<string> {
  const yyyyMmDd = exportedAt.toISOString().slice(0, 10);
  const dir = path.join(root, yyyyMmDd);
  await mkdir(dir, { recursive: true });

  const base = path.join(dir, `${filenameBase}.md`);
  try {
    await stat(base);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return base;
    throw err;
  }

  const timestamp = exportedAt.toISOString().replace(/[-:.]/g, '').slice(0, 15);
  return path.join(dir, `${filenameBase}-${timestamp}.md`);
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
    .setName('read-thread')
    .setDescription('Export a Discord thread to an Obsidian-ready Markdown file')
    .addChannelOption((opt) =>
      opt
        .setName('thread')
        .setDescription('Thread to export (defaults to current thread)')
        .addChannelTypes(
          ChannelType.PublicThread,
          ChannelType.PrivateThread,
          ChannelType.AnnouncementThread,
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
      const selected = interaction.options.getChannel('thread') ?? interaction.channel;
      
      if (!isFetchableTextChannel(selected)) {
        await interaction.editReply('That channel does not expose fetchable message history.');
        return;
      }

      if (!isThreadChannel(selected)) {
        await interaction.editReply(
          'Run this inside a thread, or pass the `thread` option.'
        );
        return;
      }

      const limit = interaction.options.getInteger('limit') ?? 0;
      const includeAttachments = interaction.options.getBoolean('include_attachments') ?? true;
      const includeEmbeds = interaction.options.getBoolean('include_embeds') ?? true;
      const exportedAt = new Date();
      const guildSlug = slugify(interaction.guild.name);
      const threadName = (selected as any).name || selected.id;
      const threadSlug = slugify(threadName);
      const exportRoot = process.env.KB_EXPORT_ROOT || DEFAULT_EXPORT_ROOT;

      const messages = await fetchAllMessages(selected, { limit });
      
      const parentChannel = (selected as any).parent;
      const parentChannelName = parentChannel?.name || 'unknown';
      const parentChannelId = parentChannel?.id || '';

      const markdown = buildChannelExportMarkdown(messages, {
        guildName: interaction.guild.name,
        guildId: interaction.guild.id,
        guildSlug,
        channelName: threadName,
        channelId: selected.id,
        channelSlug: threadSlug,
        exportedAt,
        exportedBy: interaction.user.tag,
        includeAttachments,
        includeEmbeds,
        isThread: true,
        parentChannelName,
        parentChannelId,
      });

      const filePath = await uniqueExportPath(
        exportRoot,
        `${guildSlug}-thread-${threadSlug}`,
        exportedAt,
      );
      await writeFile(filePath, markdown, 'utf8');
      const bytes = Buffer.byteLength(markdown, 'utf8');
      const sync = await syncKb();

      if (!sync.ok) {
        logger.warn('KB sync failed after thread export', {
          channelId: selected.id,
          filePath,
          stderr: sync.stderr.slice(0, 500),
        });
      }

      await interaction.editReply(
        [
          `Exported ${messages.length} messages from thread to ${filePath}`,
          `Byte size: ${bytes}`,
          sync.ok ? 'synced ✅' : 'local-only ⚠ retry with `bash /home/slimy/kb/tools/kb-sync.sh push`',
        ].filter(Boolean).join('\n'),
      );

      logger.info('Thread export complete', {
        guildId: interaction.guild.id,
        threadId: selected.id,
        parentChannelId,
        messageCount: messages.length,
        bytes,
        synced: sync.ok,
      });
    } catch (err) {
      logger.error('Thread export failed', err as Error, {
        guildId: interaction.guild?.id,
        userId: interaction.user.id,
        channelId: interaction.channelId,
      });
      await interaction.editReply(`Export failed: ${(err as Error).message}`);
    }
  }, 'read-thread'),
};
