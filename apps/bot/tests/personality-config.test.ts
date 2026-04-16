import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockLoadPersonalityConfig, mockEvaluatePersonalityQuality, mockGetAnalytics, mockReloadConfig, mockSetAdjustment,
} = vi.hoisted(() => ({
  mockLoadPersonalityConfig: vi.fn(),
  mockEvaluatePersonalityQuality: vi.fn(),
  mockGetAnalytics: vi.fn(),
  mockReloadConfig: vi.fn(),
  mockSetAdjustment: vi.fn(),
}));

vi.mock('../src/lib/personality-engine.js', () => ({
  personalityEngine: {
    loadPersonalityConfig: mockLoadPersonalityConfig,
    evaluatePersonalityQuality: mockEvaluatePersonalityQuality,
    getAnalytics: mockGetAnalytics,
    reloadConfig: mockReloadConfig,
  },
}));

vi.mock('../src/lib/personality-store.js', () => ({
  setAdjustment: mockSetAdjustment,
}));

import cmd from '../src/commands/personality-config.js';

function createInteraction(subcommand: string, options: Record<string, unknown> = {}) {
  return {
    reply: vi.fn().mockResolvedValue(undefined),
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    options: {
      getSubcommand: vi.fn().mockReturnValue(subcommand),
      getString: vi.fn((name: string) => options[name] ?? null),
      getInteger: vi.fn((name: string) => options[name] ?? null),
    },
    user: { id: 'user-123', tag: 'testuser#0001' },
    member: {
      permissions: { has: vi.fn().mockReturnValue(true) },
    },
    ...options._overrides,
  } as unknown as import('discord.js').ChatInputCommandInteraction;
}

describe('personality-config command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadPersonalityConfig.mockReturnValue({
      traits: { humor: 7, enthusiasm: 8 },
      catchphrases: ['slime time!'],
      toneGuidelines: ['be friendly'],
      contextBehaviors: [{ scenario: 'greeting', guidance: 'be warm' }],
      adaptationRules: ['rule1'],
      adjustments: {},
    });
    mockGetAnalytics.mockReturnValue({
      catchphraseFrequency: { 'slime time!': 5 },
      toneConsistency: 0.85,
      userSatisfaction: 0.92,
    });
  });

  it('denies non-admin users', async () => {
    const interaction = createInteraction('view', {
      _overrides: {
        member: { permissions: { has: vi.fn().mockReturnValue(false) } },
      },
    });
    await cmd.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('Administrator') }),
    );
  });

  it('view subcommand shows config', async () => {
    const interaction = createInteraction('view');
    await cmd.execute(interaction);

    expect(mockLoadPersonalityConfig).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
  });

  it('adjust subcommand sets value', async () => {
    const interaction = createInteraction('adjust', { parameter: 'enthusiasm', value: 9 });
    await cmd.execute(interaction);

    expect(mockSetAdjustment).toHaveBeenCalledWith('enthusiasm', 9, expect.objectContaining({
      updatedBy: 'user-123',
    }));
    expect(mockReloadConfig).toHaveBeenCalled();
  });

  it('test subcommand runs evaluation', async () => {
    const interaction = createInteraction('test');
    await cmd.execute(interaction);

    expect(mockEvaluatePersonalityQuality).toHaveBeenCalled();
    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('test complete');
  });

  it('analytics subcommand shows analytics', async () => {
    const interaction = createInteraction('analytics');
    await cmd.execute(interaction);

    expect(mockGetAnalytics).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
  });
});
