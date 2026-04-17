import { formatModeState, cacheGet, cacheSet, cacheDelete } from '../../src/lib/mode-store';
import type { ModeEntry } from '../../src/lib/mode-store';

describe('mode-store — formatModeState', () => {
  it('should return (none) for empty modes', () => {
    expect(formatModeState({})).toBe('(none)');
    expect(formatModeState({ admin: false, chat: false })).toBe('(none)');
  });

  it('should list active modes', () => {
    expect(formatModeState({ admin: true, chat: false })).toBe('admin');
    expect(formatModeState({ admin: true, chat: true })).toBe('admin + chat');
  });
});

describe('mode-store — cacheGet/cacheSet/cacheDelete', () => {
  const mockClient = {} as { slimeModeCache: Map<string, ModeEntry> };

  beforeEach(() => {
    mockClient.slimeModeCache = new Map();
  });

  it('should return null when cache is empty', () => {
    expect(cacheGet(mockClient, 'g1', 'channel', 'c1')).toBeNull();
  });

  it('should return null when client has no cache', () => {
    expect(cacheGet({}, 'g1', 'channel', 'c1')).toBeNull();
  });

  it('should set and get cache entry', () => {
    const entry: ModeEntry = {
      guildId: 'g1',
      targetId: 'c1',
      targetType: 'channel',
      modes: { chat: true },
      updatedAt: Date.now(),
    };
    cacheSet(mockClient, entry);
    const result = cacheGet(mockClient, 'g1', 'channel', 'c1');
    expect(result).toBeTruthy();
    expect(result!.chat).toBe(true);
  });

  it('should delete cache entry', () => {
    const entry: ModeEntry = {
      guildId: 'g1',
      targetId: 'c1',
      targetType: 'channel',
      modes: { chat: true },
      updatedAt: Date.now(),
    };
    cacheSet(mockClient, entry);
    cacheDelete(mockClient, 'g1', 'channel', 'c1');
    expect(cacheGet(mockClient, 'g1', 'channel', 'c1')).toBeNull();
  });
});
