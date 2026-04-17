import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canonicalizeAmbiguous } from '../src/commands/club-push.js';

describe('canonicalizeAmbiguous', () => {
  it('normalizes i and 1 to l', () => {
    expect(canonicalizeAmbiguous('lil')).toBe('lll');
    expect(canonicalizeAmbiguous('ill')).toBe('lll');
    expect(canonicalizeAmbiguous('1i1')).toBe('lll');
  });

  it('normalizes uppercase I to l', () => {
    expect(canonicalizeAmbiguous('ILL')).toBe('lll');
    expect(canonicalizeAmbiguous('Lil')).toBe('lll');
  });

  it('normalizes 0 to o', () => {
    expect(canonicalizeAmbiguous('O0')).toBe('oo');
    expect(canonicalizeAmbiguous('0range')).toBe('orange');
    expect(canonicalizeAmbiguous('O0O')).toBe('ooo');
  });

  it('leaves names without ambiguous chars unchanged (after lowercasing)', () => {
    expect(canonicalizeAmbiguous('Stone')).toBe('stone');
    expect(canonicalizeAmbiguous('Bob')).toBe('bob');
    expect(canonicalizeAmbiguous('Fred')).toBe('fred');
  });

  it('normalizes i in longer names (both sides treated equally)', () => {
    expect(canonicalizeAmbiguous('Alice')).toBe('allce');
    expect(canonicalizeAmbiguous('Allce')).toBe('allce');
    expect(canonicalizeAmbiguous('alice')).toBe('allce');
  });

  it('handles empty string', () => {
    expect(canonicalizeAmbiguous('')).toBe('');
  });

  it('handles mixed ambiguous and normal characters', () => {
    expect(canonicalizeAmbiguous('L1ghtN1ng')).toBe('llghtnlng');
    expect(canonicalizeAmbiguous('I0I0')).toBe('lolo');
  });

  it('is case-insensitive', () => {
    expect(canonicalizeAmbiguous('LIL')).toBe('lll');
    expect(canonicalizeAmbiguous('LiL')).toBe('lll');
    expect(canonicalizeAmbiguous('lIl')).toBe('lll');
  });
});

const {
  mockDbQuery,
  mockPoolGetConnection,
  mockConnBeginTransaction,
  mockConnExecute,
  mockConnCommit,
  mockConnRollback,
  mockConnRelease,
  mockDbExecute,
} = vi.hoisted(() => ({
  mockDbQuery: vi.fn(),
  mockDbExecute: vi.fn(),
  mockPoolGetConnection: vi.fn(),
  mockConnBeginTransaction: vi.fn().mockResolvedValue(undefined),
  mockConnExecute: vi.fn(),
  mockConnCommit: vi.fn().mockResolvedValue(undefined),
  mockConnRollback: vi.fn().mockResolvedValue(undefined),
  mockConnRelease: vi.fn(),
}));

vi.mock('../src/lib/database.js', () => {
  const mockPool = {
    getConnection: mockPoolGetConnection,
    execute: mockDbExecute,
  };
  return {
    database: {
      execute: mockDbExecute,
      query: mockDbQuery,
      getPool: () => mockPool,
      isConfigured: () => true,
    },
  };
});

import cmd from '../src/commands/club-push.js';

function createMockInteraction(options: { force?: boolean; dry_run?: boolean } = {}) {
  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    guildId: 'guild-123',
    user: { id: 'user-456' },
    options: {
      getBoolean: vi.fn((name: string) => {
        if (name === 'force') return options.force ?? false;
        if (name === 'dry_run') return options.dry_run ?? false;
        return null;
      }),
    },
  } as unknown as import('discord.js').ChatInputCommandInteraction;
}

describe('club-push — ambiguity canonicalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQuery.mockReset();
    mockDbExecute.mockReset();
    mockConnExecute.mockReset();
  });

  it('lil vs ill does NOT trigger mismatch', async () => {
    mockDbQuery
      .mockResolvedValueOnce([
        { member_name: 'lil', power_value: '1000000' },
        { member_name: 'Alice', power_value: '2000000' },
      ])
      .mockResolvedValueOnce([
        { member_name: 'ill', power_value: '3000000' },
        { member_name: 'Alice', power_value: '4000000' },
      ]);

    const { default: pushCmd } = await import('../src/commands/club-push.js');

    const mockPool = {
      getConnection: mockPoolGetConnection,
    };
    const mockConnection = {
      beginTransaction: mockConnBeginTransaction,
      execute: mockConnExecute,
      commit: mockConnCommit,
      rollback: mockConnRollback,
      release: mockConnRelease,
    };
    mockPoolGetConnection.mockResolvedValue(mockConnection);
    mockConnExecute
      .mockResolvedValueOnce([[{ member_id: 1 }]])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([[{ member_id: 2 }]])
      .mockResolvedValueOnce({ affectedRows: 1 });

    const interaction = createMockInteraction();
    await pushCmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeUndefined();
    expect(call.content).toContain('Pushed');
  });

  it('truly different names still trigger mismatch', async () => {
    mockDbQuery
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '1000000' },
        { member_name: 'Bob', power_value: '2000000' },
      ])
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '3000000' },
        { member_name: 'Carol', power_value: '4000000' },
      ]);

    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeDefined();
    expect(call.embeds).toHaveLength(1);
  });
});
