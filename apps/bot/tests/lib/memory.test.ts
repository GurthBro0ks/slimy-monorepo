import { memoryStore } from '../../src/lib/memory';

function uid() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe('memoryStore — consent', () => {
  it('should default to false consent', async () => {
    const u = uid(), g = uid();
    const result = await memoryStore.getConsent({ userId: u, guildId: g });
    expect(result).toBe(false);
  });

  it('should set and get consent', async () => {
    const u = uid(), g = uid();
    await memoryStore.setConsent({ userId: u, guildId: g, allowed: true });
    const result = await memoryStore.getConsent({ userId: u, guildId: g });
    expect(result).toBe(true);
  });

  it('should revoke consent', async () => {
    const u = uid(), g = uid();
    await memoryStore.setConsent({ userId: u, guildId: g, allowed: true });
    await memoryStore.setConsent({ userId: u, guildId: g, allowed: false });
    const result = await memoryStore.getConsent({ userId: u, guildId: g });
    expect(result).toBe(false);
  });

  it('should isolate consent per user+guild', async () => {
    const u1 = uid(), u2 = uid(), g = uid();
    await memoryStore.setConsent({ userId: u1, guildId: g, allowed: true });
    const result = await memoryStore.getConsent({ userId: u2, guildId: g });
    expect(result).toBe(false);
  });
});

describe('memoryStore — memos', () => {
  it('should add and list memos', async () => {
    const u = uid(), g = uid();
    await memoryStore.addMemo({ userId: u, guildId: g, content: 'hello' });
    const memos = await memoryStore.listMemos({ userId: u, guildId: g });
    expect(memos).toHaveLength(1);
    expect(memos[0].content).toBe('hello');
  });

  it('should return empty for no memos', async () => {
    const u = uid(), g = uid();
    const memos = await memoryStore.listMemos({ userId: u, guildId: g });
    expect(memos).toHaveLength(0);
  });

  it('should delete a memo by id', async () => {
    const u = uid(), g = uid();
    const memo = await memoryStore.addMemo({ userId: u, guildId: g, content: 'del me' });
    const deleted = await memoryStore.deleteMemo({ id: memo._id, userId: u, guildId: g });
    expect(deleted).toBe(true);
    const memos = await memoryStore.listMemos({ userId: u, guildId: g });
    expect(memos).toHaveLength(0);
  });

  it('should not delete memo of another user', async () => {
    const u1 = uid(), u2 = uid(), g = uid();
    const memo = await memoryStore.addMemo({ userId: u1, guildId: g, content: 'secret' });
    const deleted = await memoryStore.deleteMemo({ id: memo._id, userId: u2, guildId: g });
    expect(deleted).toBe(false);
  });

  it('should delete all memos for a user+guild', async () => {
    const u = uid(), g1 = uid(), g2 = uid();
    await memoryStore.addMemo({ userId: u, guildId: g1, content: 'a' });
    await memoryStore.addMemo({ userId: u, guildId: g1, content: 'b' });
    await memoryStore.addMemo({ userId: u, guildId: g2, content: 'c' });
    const count = await memoryStore.deleteAllMemos({ userId: u, guildId: g1 });
    expect(count).toBe(2);
  });

  it('should respect limit in listMemos', async () => {
    const u = uid(), g = uid();
    for (let i = 0; i < 5; i++) {
      await memoryStore.addMemo({ userId: u, guildId: g, content: `memo-${i}` });
    }
    const memos = await memoryStore.listMemos({ userId: u, guildId: g, limit: 3 });
    expect(memos).toHaveLength(3);
  });

  it('should sort memos by createdAt descending', async () => {
    const u = uid(), g = uid();
    await memoryStore.addMemo({ userId: u, guildId: g, content: 'first' });
    await new Promise((r) => setTimeout(r, 10));
    await memoryStore.addMemo({ userId: u, guildId: g, content: 'second' });
    const memos = await memoryStore.listMemos({ userId: u, guildId: g });
    expect(memos[0].content).toBe('second');
    expect(memos[1].content).toBe('first');
  });

  it('should handle tags in memos', async () => {
    const u = uid(), g = uid();
    const memo = await memoryStore.addMemo({
      userId: u,
      guildId: g,
      content: 'tagged',
      tags: ['foo', 'bar'],
    });
    expect(memo.tags).toEqual(['foo', 'bar']);
  });
});

describe('memoryStore — channelModes', () => {
  it('should return empty state for unset modes', async () => {
    const g = uid(), ch = uid();
    const modes = await memoryStore.getChannelModes({ guildId: g, targetId: ch, targetType: 'channel' });
    expect(modes.chat).toBe(false);
    expect(modes.admin).toBe(false);
  });

  it('should set and get channel modes', async () => {
    const g = uid(), ch = uid();
    const modes = await memoryStore.patchChannelModes({
      guildId: g,
      targetId: ch,
      targetType: 'channel',
      modes: ['chat'],
    });
    expect(modes.chat).toBe(true);

    const stored = await memoryStore.getChannelModes({ guildId: g, targetId: ch, targetType: 'channel' });
    expect(stored.chat).toBe(true);
  });

  it('should call clearChannelModes without error', async () => {
    const g = uid(), ch = uid();
    await memoryStore.patchChannelModes({
      guildId: g,
      targetId: ch,
      targetType: 'channel',
      modes: ['chat'],
    });
    const result = await memoryStore.clearChannelModes({
      guildId: g,
      targetId: ch,
      targetType: 'channel',
    });
    expect(typeof result).toBe('object');
  });

  it('should list all modes for a guild', async () => {
    const g = uid(), ch1 = uid(), ch2 = uid();
    await memoryStore.patchChannelModes({
      guildId: g,
      targetId: ch1,
      targetType: 'channel',
      modes: ['chat'],
    });
    await memoryStore.patchChannelModes({
      guildId: g,
      targetId: ch2,
      targetType: 'channel',
      modes: ['admin'],
    });
    const list = await memoryStore.listChannelModes({ guildId: g });
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it('should throw on missing required args', async () => {
    await expect(
      memoryStore.patchChannelModes({ guildId: '', targetId: uid(), targetType: 'channel', modes: ['chat'] }),
    ).rejects.toThrow('requires');
  });
});
