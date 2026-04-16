import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSetModes, mockViewModes, mockListModes, mockFormatModeState } = vi.hoisted(() => ({
  mockSetModes: vi.fn(),
  mockViewModes: vi.fn(),
  mockListModes: vi.fn(),
  mockFormatModeState: vi.fn(),
}));

vi.mock('../src/lib/mode-store.js', () => ({
  setModes: mockSetModes,
  viewModes: mockViewModes,
  listModes: mockListModes,
  formatModeState: mockFormatModeState,
}));

import cmd from '../src/commands/mode.js';

function createMockChannel(id: string, type: 'text' | 'category' | 'thread' = 'text', parentId?: string) {
  return {
    id,
    type: type === 'category' ? 4 : 0,
    name: `channel-${id}`,
    isThread: () => type === 'thread',
    parentId: parentId ?? null,
  };
}

function createInteraction(subcommand: string, options: Record<string, unknown> = {}) {
  const mockChannel = options._channel
    ? createMockChannel(options._channel as string)
    : createMockChannel('chan-123');
  delete options._channel;

  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    options: {
      getSubcommand: vi.fn().mockReturnValue(subcommand),
      getString: vi.fn((name: string) => options[name] ?? null),
      getChannel: vi.fn((name: string) => options[name] ?? null),
    },
    guildId: 'guild-456',
    guild: {
      channels: {
        cache: {
          get: vi.fn((id: string) => createMockChannel(id)),
        },
      },
    },
    channel: mockChannel,
    user: { id: 'user-123' },
    ...options._overrides,
  } as unknown as import('discord.js').ChatInputCommandInteraction;
}

describe('mode command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFormatModeState.mockImplementation((modes: string[]) => modes.join(', ') || 'none');
    mockViewModes.mockResolvedValue({
      direct: { modes: ['chat', 'personality'] },
      inherited: [],
      effective: { modes: ['chat', 'personality'] },
    });
    mockSetModes.mockResolvedValue(undefined);
    mockListModes.mockResolvedValue([
      { label: 'channel:chan-123', modes: ['chat', 'personality'] },
    ]);
  });

  it('set subcommand applies profile to current channel', async () => {
    const interaction = createInteraction('set', { profile: 'chat|personality|rating_pg13' });
    await cmd.execute(interaction);

    expect(mockSetModes).toHaveBeenCalledWith(expect.objectContaining({
      guildId: 'guild-456',
      modes: ['chat', 'personality', 'rating_pg13'],
      operation: 'replace',
    }));
    expect(interaction.editReply).toHaveBeenCalled();
  });

  it('set subcommand with clear profile clears modes', async () => {
    const interaction = createInteraction('set', { profile: 'clear' });
    await cmd.execute(interaction);

    expect(mockSetModes).toHaveBeenCalledWith(expect.objectContaining({
      modes: [],
      operation: 'clear',
    }));
  });

  it('view subcommand shows mode config', async () => {
    const interaction = createInteraction('view');
    await cmd.execute(interaction);

    expect(mockViewModes).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalled();
  });

  it('list subcommand shows all configs', async () => {
    const interaction = createInteraction('list', { filter: 'all' });
    await cmd.execute(interaction);

    expect(mockListModes).toHaveBeenCalledWith(expect.objectContaining({ guildId: 'guild-456' }));
    expect(interaction.editReply).toHaveBeenCalled();
  });

  it('list subcommand with empty results', async () => {
    mockListModes.mockResolvedValue([]);

    const interaction = createInteraction('list', { filter: 'all' });
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('No mode configurations');
  });

  it('clear subcommand clears modes', async () => {
    const interaction = createInteraction('clear');
    await cmd.execute(interaction);

    expect(mockSetModes).toHaveBeenCalledWith(expect.objectContaining({
      modes: [],
      operation: 'clear',
    }));
    expect(interaction.editReply).toHaveBeenCalled();
  });

  it('handles unknown subcommand', async () => {
    const interaction = createInteraction('unknown');
    await cmd.execute(interaction);

    const reply = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]
      ?? (interaction.reply as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(reply).toBeDefined();
  });
});
