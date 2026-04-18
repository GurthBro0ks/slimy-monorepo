import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDbIsConfigured, mockFetchClubStats, mockBuildClubStatsEmbed, mockBuildCsv, mockTrackCommand } = vi.hoisted(() => ({
  mockDbIsConfigured: vi.fn(),
  mockFetchClubStats: vi.fn(),
  mockBuildClubStatsEmbed: vi.fn(),
  mockBuildCsv: vi.fn(),
  mockTrackCommand: vi.fn(),
}));

vi.mock('../src/lib/database.js', () => ({
  database: { isConfigured: mockDbIsConfigured },
}));

vi.mock('../src/lib/club-stats-service.js', () => ({
  fetchClubStats: mockFetchClubStats,
  buildClubStatsEmbed: mockBuildClubStatsEmbed,
  buildCsv: mockBuildCsv,
}));

vi.mock('../src/lib/metrics.js', () => ({
  trackCommand: mockTrackCommand,
}));

import cmd from '../src/commands/club-stats.js';

function createInteraction(overrides: Record<string, unknown> = {}) {
  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    options: {
      getString: vi.fn((name: string) => {
        if (name === 'metric') return 'both';
        if (name === 'format') return null;
        return null;
      }),
      getInteger: vi.fn().mockReturnValue(null),
    },
    member: {
      permissions: { has: vi.fn().mockReturnValue(true) },
      roles: { cache: { has: vi.fn().mockReturnValue(false) } },
    },
    guildId: 'guild-456',
    ...overrides,
  } as unknown as import('discord.js').ChatInputCommandInteraction;
}

describe('club-stats command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbIsConfigured.mockReturnValue(true);
    mockFetchClubStats.mockResolvedValue({
      latest: [
        { name_display: 'Alice', total_power: 1000000, sim_power: 500000 },
      ],
    });
    mockBuildClubStatsEmbed.mockReturnValue({
      embed: { data: { title: 'test' } },
    });
    mockBuildCsv.mockReturnValue('Name,Power\nAlice,1000000');
  });

  it('rejects when database not configured', async () => {
    mockDbIsConfigured.mockReturnValue(false);

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const reply = (interaction.reply as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]
      ?? (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(reply?.content ?? reply).toContain('not configured');
  });

  it('rejects user without permissions', async () => {
    const interaction = createInteraction({
      member: {
        permissions: { has: vi.fn().mockReturnValue(false) },
        roles: { cache: { has: vi.fn().mockReturnValue(false) } },
      },
    });
    await cmd.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('administrator') }),
    );
  });

  it('shows embed with stats data', async () => {
    const interaction = createInteraction();
    await cmd.execute(interaction);

    expect(mockFetchClubStats).toHaveBeenCalledWith('guild-456', expect.objectContaining({ metric: 'both' }));
    expect(interaction.editReply).toHaveBeenCalled();
  });

  it('shows CSV when format option is csv', async () => {
    const interaction = createInteraction({
      options: {
        getString: vi.fn((name: string) => {
          if (name === 'metric') return 'total';
          if (name === 'format') return 'csv';
          return null;
        }),
        getInteger: vi.fn().mockReturnValue(null),
      },
    });
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.files).toBeDefined();
  });

  it('shows empty message when no data', async () => {
    mockFetchClubStats.mockResolvedValue({ latest: [] });

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('No club stats');
  });

  it('handles fetch error', async () => {
    mockFetchClubStats.mockRejectedValue(new Error('Query failed'));

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const reply = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]
      ?? (interaction.reply as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(reply?.content ?? reply).toContain('Query failed');
  });
});
