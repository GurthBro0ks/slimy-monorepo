import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDbIsConfigured, mockDbGetMemories, mockMemoryStoreListMemos } = vi.hoisted(() => ({
  mockDbIsConfigured: vi.fn(),
  mockDbGetMemories: vi.fn(),
  mockMemoryStoreListMemos: vi.fn(),
}));

vi.mock('../src/lib/database.js', () => ({
  database: {
    isConfigured: mockDbIsConfigured,
    getMemories: mockDbGetMemories,
  },
}));

vi.mock('../src/lib/memory.js', () => ({
  memoryStore: {
    listMemos: mockMemoryStoreListMemos,
  },
}));

import cmd from '../src/commands/export.js';

function createInteraction(overrides: Record<string, unknown> = {}) {
  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    user: { id: 'user-123', username: 'testuser' },
    guildId: 'guild-456',
    guild: { name: 'TestGuild' },
    ...overrides,
  } as unknown as import('discord.js').ChatInputCommandInteraction;
}

describe('export command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports memories from database when configured', async () => {
    mockDbIsConfigured.mockReturnValue(true);
    mockDbGetMemories.mockResolvedValue([
      { id: '1', note: 'test note', tags: '["tag1"]', context: '{}', created_at: '2026-01-01' },
      { id: '2', note: 'another note', tags: null, context: null, created_at: '2026-01-02' },
    ]);

    const interaction = createInteraction();
    await cmd.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledWith(
      expect.objectContaining({ flags: 64 }),
    );
    expect(interaction.editReply).toHaveBeenCalled();
    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds || call.files).toBeDefined();
  });

  it('shows empty message when no memories found', async () => {
    mockDbIsConfigured.mockReturnValue(true);
    mockDbGetMemories.mockResolvedValue([]);

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('No memories found');
  });

  it('falls back to memoryStore when database not configured', async () => {
    mockDbIsConfigured.mockReturnValue(false);
    mockMemoryStoreListMemos.mockResolvedValue([
      { _id: 'a1', content: 'memo content', tags: [], context: {}, createdAt: '2026-02-01' },
    ]);

    const interaction = createInteraction();
    await cmd.execute(interaction);

    expect(mockMemoryStoreListMemos).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalled();
  });

  it('handles large payloads with file-only reply', async () => {
    mockDbIsConfigured.mockReturnValue(true);
    const bigNotes = Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      note: 'x'.repeat(100),
      tags: null,
      context: null,
      created_at: '2026-01-01',
    }));
    mockDbGetMemories.mockResolvedValue(bigNotes);

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.files).toBeDefined();
  });

  it('handles database errors gracefully', async () => {
    mockDbIsConfigured.mockReturnValue(true);
    mockDbGetMemories.mockRejectedValue(new Error('DB down'));

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('Export failed');
  });

  it('handles null guildId (DM context)', async () => {
    mockDbIsConfigured.mockReturnValue(true);
    mockDbGetMemories.mockResolvedValue([
      { id: '1', note: 'dm note', tags: null, context: null, created_at: '2026-01-01' },
    ]);

    const interaction = createInteraction({ guildId: null, guild: null });
    await cmd.execute(interaction);

    expect(interaction.editReply).toHaveBeenCalled();
  });
});

