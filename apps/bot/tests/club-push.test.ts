/**
 * Unit tests for club-push.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockDbExecute,
  mockDbQuery,
  mockPoolGetConnection,
  mockConnBeginTransaction,
  mockConnExecute,
  mockConnCommit,
  mockConnRollback,
  mockConnRelease,
} = vi.hoisted(() => ({
  mockDbExecute: vi.fn(),
  mockDbQuery: vi.fn(),
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

function setupConnectionMock() {
  const mockConnection = {
    beginTransaction: mockConnBeginTransaction,
    execute: mockConnExecute,
    commit: mockConnCommit,
    rollback: mockConnRollback,
    release: mockConnRelease,
  };
  mockPoolGetConnection.mockResolvedValue(mockConnection);
  return mockConnection;
}

function createMockInteraction(options: { force?: boolean; dry_run?: boolean } = {}) {
  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    followUp: vi.fn().mockResolvedValue(undefined),
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

describe('club-push command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQuery.mockReset();
    mockDbExecute.mockReset();
    mockConnExecute.mockReset();
  });

  it('refuses when both staging tables are empty', async () => {
    mockDbQuery
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    const content = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0].content;
    expect(content).toContain('Both SIM and TOTAL staging are empty');
  });

  it('refuses when TOTAL staging is empty without force', async () => {
    mockDbQuery
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '1000000' },
      ])
      .mockResolvedValueOnce([]);

    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    const content = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0].content;
    expect(content).toContain('TOTAL staging is empty');
  });

  it('refuses when SIM staging is empty without force', async () => {
    mockDbQuery
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '2000000' },
      ]);

    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    const content = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0].content;
    expect(content).toContain('SIM staging is empty');
  });

  it('refuses when member rosters differ between metrics', async () => {
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

  it('dry_run prints expected rows without writing', async () => {
    mockDbQuery
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '1000000' },
      ])
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '2000000' },
      ]);

    const interaction = createMockInteraction({ dry_run: true });
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeDefined();
    expect(mockDbExecute).not.toHaveBeenCalled();
  });

  it('pushes with both metrics when rosters match', async () => {
    mockDbQuery
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '1000000' },
      ])
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '2000000' },
      ]);

    setupConnectionMock();
    mockConnExecute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ member_id: 1 }]])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    mockDbQuery.mockResolvedValueOnce([]);

    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    expect(mockConnCommit).toHaveBeenCalled();

    const content = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0].content;
    expect(content).toContain('Pushed');
    expect(content).toContain('SIM + TOTAL');
    expect(content).toContain('Staging cleared');
  });

  it('rolls back and does not clear staging on write failure', async () => {
    mockDbQuery
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '1000000' },
      ])
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '2000000' },
      ]);

    setupConnectionMock();
    mockConnExecute.mockRejectedValueOnce(new Error('Write failed'));

    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    expect(mockConnRollback).toHaveBeenCalled();
    expect(mockDbExecute).not.toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM club_analyze_staging'),
      expect.anything(),
    );

    const content = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0].content;
    expect(content).toContain('Push failed');
  });

  it('force pushes with only SIM staging', async () => {
    mockDbQuery
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '1000000' },
      ])
      .mockResolvedValueOnce([]);

    setupConnectionMock();
    mockConnExecute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ member_id: 1 }]])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    mockDbQuery.mockResolvedValueOnce([]);

    const interaction = createMockInteraction({ force: true });
    await cmd.execute(interaction);

    const content = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0].content;
    expect(content).toContain('SIM');
  });

  it('requires guild context', async () => {
    const interaction = {
      ...createMockInteraction(),
      guildId: null,
    } as unknown as import('discord.js').ChatInputCommandInteraction;

    await cmd.execute(interaction);

    const content = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0].content;
    expect(content).toContain('only be used in a server');
  });

  it('removes stale members and reports count in response', async () => {
    mockDbQuery
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '1000000' },
        { member_name: 'Bob', power_value: '2000000' },
      ])
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '3000000' },
        { member_name: 'Bob', power_value: '4000000' },
      ]);

    setupConnectionMock();
    mockConnExecute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ member_id: 1 }]])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([[{ member_id: 2 }]])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([{ affectedRows: 14 }]);

    mockDbQuery.mockResolvedValueOnce([]);

    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    expect(mockConnCommit).toHaveBeenCalled();

    const staleDeleteCall = mockConnExecute.mock.calls.find(
      (call: [string, ...unknown[]]) => typeof call[0] === 'string' && call[0].includes('NOT IN'),
    );
    expect(staleDeleteCall).toBeDefined();
    expect(staleDeleteCall![0]).toContain('DELETE FROM club_latest');
    expect(staleDeleteCall![0]).toContain('NOT IN');

    const content = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0].content;
    expect(content).toContain('Pushed **2** members');
    expect(content).toContain('Removed **14** former members');
  });

  it('does not mention removal when no stale members', async () => {
    mockDbQuery
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '1000000' },
      ])
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '2000000' },
      ]);

    setupConnectionMock();
    mockConnExecute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ member_id: 1 }]])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    mockDbQuery.mockResolvedValueOnce([]);

    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    const content = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0].content;
    expect(content).not.toContain('Removed');
    expect(content).toContain('Pushed **1** members');
  });

  it('stale delete uses correct guild_id and display names', async () => {
    mockDbQuery
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '1000000' },
      ])
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '2000000' },
      ]);

    setupConnectionMock();
    mockConnExecute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ member_id: 1 }]])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([{ affectedRows: 5 }]);

    mockDbQuery.mockResolvedValueOnce([]);

    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    const staleDeleteCall = mockConnExecute.mock.calls.find(
      (call: [string, ...unknown[]]) => typeof call[0] === 'string' && call[0].includes('NOT IN'),
    );
    expect(staleDeleteCall![1]).toEqual(['guild-123', 'Alice']);
  });

  it('rollback on stale delete failure preserves existing data', async () => {
    mockDbQuery
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '1000000' },
      ])
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '2000000' },
      ]);

    setupConnectionMock();
    mockConnExecute
      .mockResolvedValueOnce([[{ member_id: 1 }]])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockRejectedValueOnce(new Error('Delete failed'));

    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    expect(mockConnRollback).toHaveBeenCalled();
    expect(mockDbExecute).not.toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM club_analyze_staging'),
      expect.anything(),
    );
  });

  it('sim_prev is SET before sim_power in UPDATE SQL', async () => {
    mockDbQuery
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '1000000' },
      ])
      .mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '2000000' },
      ]);

    setupConnectionMock();
    mockConnExecute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ member_id: 1 }]])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    mockDbQuery.mockResolvedValueOnce([]);

    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    const updateCall = mockConnExecute.mock.calls.find(
      (call: [string, ...unknown[]]) => typeof call[0] === 'string' && call[0].includes('UPDATE club_latest'),
    );
    expect(updateCall).toBeDefined();
    const sql = updateCall![0] as string;
    const prevIndex = sql.indexOf('sim_prev = sim_power');
    const powerIndex = sql.indexOf('sim_power = ?');
    expect(prevIndex).toBeLessThan(powerIndex);
  });
});
