import { describe, expect, it } from 'vitest';
import {
  buildChannelExportMarkdown,
  slugify,
  type ExportOptions,
  type ExportMessage,
} from '../channelExporter.js';

const baseOpts: ExportOptions = {
  guildName: 'Snail Guild',
  guildId: 'guild-1',
  guildSlug: 'snail-guild',
  channelName: 'General Chat',
  channelId: 'channel-1',
  channelSlug: 'general-chat',
  exportedAt: new Date('2026-04-27T12:00:00.000Z'),
  exportedBy: 'GurthBro0ks#0001',
  includeAttachments: true,
  includeEmbeds: true,
};

function message(overrides: Partial<ExportMessage>): ExportMessage {
  return {
    id: '1',
    createdAt: new Date('2026-04-27T01:02:03.000Z'),
    content: 'hello',
    author: {
      tag: 'user#0001',
      username: 'user',
      globalName: null,
      displayName: 'User',
    },
    attachments: [],
    embeds: [],
    referencedMessageId: null,
    ...overrides,
  };
}

describe('channelExporter', () => {
  it('slugifies to lowercase ascii dash slugs', () => {
    expect(slugify('The Snail Café #1!')).toBe('the-snail-cafe-1');
    expect(slugify('---')).toBe('unknown');
  });

  it('empty array returns header-only export with message_count 0', () => {
    const md = buildChannelExportMarkdown([], baseOpts);

    expect(md).toContain('message_count: 0');
    expect(md).toContain('date_range: ""');
    expect(md).toContain('# #General Chat');
    expect(md).not.toContain('## 2026-04-27');
  });

  it('renders reply chains before the replied message', () => {
    const md = buildChannelExportMarkdown([
      message({ id: '10', content: 'original' }),
      message({ id: '11', content: 'answer', referencedMessageId: '10' }),
    ], baseOpts);

    expect(md).toContain('↪ replying to ^msg-10\n**User**');
    expect(md).toContain('^msg-11');
  });

  it('toggles attachments and embeds on and off', () => {
    const fixture = [
      message({
        id: '20',
        attachments: [{ name: 'chart.png', url: 'https://cdn.example/chart.png' }],
        embeds: [{ title: 'Source Link', url: 'https://example.com' }],
      }),
    ];

    const included = buildChannelExportMarkdown(fixture, baseOpts);
    expect(included).toContain('- 📎 [chart.png](https://cdn.example/chart.png)');
    expect(included).toContain('- 🔗 embed: Source Link — https://example.com');

    const omitted = buildChannelExportMarkdown(fixture, {
      ...baseOpts,
      includeAttachments: false,
      includeEmbeds: false,
    });
    expect(omitted).not.toContain('chart.png');
    expect(omitted).not.toContain('Source Link');
  });

  it('escapes markdown-sensitive message content inside blockquotes', () => {
    const md = buildChannelExportMarkdown([
      message({ content: '# heading\n> quote\n`code` | *bold* _em_ ~strike~' }),
    ], baseOpts);

    expect(md).toContain('> \\# heading');
    expect(md).toContain('> \\\u003e quote');
    expect(md).toContain('> \\`code\\` \\| \\*bold\\* \\_em\\_ \\~strike\\~');
  });

  it('groups messages across two UTC days', () => {
    const md = buildChannelExportMarkdown([
      message({ id: 'late', createdAt: new Date('2026-04-28T00:00:01.000Z'), content: 'second day' }),
      message({ id: 'early', createdAt: new Date('2026-04-27T23:59:59.000Z'), content: 'first day' }),
    ], baseOpts);

    expect(md).toContain('## 2026-04-27');
    expect(md).toContain('## 2026-04-28');
    expect(md.indexOf('## 2026-04-27')).toBeLessThan(md.indexOf('## 2026-04-28'));
    expect(md).toContain('date_range: "2026-04-27T23:59:59.000Z .. 2026-04-28T00:00:01.000Z"');
  });

  it('renders thread metadata when isThread=true', () => {
    const threadOpts: ExportOptions = {
      ...baseOpts,
      channelName: 'Bug Reports',
      channelSlug: 'bug-reports',
      isThread: true,
      parentChannelName: 'Support',
      parentChannelId: 'parent-1',
    };

    const md = buildChannelExportMarkdown([message({ id: 't1', content: 'bug found' })], threadOpts);

    expect(md).toContain('is_thread: true');
    expect(md).toContain('parent_channel: "Support"');
    expect(md).toContain('parent_channel_id: "parent-1"');
    expect(md).toContain('thread/bug-reports');
    expect(md).toContain('# Bug Reports (thread in #Support)');
  });

  it('renders user filter metadata when filterUserId is set', () => {
    const filterOpts: ExportOptions = {
      ...baseOpts,
      filterUserId: '123456789',
      filterUserTag: 'alice#1234',
    };

    const md = buildChannelExportMarkdown([message({ id: 'u1', content: 'hello' })], filterOpts);

    expect(md).toContain('filtered_user: "alice#1234"');
    expect(md).toContain('filtered_user_id: "123456789"');
    expect(md).toContain('user/alice-1234');
    expect(md).toContain('# General Chat — messages by alice#1234');
  });

  it('renders combined thread + user filter metadata', () => {
    const combinedOpts: ExportOptions = {
      ...baseOpts,
      channelName: 'Bug Reports',
      channelSlug: 'bug-reports',
      isThread: true,
      parentChannelName: 'Support',
      parentChannelId: 'parent-1',
      filterUserId: '123456789',
      filterUserTag: 'alice#1234',
    };

    const md = buildChannelExportMarkdown([message({ id: 'c1', content: 'test' })], combinedOpts);

    expect(md).toContain('is_thread: true');
    expect(md).toContain('filtered_user: "alice#1234"');
    expect(md).toContain('thread/bug-reports');
    expect(md).toContain('user/alice-1234');
  });
});
