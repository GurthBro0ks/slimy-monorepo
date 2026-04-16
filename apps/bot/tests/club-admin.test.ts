import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockDbIsConfigured, mockDbQuery, mockDbExecute, mockDbEnsureGuildRecord,
  mockGetLatestForGuild, mockRecomputeLatestForGuild, mockCanonicalize,
  mockAddCorrection, mockNormalizeSheetInput, mockGetWeekId, mockTrackCommand,
} = vi.hoisted(() => ({
  mockDbIsConfigured: vi.fn(),
  mockDbQuery: vi.fn(),
  mockDbExecute: vi.fn(),
  mockDbEnsureGuildRecord: vi.fn(),
  mockGetLatestForGuild: vi.fn(),
  mockRecomputeLatestForGuild: vi.fn(),
  mockCanonicalize: vi.fn(),
  mockAddCorrection: vi.fn(),
  mockNormalizeSheetInput: vi.fn(),
  mockGetWeekId: vi.fn(),
  mockTrackCommand: vi.fn(),
}));

vi.mock('../src/lib/database.js', () => ({
  database: {
    isConfigured: mockDbIsConfigured,
    query: mockDbQuery,
    execute: mockDbExecute,
    ensureGuildRecord: mockDbEnsureGuildRecord,
  },
}));

vi.mock('../src/lib/club-store.js', () => ({
  getLatestForGuild: mockGetLatestForGuild,
  recomputeLatestForGuild: mockRecomputeLatestForGuild,
  canonicalize: mockCanonicalize,
}));

vi.mock('../src/lib/club-corrections.js', () => ({
  addCorrection: mockAddCorrection,
}));

vi.mock('../src/lib/guild-settings.js', () => ({
  normalizeSheetInput: mockNormalizeSheetInput,
}));

vi.mock('../src/lib/week-anchor.js', () => ({
  getWeekId: mockGetWeekId,
}));

vi.mock('../src/lib/metrics.js', () => ({
  trackCommand: mockTrackCommand,
}));

import cmd from '../src/commands/club-admin.js';

function createInteraction(subcommand: string, options: Record<string, unknown> = {}) {
  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    options: {
      getSubcommand: vi.fn().mockReturnValue(subcommand),
      getString: vi.fn((name: string) => options[name] ?? null),
      getBoolean: vi.fn((name: string) => options[name] ?? null),
    },
    member: {
      permissions: { has: vi.fn().mockReturnValue(true) },
      roles: { cache: { has: vi.fn().mockReturnValue(false) } },
    },
    guildId: 'guild-456',
    guild: { name: 'TestGuild' },
    user: { id: 'user-123' },
    client: {
      users: { fetch: vi.fn().mockResolvedValue({ username: 'TestUser' }) },
    },
    ...options._overrides,
  } as unknown as import('discord.js').ChatInputCommandInteraction;
}

