import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCheckCooldown, mockGenerateImageWithSafety, mockGetEffectiveModesForChannel, mockTrackCommand, mockTrackError } = vi.hoisted(() => ({
  mockCheckCooldown: vi.fn(),
  mockGenerateImageWithSafety: vi.fn(),
  mockGetEffectiveModesForChannel: vi.fn(),
  mockTrackCommand: vi.fn(),
  mockTrackError: vi.fn(),
}));

vi.mock('../src/lib/rate-limiter.js', () => ({
  rateLimiter: { checkCooldown: mockCheckCooldown },
}));

vi.mock('../src/lib/images.js', () => ({
  generateImageWithSafety: mockGenerateImageWithSafety,
}));

vi.mock('../src/lib/modes.js', () => ({
  getEffectiveModesForChannel: mockGetEffectiveModesForChannel,
}));

vi.mock('../src/lib/metrics.js', () => ({
  metrics: { trackCommand: mockTrackCommand, trackError: mockTrackError },
  trackCommand: mockTrackCommand,
  trackError: mockTrackError,
}));

vi.mock('../src/lib/logger.js', () => ({
  logError: vi.fn(),
}));

import cmd from '../src/commands/dream.js';

function createInteraction(overrides: Record<string, unknown> = {}) {
  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    options: {
      getString: vi.fn((name: string) => {
        if (name === 'prompt') return 'a beautiful sunset';
        if (name === 'style') return null;
        return null;
      }),
    },
    user: { id: 'user-123' },
    guildId: 'guild-456',
    guild: { id: 'guild-456' },
    channel: { id: 'channel-789' },
    ...overrides,
  } as unknown as import('discord.js').ChatInputCommandInteraction;
}

describe('dream command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckCooldown.mockReturnValue({ limited: false });
    mockGetEffectiveModesForChannel.mockReturnValue({});
    mockGenerateImageWithSafety.mockResolvedValue({
      success: true,
      buffer: Buffer.from('fake-image-data'),
    });
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_API_KEY;
  });

  it('rejects when rate limited', async () => {
    mockCheckCooldown.mockReturnValue({ limited: true, remaining: 5 });
    process.env.OPENAI_API_KEY = 'test-key';

    const interaction = createInteraction();
    await cmd.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('Slow down') }),
    );
  });

  it('rejects when no API key configured', async () => {
    const interaction = createInteraction();
    await cmd.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('OPENAI_API_KEY') }),
    );
  });

  it('generates image successfully', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const interaction = createInteraction();
    await cmd.execute(interaction);

    expect(interaction.editReply).toHaveBeenCalled();
    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.files).toBeDefined();
    expect(call.content).toContain('Dream Created');
  });

  it('handles generation failure', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockGenerateImageWithSafety.mockResolvedValue({
      success: false,
      message: 'Content policy violation',
    });

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('Content policy violation');
  });

  it('handles unexpected errors', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockGenerateImageWithSafety.mockRejectedValue(new Error('Network error'));

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('failed');
  });

  it('uses style option when provided', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const interaction = createInteraction({
      options: {
        getString: vi.fn((name: string) => {
          if (name === 'prompt') return 'a cyberpunk city';
          if (name === 'style') return 'neon';
          return null;
        }),
      },
    });
    await cmd.execute(interaction);

    expect(mockGenerateImageWithSafety).toHaveBeenCalledWith(
      expect.objectContaining({ styleKey: 'neon', styleName: 'Neon Dreams' }),
    );
  });
});
