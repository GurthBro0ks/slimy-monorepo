import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetUserStats } = vi.hoisted(() => ({
  mockGetUserStats: vi.fn(),
}));

vi.mock('../src/lib/mcp-client.js', () => ({
  mcpClient: { getUserStats: mockGetUserStats },
}));

import cmd from '../src/commands/stats.js';

function createInteraction(overrides: Record<string, unknown> = {}) {
  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    options: {
      getUser: vi.fn().mockReturnValue(null),
      getString: vi.fn().mockReturnValue('30d'),
    },
    user: { id: 'user-123', username: 'testuser', displayAvatarURL: () => 'https://avatar.url/test.png', displayName: 'TestUser' },
    member: {
      permissions: { has: vi.fn().mockReturnValue(false) },
      roles: { cache: { some: vi.fn().mockReturnValue(false) } },
    },
    guildId: 'guild-456',
    ...overrides,
  };
}

describe('stats command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserStats.mockResolvedValue({
      stats: { messageCount: 100, imageGenerationCount: 5, lastActive: '2026-04-15T12:00:00Z' },
    });
  });

  it('shows own stats successfully', async () => {
    const interaction = createInteraction();
    await cmd.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeDefined();
  });

  it('shows other user stats when user has admin permissions', async () => {
    const targetUser = { id: 'other-789', username: 'target', displayAvatarURL: () => 'https://avatar.url/target.png', displayName: 'Target' };

    const interaction = createInteraction({
      options: {
        getUser: vi.fn().mockReturnValue(targetUser),
        getString: vi.fn().mockReturnValue('7d'),
      },
      member: {
        permissions: { has: vi.fn().mockReturnValue(true) },
        roles: { cache: { some: vi.fn().mockReturnValue(false) } },
      },
    });
    await cmd.execute(interaction);

    expect(mockGetUserStats).toHaveBeenCalledWith('other-789', 'guild-456', '7d');
  });

  it('denies other user stats without permissions', async () => {
    const targetUser = { id: 'other-789', username: 'target', displayAvatarURL: () => 'https://avatar.url/target.png', displayName: 'Target' };

    const interaction = createInteraction({
      options: {
        getUser: vi.fn().mockReturnValue(targetUser),
        getString: vi.fn().mockReturnValue('30d'),
      },
    });
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('admin/club permissions');
  });

  it('allows other user stats with club role', async () => {
    const targetUser = { id: 'other-789', username: 'target', displayAvatarURL: () => 'https://avatar.url/target.png', displayName: 'Target' };

    const interaction = createInteraction({
      options: {
        getUser: vi.fn().mockReturnValue(targetUser),
        getString: vi.fn().mockReturnValue('30d'),
      },
      member: {
        permissions: { has: vi.fn().mockReturnValue(false) },
        roles: { cache: { some: vi.fn().mockReturnValue(true) } },
      },
    });
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeDefined();
  });

  it('handles ECONNREFUSED error', async () => {
    mockGetUserStats.mockRejectedValue(new Error('ECONNREFUSED'));

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('Analytics service is currently unavailable');
  });

  it('handles generic errors', async () => {
    mockGetUserStats.mockRejectedValue(new Error('Something went wrong'));

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('Failed to fetch');
  });
});