describe('club-admin command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbIsConfigured.mockReturnValue(true);
    mockCanonicalize.mockImplementation((s: string) => s.toLowerCase().replace(/\s+/g, '_'));
    mockGetWeekId.mockReturnValue('2026-W16');
    mockAddCorrection.mockResolvedValue({ id: 1, replaced: false });
  });

  describe('aliases subcommand', () => {
    it('shows empty when no aliases', async () => {
      mockDbQuery.mockResolvedValue([]);

      const interaction = createInteraction('aliases');
      await cmd.execute(interaction);

      const call = (interaction.reply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.content).toContain('No aliases');
    });

    it('shows aliases when present', async () => {
      mockDbQuery.mockResolvedValue([
        { alias_canonical: 'alice', name_display: 'Alice', name_canonical: 'alice', total_power: 1000000, sim_power: 500000 },
        { alias_canonical: 'alice_smith', name_display: 'Alice', name_canonical: 'alice', total_power: 1000000, sim_power: 500000 },
      ]);

      const interaction = createInteraction('aliases');
      await cmd.execute(interaction);

      const call = (interaction.reply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.embeds).toBeDefined();
    });
  });

  describe('stats subcommand', () => {
    it('shows empty state when no data', async () => {
      mockGetLatestForGuild.mockResolvedValue([]);

      const interaction = createInteraction('stats');
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.embeds).toBeDefined();
    });

    it('shows stats with data', async () => {
      mockGetLatestForGuild.mockResolvedValue([
        { name_display: 'Alice', name_canonical: 'alice', total_power: 1000000, sim_power: 500000, latest_at: '2026-04-15' },
      ]);

      const interaction = createInteraction('stats');
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.embeds).toBeDefined();
    });

    it('updates settings with url option', async () => {
      mockNormalizeSheetInput.mockReturnValue({ url: 'https://sheets.google.com/abc', sheetId: 'abc' });
      mockDbExecute.mockResolvedValue(undefined);
      mockDbEnsureGuildRecord.mockResolvedValue(undefined);

      const interaction = createInteraction('stats', { url: 'https://sheets.google.com/abc' });
      await cmd.execute(interaction);

      expect(mockDbExecute).toHaveBeenCalled();
    });

    it('clears settings', async () => {
      mockDbExecute.mockResolvedValue(undefined);

      const interaction = createInteraction('stats', { clear: true });
      await cmd.execute(interaction);

      const call = (interaction.reply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.content).toContain('Cleared');
    });
  });

  describe('correct subcommand', () => {
    it('adds a correction', async () => {
      const interaction = createInteraction('correct', { member: 'Alice', metric: 'total', value: '1.5M' });
      await cmd.execute(interaction);

      expect(mockAddCorrection).toHaveBeenCalledWith(expect.objectContaining({
        guildId: 'guild-456',
        metric: 'total',
      }));
    });

    it('handles correction error', async () => {
      mockAddCorrection.mockRejectedValue(new Error('DB write failed'));

      const interaction = createInteraction('correct', { member: 'Alice', metric: 'total', value: '1.5M' });
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.content).toContain('Failed');
    });
  });

  describe('rollback subcommand', () => {
    it('rolls back to previous snapshot', async () => {
      mockDbQuery
        .mockResolvedValueOnce([{ id: 10, snapshot_at: new Date('2026-04-15') }])
        .mockResolvedValueOnce([{ id: 9, snapshot_at: new Date('2026-04-08') }]);
      mockDbExecute.mockResolvedValue(undefined);
      mockRecomputeLatestForGuild.mockResolvedValue(undefined);

      const interaction = createInteraction('rollback');
      await cmd.execute(interaction);

      expect(mockDbExecute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM club_snapshots'),
        [10],
      );
    });

    it('rejects when no snapshots exist', async () => {
      mockDbQuery.mockResolvedValue([]);

      const interaction = createInteraction('rollback');
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.content).toContain('No snapshots');
    });

    it('rejects when only one snapshot exists', async () => {
      mockDbQuery
        .mockResolvedValueOnce([{ id: 10, snapshot_at: new Date('2026-04-15') }])
        .mockResolvedValueOnce([]);

      const interaction = createInteraction('rollback');
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.content).toContain('only one snapshot');
    });
  });

  describe('export subcommand', () => {
    it('exports CSV with data', async () => {
      mockGetLatestForGuild.mockResolvedValue([
        { name_display: 'Alice', name_canonical: 'alice', sim_power: 500000, total_power: 1000000, sim_prev: 450000, total_prev: 950000, sim_pct_change: 11.1, total_pct_change: 5.3 },
      ]);

      const interaction = createInteraction('export');
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.files).toBeDefined();
    });

    it('rejects when no data', async () => {
      mockGetLatestForGuild.mockResolvedValue([]);

      const interaction = createInteraction('export');
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.content).toContain('No data');
    });
  });

  it('rejects when database not configured', async () => {
    mockDbIsConfigured.mockReturnValue(false);

    const interaction = createInteraction('stats');
    await expect(cmd.execute(interaction)).rejects.toThrow('not configured');
  });
});
