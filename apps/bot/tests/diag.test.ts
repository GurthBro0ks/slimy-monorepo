import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDbIsConfigured, mockDbTestConnection, mockDbGetPool, mockMetricsGetStats } = vi.hoisted(() => ({
  mockDbIsConfigured: vi.fn(),
  mockDbTestConnection: vi.fn(),
  mockDbGetPool: vi.fn(),
  mockMetricsGetStats: vi.fn(),
}));

vi.mock('../src/lib/database.js', () => ({
  database: {
    isConfigured: mockDbIsConfigured,
    testConnection: mockDbTestConnection,
    getPool: mockDbGetPool,
  },
}));

vi.mock('../src/lib/metrics.js', () => ({
  metrics: { getStats: mockMetricsGetStats },
  trackCommand: vi.fn(),
}));

import cmd from '../src/commands/diag.js';

function createInteraction(overrides: Record<string, unknown> = {}) {
  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    client: {
      ws: { ping: 42 },
      guilds: { cache: { size: 5 } },
      users: { cache: { size: 100 } },
    },
    ...overrides,
  };
}

describe('diag command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbIsConfigured.mockReturnValue(false);
    mockMetricsGetStats.mockReturnValue({
      summary: { totalCommands: 10, successRate: '90%', totalErrors: 1 },
      commands: { chat: { count: 5, avgTime: '100ms' } },
    });
  });

  it('shows diagnostics with database not configured', async () => {
    mockDbIsConfigured.mockReturnValue(false);
    const interaction = createInteraction();
    await cmd.execute(interaction);

    expect(interaction.editReply).toHaveBeenCalled();
    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeDefined();
  });

  it('shows database connected with table stats', async () => {
    mockDbIsConfigured.mockReturnValue(true);
    mockDbTestConnection.mockResolvedValue(undefined);
    const mockQuery = vi.fn()
      .mockResolvedValueOnce([[{ count: 50 }]])
      .mockResolvedValueOnce([[{ count: 10 }]])
      .mockResolvedValueOnce([[{ count: 5 }]]);
    mockDbGetPool.mockReturnValue({ query: mockQuery });

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeDefined();
  });

  it('shows database error when connection fails', async () => {
    mockDbIsConfigured.mockReturnValue(true);
    mockDbTestConnection.mockRejectedValue(new Error('Connection refused'));

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeDefined();
  });

  it('shows metrics when available', async () => {
    mockMetricsGetStats.mockReturnValue({
      summary: { totalCommands: 42, successRate: '95%', totalErrors: 2 },
      commands: {
        chat: { count: 20, avgTime: '150ms' },
        dream: { count: 15, avgTime: '3000ms' },
        snail: { count: 7, avgTime: '500ms' },
      },
    });

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeDefined();
  });

  it('handles metrics unavailability', async () => {
    mockMetricsGetStats.mockImplementation(() => {
      throw new Error('Metrics unavailable');
    });

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeDefined();
  });
});
