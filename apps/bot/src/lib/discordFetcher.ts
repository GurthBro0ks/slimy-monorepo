import { Message } from 'discord.js';
import { createLogger } from './logger.js';
import type { ExportMessage } from './channelExporter.js';

const logger = createLogger({ context: 'discord-fetcher' });
const MAX_LIMIT = 10000;

export interface FetchableChannel {
  id: string;
  name?: string;
  messages: {
    fetch: (opts: { limit: number; before?: string }) => Promise<{
      size: number;
      values: () => IterableIterator<Message>;
      last: () => Message | undefined;
    }>;
  };
}

export function toExportMessage(message: Message): ExportMessage {
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

export async function fetchAllMessages(
  channel: FetchableChannel,
  opts: { limit?: number; filterUserId?: string; progressLogInterval?: number } = {},
): Promise<ExportMessage[]> {
  const messages: ExportMessage[] = [];
  const hardLimit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, MAX_LIMIT) : MAX_LIMIT;
  let before: string | undefined;
  const progressInterval = opts.progressLogInterval ?? 500;
  let nextLogAt = progressInterval;

  while (messages.length < hardLimit) {
    const batchLimit = Math.min(100, hardLimit - messages.length);
    const batch = await channel.messages.fetch({ limit: batchLimit, before });
    if (batch.size === 0) break;

    for (const message of batch.values()) {
      if (messages.length >= hardLimit) break;
      const exportMsg = toExportMessage(message);
      if (opts.filterUserId && message.author.id !== opts.filterUserId) {
        continue;
      }
      messages.push(exportMsg);
    }

    before = batch.last()?.id;
    if (!before) break;

    if (messages.length >= nextLogAt) {
      logger.info('Fetch progress', {
        channelId: channel.id,
        messageCount: messages.length,
      });
      nextLogAt += progressInterval;
    }

    if (batch.size < batchLimit) break;
  }

  return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
