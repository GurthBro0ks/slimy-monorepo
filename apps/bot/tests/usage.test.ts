import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockParseWindow, mockFetchOpenAIUsage, mockFetchLocalImageStats, mockAggregateUsage,
} = vi.hoisted(() => ({
  mockParseWindow: vi.fn(),
  mockFetchOpenAIUsage: vi.fn(),
  mockFetchLocalImageStats: vi.fn(),
  mockAggregateUsage: vi.fn(),
}));

vi.mock('../src/lib/usage-openai.js', () => ({
  parseWindow: mockParseWindow,
  fetchOpenAIUsage: mockFetchOpenAIUsage,
  fetchLocalImageStats: mockFetchLocalImageStats,
  aggregateUsage: mockAggregateUsage,
  PRICING: {
    'gpt-4o-mini': { input_per_million: 0.15, output_per_million: 0.6 },
    'dall-e-3': { standard: 0.04, hd: 0.08 },
  },
}));

vi.mock('../src/lib/logger.js', () => ({
  logError: vi.fn(),
}));

vi.mock('../src/lib/metrics.js', () => ({
  metrics: { trackCommand: vi.fn() },
  trackCommand: vi.fn(),
}));

import cmd from '../src/commands/usage.js';

function createInteraction(overrides: Record<string, unknown> = {}) {
  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    options: {
      getString: vi.fn((name: string) => {
        if (name === 'window') return '7d';
        return null;
      }),
    },
    member: {
      permissions: {
        has: vi.fn((perm: bigint) => {
          const ADMIN = BigInt('8');
          return perm === ADMIN;
        }),
      },
    },
    guildId: 'guild-456',
    ...overrides,
  };
}

describe('usage command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParseWindow.mockReturnValue({ startDate: '2026-04-09', endDate: '2026-04-16' });
    mockAggregateUsage.mockReturnValue({
      byModel: [
        { model: 'gpt-4o-mini', inputTokens: 1000, outputTokens: 500, requests: 10, cost: 0.045 },
      ],
      totalCost: 0.045,
      totalRequests: 10,
    });
  });

  it('denies non-admin users', async () => {
    const interaction = createInteraction({
      member: {
        permissions: { has: vi.fn(() => false) },
      },
    });
    await cmd.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('administrators only') }),
    );
    expect(interaction.deferReply).not.toHaveBeenCalled();
  });

  it('shows usage data for admin users', async () => {
    const interaction = createInteraction();
    await cmd.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeDefined();
  });

  it('handles empty usage data', async () => {
    mockAggregateUsage.mockReturnValue({ byModel: [], totalCost: 0, totalRequests: 0 });

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeDefined();
  });

  it('handles invalid date range', async () => {
    mockParseWindow.mockImplementation(() => { throw new Error('Invalid start date'); });

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('Invalid date range');
  });

  it('handles API fetch failure gracefully', async () => {
    mockAggregateUsage.mockImplementation(() => { throw new Error('API timeout'); });

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('Failed');
  });

  it('allows ManageGuild permission', async () => {
    const MANAGE_GUILD = BigInt('32');
    const interaction = createInteraction({
      member: {
        permissions: { has: vi.fn((perm: bigint) => perm === MANAGE_GUILD) },
      },
    });
    await cmd.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
  });
});
