import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSnailLeaderboard } = vi.hoisted(() => ({
  mockGetSnailLeaderboard: vi.fn(),
}));

vi.mock('../src/lib/database.js', () => ({
  database: { getSnailLeaderboard: mockGetSnailLeaderboard },
}));

import cmd from '../src/commands/leaderboard.js';

function createInteraction(overrides: Record<string, unknown> = {}) {
  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    options: { getInteger: vi.fn().mockReturnValue(null) },
    guildId: 'guild-456',
    guild: { name: 'TestGuild' },
    client: {
      users: { fetch: vi.fn().mockResolvedValue({ username: 'Player1' }) },
    },
    ...overrides,
  };
}

describe('leaderboard command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects DM usage (no guild)', async () => {
    const interaction = createInteraction({ guildId: null });
    await cmd.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('only be used in a server') }),
    );
  });

  it('shows leaderboard with data', async () => {
    mockGetSnailLeaderboard.mockResolvedValue([
      { userId: 'u1', analysis_count: 15, last_analysis: '2026-04-14T10:00:00Z' },
      { userId: 'u2', analysis_count: 10, last_analysis: '2026-04-13T08:00:00Z' },
    ]);

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeDefined();
  });

  it('shows empty message when no data', async () => {
    mockGetSnailLeaderboard.mockResolvedValue([]);

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('No activity data');
  });

  it('handles leaderboard null response', async () => {
    mockGetSnailLeaderboard.mockResolvedValue(null);

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('No activity data');
  });

  it('passes custom limit option', async () => {
    mockGetSnailLeaderboard.mockResolvedValue([]);

    const interaction = createInteraction({
      options: { getInteger: vi.fn().mockReturnValue(25) },
    });
    await cmd.execute(interaction);

    expect(mockGetSnailLeaderboard).toHaveBeenCalledWith('guild-456', 25);
  });

  it('handles API error gracefully', async () => {
    mockGetSnailLeaderboard.mockRejectedValue(new Error('ECONNREFUSED'));

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('Failed to fetch leaderboard');
  });

  it('handles user fetch failure gracefully', async () => {
    mockGetSnailLeaderboard.mockResolvedValue([
      { userId: 'u1', analysis_count: 5, last_analysis: '2026-04-14T10:00:00Z' },
    ]);

    const interaction = createInteraction({
      client: {
        users: { fetch: vi.fn().mockRejectedValue(new Error('Unknown user')) },
      },
    });
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeDefined();
  });
});
