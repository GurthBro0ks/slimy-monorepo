import { describe, expect, it, vi } from 'vitest';
import { fetchAllMessages, toExportMessage } from '../discordFetcher.js';

describe('discordFetcher', () => {
  it('toExportMessage maps a Discord Message correctly', () => {
    const mockMessage = {
      id: 'msg-1',
      createdAt: new Date('2026-04-27T12:00:00.000Z'),
      content: 'Hello world',
      author: {
        tag: 'user#0001',
        username: 'user',
        globalName: 'GlobalUser',
        id: 'u1',
      },
      member: {
        displayName: 'ServerUser',
      },
      attachments: new Map([['att1', { name: 'image.png', url: 'https://cdn.example/image.png', id: 'att1' }]]),
      embeds: [{ title: 'Example', url: 'https://example.com' }],
      reference: { messageId: 'msg-0' },
    } as any;

    const result = toExportMessage(mockMessage);
    expect(result.id).toBe('msg-1');
    expect(result.content).toBe('Hello world');
    expect(result.author.tag).toBe('user#0001');
    expect(result.author.displayName).toBe('ServerUser');
    expect(result.attachments).toHaveLength(1);
    expect(result.embeds).toHaveLength(1);
    expect(result.referencedMessageId).toBe('msg-0');
  });

  it('fetchAllMessages paginates and returns sorted messages', async () => {
    const messages = [
      { id: '3', createdAt: new Date('2026-04-27T03:00:00Z'), content: 'third', author: { tag: 'a', username: 'a', globalName: null, id: 'a1' }, attachments: new Map(), embeds: [], reference: null },
      { id: '2', createdAt: new Date('2026-04-27T02:00:00Z'), content: 'second', author: { tag: 'a', username: 'a', globalName: null, id: 'a1' }, attachments: new Map(), embeds: [], reference: null },
      { id: '1', createdAt: new Date('2026-04-27T01:00:00Z'), content: 'first', author: { tag: 'a', username: 'a', globalName: null, id: 'a1' }, attachments: new Map(), embeds: [], reference: null },
    ];

    const mockChannel = {
      id: 'ch-1',
      messages: {
        fetch: vi.fn()
          .mockResolvedValueOnce({
            size: 3,
            values: () => messages[Symbol.iterator](),
            last: () => messages[2],
          })
          .mockResolvedValueOnce({
            size: 0,
            values: () => [][Symbol.iterator](),
            last: () => undefined,
          }),
      },
    };

    const result = await fetchAllMessages(mockChannel as any);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
    expect(result[2].id).toBe('3');
    expect(mockChannel.messages.fetch).toHaveBeenCalledTimes(1);
  });

  it('fetchAllMessages respects limit option', async () => {
    const mockMessage = (id: string) => ({
      id,
      createdAt: new Date('2026-04-27T12:00:00Z'),
      content: `msg-${id}`,
      author: { tag: 'a', username: 'a', globalName: null, id: 'a1' },
      attachments: new Map(),
      embeds: [],
      reference: null,
    });

    const mockChannel = {
      id: 'ch-1',
      messages: {
        fetch: vi.fn()
          .mockImplementation((opts: { limit: number }) => {
            if (opts.limit === 100) {
              return Promise.resolve({
                size: 100,
                values: () => Array.from({ length: 100 }, (_, i) => mockMessage(String(i)))[Symbol.iterator](),
                last: () => mockMessage('99'),
              });
            }
            // Second call: limit=20
            return Promise.resolve({
              size: 20,
              values: () => Array.from({ length: 20 }, (_, i) => mockMessage(String(i + 100)))[Symbol.iterator](),
              last: () => mockMessage('119'),
            });
          }),
      },
    };

    const result = await fetchAllMessages(mockChannel as any, { limit: 120 });
    expect(result).toHaveLength(120);
    expect(mockChannel.messages.fetch).toHaveBeenCalledTimes(2);
    expect(mockChannel.messages.fetch).toHaveBeenLastCalledWith({ limit: 20, before: '99' });
  });

  it('fetchAllMessages filters by user id', async () => {
    const messages = [
      { id: '1', createdAt: new Date('2026-04-27T01:00:00Z'), content: 'alice', author: { tag: 'alice', username: 'alice', globalName: null, id: 'alice-id' }, attachments: new Map(), embeds: [], reference: null },
      { id: '2', createdAt: new Date('2026-04-27T02:00:00Z'), content: 'bob', author: { tag: 'bob', username: 'bob', globalName: null, id: 'bob-id' }, attachments: new Map(), embeds: [], reference: null },
      { id: '3', createdAt: new Date('2026-04-27T03:00:00Z'), content: 'alice again', author: { tag: 'alice', username: 'alice', globalName: null, id: 'alice-id' }, attachments: new Map(), embeds: [], reference: null },
    ];

    const mockChannel = {
      id: 'ch-1',
      messages: {
        fetch: vi.fn().mockResolvedValueOnce({
          size: 3,
          values: () => messages[Symbol.iterator](),
          last: () => messages[2],
        }).mockResolvedValueOnce({
          size: 0,
          values: () => [][Symbol.iterator](),
          last: () => undefined,
        }),
      },
    };

    const result = await fetchAllMessages(mockChannel as any, { filterUserId: 'alice-id' });
    expect(result).toHaveLength(2);
    expect(result[0].content).toBe('alice');
    expect(result[1].content).toBe('alice again');
  });

  it('fetchAllMessages returns empty array for empty channel', async () => {
    const mockChannel = {
      id: 'ch-1',
      messages: {
        fetch: vi.fn().mockResolvedValueOnce({
          size: 0,
          values: () => [][Symbol.iterator](),
          last: () => undefined,
        }),
      },
    };

    const result = await fetchAllMessages(mockChannel as any);
    expect(result).toHaveLength(0);
  });
});
