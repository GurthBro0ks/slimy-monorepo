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
const logger = createLogger({ context: 'read-channel' });

const DEFAULT_EXPORT_ROOT = '/home/slimy/kb/raw/discord-exports';
const MAX_LIMIT = 10000;
const MAX_THREADS = 50;
const THREAD_THROTTLE_MS = 500;

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

function channelDisplayName(channel: FetchableChannel): string {
  return channel.name || channel.id;
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    )
    .addBooleanOption((opt) =>
      opt
        .setName('include_threads')
        .setDescription('Also export all threads as separate files')
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
      const includeThreads = interaction.options.getBoolean('include_threads') ?? false;
      const exportedAt = new Date();
      const guildSlug = slugify(interaction.guild.name);
      const channelName = channelDisplayName(selected);
      const channelSlug = slugify(channelName);
      const exportRoot = process.env.KB_EXPORT_ROOT || DEFAULT_EXPORT_ROOT;

      const messages = await fetchAllMessages(selected, { limit });
      let threadFiles: string[] = [];
      let threadCount = 0;
      let skippedThreads: string[] = [];
      let truncatedThreads = false;
      let totalThreadMessages = 0;

      if (includeThreads) {
        await interaction.editReply('Exported parent channel. Discovering threads...');

        const threads = new Map<string, any>();

        try {
          if (typeof (selected as any).threads === 'object' && (selected as any).threads !== null) {
            const threadManager = (selected as any).threads;

            if (typeof threadManager.fetchActive === 'function') {
              const active = await threadManager.fetchActive();
              for (const [, thread] of active.threads) {
                threads.set(thread.id, thread);
              }
            }

            if (typeof threadManager.fetchArchived === 'function') {
              let hasMore = true;
              let before: string | undefined;
              while (hasMore && threads.size < MAX_THREADS) {
                const batch = await threadManager.fetchArchived({ limit: 100, before });
                for (const [, thread] of batch.threads) {
                  if (!threads.has(thread.id)) {
                    threads.set(thread.id, thread);
                  }
                }
                hasMore = batch.hasMore ?? false;
                before = batch.threads.last?.()?.id;
                if (!before) hasMore = false;
              }
              if (threads.size >= MAX_THREADS) {
                truncatedThreads = true;
              }
            }
          }
        } catch (err) {
          logger.warn('Thread discovery failed', {
            channelId: selected.id,
            error: (err as Error).message,
          });
        }

        const sortedThreads = Array.from(threads.values()).sort(
          (a: any, b: any) => (a.createdTimestamp ?? 0) - (b.createdTimestamp ?? 0),
        );
        const totalToExport = Math.min(sortedThreads.length, MAX_THREADS);

        if (totalToExport > 0) {
          await interaction.editReply(`Found ${sortedThreads.length} threads. Exporting 0/${totalToExport}...`);
        }

        for (let i = 0; i < totalToExport; i++) {
          const thread = sortedThreads[i];
          try {
            const threadStart = Date.now();
            const threadMessages = await fetchAllMessages(thread, { limit });
            const threadMarkdown = buildChannelExportMarkdown(threadMessages, {
              guildName: interaction.guild.name,
              guildId: interaction.guild.id,
              guildSlug,
              channelName: thread.name || thread.id,
              channelId: thread.id,
              channelSlug: slugify(thread.name || thread.id),
              exportedAt,
              exportedBy: interaction.user.tag,
              includeAttachments,
              includeEmbeds,
              isThread: true,
              parentChannelName: channelName,
              parentChannelId: selected.id,
            });

            const threadFilename = `${guildSlug}-thread-${slugify(thread.name || thread.id)}`;
            const threadPath = await uniqueExportPath(exportRoot, threadFilename, exportedAt);
            await writeFile(threadPath, threadMarkdown, 'utf8');
            threadFiles.push(path.basename(threadPath));
            threadCount++;
            totalThreadMessages += threadMessages.length;

            const elapsed = Date.now() - threadStart;
            if (elapsed > 30000) {
              logger.warn('Thread export took unusually long (possible rate limit)', {
                threadId: thread.id,
                elapsedMs: elapsed,
              });
            }

            if ((i + 1) % 3 === 0 || i === totalToExport - 1) {
              await interaction.editReply(`Exporting threads... ${i + 1}/${totalToExport}`);
            }

            if (i < totalToExport - 1) {
              await sleep(THREAD_THROTTLE_MS);
            }
          } catch (err) {
            const threadName = thread.name || thread.id;
            logger.error('Thread export failed', err as Error, {
              threadId: thread.id,
              threadName,
            });
            skippedThreads.push(threadName);
          }
        }
      }

      const parentMarkdown = buildChannelExportMarkdown(messages, {
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
        threadsExported: includeThreads && threadCount > 0,
        threadCount,
        threadFiles,
      });

      const filePath = await uniqueExportPath(exportRoot, `${guildSlug}-${channelSlug}`, exportedAt);
      await writeFile(filePath, parentMarkdown, 'utf8');
      const bytes = Buffer.byteLength(parentMarkdown, 'utf8');
      const sync = await syncKb();

      if (!sync.ok) {
        logger.warn('KB sync failed after channel export', {
          channelId: selected.id,
          filePath,
          stderr: sync.stderr.slice(0, 500),
        });
      }

      const replyLines = [
        `Exported ${messages.length} messages to ${filePath}`,
        `Byte size: ${bytes}`,
      ];

      if (includeThreads) {
        if (threadCount > 0) {
          replyLines.push(`Threads: ${threadCount} exported, ${totalThreadMessages} messages`);
        }
        if (skippedThreads.length > 0) {
          replyLines.push(`Skipped ${skippedThreads.length} threads (${skippedThreads.slice(0, 3).join(', ')}${skippedThreads.length > 3 ? '...' : ''})`);
        }
        if (truncatedThreads) {
          replyLines.push(`Truncated: more than ${MAX_THREADS} threads exist`);
        }
      }

      replyLines.push(sync.ok ? 'synced ✅' : 'local-only ⚠ retry with `bash /home/slimy/kb/tools/kb-sync.sh push`');

      await interaction.editReply(replyLines.join('\n'));

      logger.info('Channel export complete', {
        guildId: interaction.guild.id,
        channelId: selected.id,
        messageCount: messages.length,
        threadCount,
        totalThreadMessages,
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
