export interface ExportAuthor {
  tag: string;
  username?: string;
  globalName?: string | null;
  displayName?: string | null;
}

export interface ExportAttachment {
  name: string;
  url: string;
}

export interface ExportEmbed {
  title?: string | null;
  url?: string | null;
}

export interface ExportMessage {
  id: string;
  createdAt: Date;
  content?: string | null;
  author: ExportAuthor;
  attachments?: ExportAttachment[];
  embeds?: ExportEmbed[];
  referencedMessageId?: string | null;
}

export interface ChannelExportOptions {
  guildName: string;
  guildId: string;
  guildSlug: string;
  channelName: string;
  channelId: string;
  channelSlug: string;
  exportedAt: Date;
  exportedBy: string;
  includeAttachments: boolean;
  includeEmbeds: boolean;
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'UTC',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export function slugify(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'unknown';
}

function yamlString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function escapeInlineMarkdown(value: string): string {
  return value.replace(/[`|*_~]/g, '\\$&');
}

export function escapeMarkdownContent(value: string): string {
  return value
    .replace(/`/g, '\\`')
    .replace(/\|/g, '\\|')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/~/g, '\\~')
    .replace(/^([#>])/gm, '\\$1');
}

function blockquote(value: string): string {
  if (!value.trim()) return '> ';
  return escapeMarkdownContent(value)
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join('\n');
}

function displayName(author: ExportAuthor): string {
  return author.displayName || author.globalName || author.username || author.tag;
}

function dateKey(date: Date): string {
  return DATE_FORMAT.format(date);
}

function timeKey(date: Date): string {
  return `${TIME_FORMAT.format(date)} UTC`;
}

export function buildChannelExportMarkdown(
  messages: ExportMessage[],
  opts: ChannelExportOptions,
): string {
  const sorted = [...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const first = sorted[0]?.createdAt.toISOString() ?? '';
  const last = sorted[sorted.length - 1]?.createdAt.toISOString() ?? '';
  const dateRange = sorted.length > 0 ? `${first} .. ${last}` : '';

  const lines: string[] = [
    '---',
    `title: ${yamlString(`#${opts.channelName} export`)}`,
    `guild: ${yamlString(opts.guildName)}`,
    `guild_id: ${yamlString(opts.guildId)}`,
    `channel: ${yamlString(opts.channelName)}`,
    `channel_id: ${yamlString(opts.channelId)}`,
    `exported_at: ${yamlString(opts.exportedAt.toISOString())}`,
    `exported_by: ${yamlString(opts.exportedBy)}`,
    `message_count: ${sorted.length}`,
    `date_range: ${yamlString(dateRange)}`,
    `tags: [discord-export, channel/${opts.channelSlug}, guild/${opts.guildSlug}]`,
    '---',
    '',
    `# #${escapeInlineMarkdown(opts.channelName)}`,
    '',
  ];

  let currentDate = '';
  for (const message of sorted) {
    const messageDate = dateKey(message.createdAt);
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      lines.push(`## ${messageDate}`, '');
    }

    if (message.referencedMessageId) {
      lines.push(`↪ replying to ^msg-${message.referencedMessageId}`);
    }

    lines.push(
      `**${escapeInlineMarkdown(displayName(message.author))}** (\`${escapeInlineMarkdown(message.author.tag)}\`) · ${timeKey(message.createdAt)}`,
      blockquote(message.content ?? ''),
    );

    if (opts.includeAttachments) {
      for (const attachment of message.attachments ?? []) {
        lines.push(`- 📎 [${escapeInlineMarkdown(attachment.name)}](${attachment.url})`);
      }
    }

    if (opts.includeEmbeds) {
      for (const embed of message.embeds ?? []) {
        const title = embed.title || 'untitled';
        const suffix = embed.url ? ` — ${embed.url}` : '';
        lines.push(`- 🔗 embed: ${escapeInlineMarkdown(title)}${suffix}`);
      }
    }

    lines.push(`^msg-${message.id}`, '');
  }

  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}
