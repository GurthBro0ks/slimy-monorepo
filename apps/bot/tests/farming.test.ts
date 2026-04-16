import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

vi.mock('../src/lib/metrics.js', () => ({
  metrics: { trackCommand: vi.fn(), trackError: vi.fn() },
  trackCommand: vi.fn(),
}));

import cmd from '../src/commands/farming.js';

const originalFetch = globalThis.fetch;

function createInteraction(subcommand: string, options: Record<string, unknown> = {}) {
  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    options: {
      getSubcommand: vi.fn().mockReturnValue(subcommand),
      getString: vi.fn((name: string) => options[name] ?? null),
      getInteger: vi.fn((name: string) => options[name] ?? null),
    },
    user: { id: 'user-123' },
    guildId: 'guild-456',
    ...options._overrides,
  } as unknown as import('discord.js').ChatInputCommandInteraction;
}

describe('farming command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('trigger subcommand', () => {
    it('triggers dry run successfully', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          status: 'success',
          report: {
            total_actions: 3,
            weekly_spend_usd: 1.5,
            weekly_budget_usd: 5,
            farming_quality: 'B+',
            protocols_used_ever: ['uniswap'],
          },
        }),
      });

      const interaction = createInteraction('trigger', { mode: 'dry' });
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.embeds).toBeDefined();
    });

    it('handles API failure', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ status: 'error', message: 'Rate limited' }),
      });

      const interaction = createInteraction('trigger', { mode: 'dry' });
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.content).toContain('failed');
    });
  });

  describe('status subcommand', () => {
    it('shows farming dashboard', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          status: 'success',
          farming: {
            farming_quality: 'A',
            actions_last_30d: 25,
            weekly_spend_usd: 3.5,
            weekly_budget_usd: 5,
            unique_protocols_30d: 4,
            unique_pairs_30d: 8,
          },
          airdrops: [
            { protocol: 'Uniswap', token: 'UNI', status: 'active', est_value: '$500', tier: 'S' },
          ],
        }),
      });

      const interaction = createInteraction('status');
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.embeds).toBeDefined();
    });

    it('handles status failure', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ status: 'error', message: 'Service unavailable' }),
      });

      const interaction = createInteraction('status');
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.content).toContain('failed');
    });
  });

  describe('log subcommand', () => {
    it('shows farming log entries', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          status: 'success',
          entries: [
            { timestamp: '2026-04-15T10:00:00Z', status: 'simulated', type: 'swap', protocol: 'Uniswap', amount_usd: 1.5 },
          ],
          total: 15,
        }),
      });

      const interaction = createInteraction('log', { count: 5 });
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.embeds).toBeDefined();
    });

    it('shows empty log', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ status: 'success', entries: [], total: 0 }),
      });

      const interaction = createInteraction('log');
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.content).toContain('No farming actions');
    });
  });

  describe('airdrops subcommand', () => {
    it('shows airdrop targets', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          status: 'success',
          targets: {
            'LayerZero': { token: 'ZRO', est_value: '$1000', note: 'Mainnet live', tier: 'S' },
            'zkSync': { token: 'ZK', est_value: '$200', note: 'Airdrop done', tier: 'F' },
          },
        }),
      });

      const interaction = createInteraction('airdrops');
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.embeds).toBeDefined();
    });

    it('handles airdrops API failure', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ status: 'error', message: 'Failed to fetch' }),
      });

      const interaction = createInteraction('airdrops');
      await cmd.execute(interaction);

      const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.content).toContain('Failed');
    });
  });

  it('handles fetch network error', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const interaction = createInteraction('status');
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('API unreachable');
  });
});
