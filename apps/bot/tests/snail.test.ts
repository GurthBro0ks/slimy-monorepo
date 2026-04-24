import { describe, it, expect, vi, beforeEach } from 'vitest';
import cmd from '../src/commands/snail.js';

const MOCK_CODES = Array.from({ length: 50 }, (_, i) => ({
  code: `CODE${String(i).padStart(3, '0')}`,
  source: 'test',
  ts: new Date().toISOString(),
  tags: ['active'],
  expires: null,
  region: 'global',
  category: i < 30 ? 'latest' : 'older',
}));

const MOCK_CODES_RESPONSE = {
  codes: MOCK_CODES,
  count: MOCK_CODES.length,
};

function mockFetch() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => MOCK_CODES_RESPONSE,
  }));
}

function createInteraction(subcommand: string) {
  return {
    options: { getSubcommand: () => subcommand, getAttachment: () => null },
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    fetchReply: vi.fn().mockResolvedValue({}),
    channel: { sendTyping: vi.fn().mockResolvedValue(undefined) },
    user: { id: 'test-user', username: 'test' },
    guildId: null,
  };
}

function extractSessionId(editReplyCall: unknown): string | null {
  const call = (editReplyCall as unknown[]);
  if (!call || !call[0]) return null;
  const opts = call[0] as { components?: { components: { data: { custom_id: string } }[] }[] };
  if (!opts.components) return null;
  for (const row of opts.components) {
    for (const btn of row.components) {
      const customId = btn?.data?.custom_id;
      if (customId) {
        const parts = customId.split(':');
        if (parts.length >= 4) return parts[3];
      }
    }
  }
  return null;
}

function createButtonInteraction(customId: string) {
  return {
    customId,
    reply: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    isButton: () => true,
  };
}

describe('snail command — module structure', () => {
  it('should export data with name', () => {
    expect(cmd.data.name).toBe('snail');
  });

  it('should export execute function', () => {
    expect(typeof cmd.execute).toBe('function');
  });

  it('should export handleButton function', () => {
    expect(typeof cmd.handleButton).toBe('function');
  });
});

describe('snail command — subcommands', () => {
  it('should have analyze subcommand', () => {
    const json = cmd.data.toJSON();
    const names = json.options?.map((o: { name: string }) => o.name) || [];
    expect(names).toContain('analyze');
  });

  it('should have stats subcommand', () => {
    const json = cmd.data.toJSON();
    const names = json.options?.map((o: { name: string }) => o.name) || [];
    expect(names).toContain('stats');
  });

  it('should have codes subcommand', () => {
    const json = cmd.data.toJSON();
    const names = json.options?.map((o: { name: string }) => o.name) || [];
    expect(names).toContain('codes');
  });

  it('should NOT have sheet subcommand', () => {
    const json = cmd.data.toJSON();
    const names = json.options?.map((o: { name: string }) => o.name) || [];
    expect(names).not.toContain('sheet');
  });
});

describe('snail command — handleAnalyze without attachment', () => {
  it('should require screenshot attachment', async () => {
    const interaction = createInteraction('analyze');
    await cmd.execute(interaction);
    expect(interaction.reply).toHaveBeenCalled();
    expect(interaction.reply.mock.calls[0][0].content).toContain('attach');
  });
});

describe('snail codes — pagination', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockFetch();
  });

  it('should render codes with embed and pagination buttons', async () => {
    const interaction = createInteraction('codes');
    await cmd.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: false });
    expect(interaction.editReply).toHaveBeenCalledTimes(1);

    const editOpts = interaction.editReply.mock.calls[0][0] as {
      embeds: unknown[];
      components: unknown[];
    };
    expect(editOpts.embeds).toHaveLength(1);
    expect(editOpts.components.length).toBeGreaterThanOrEqual(1);
  });

  it('should advance to page 2 when Next button is clicked', async () => {
    const interaction = createInteraction('codes');
    await cmd.execute(interaction);

    const sessionId = extractSessionId(interaction.editReply.mock.calls[0]);
    expect(sessionId).toBeTruthy();

    const btnInteraction = createButtonInteraction(`snail:codes:next:${sessionId}`);
    await cmd.handleButton(btnInteraction as never);

    expect(btnInteraction.update).toHaveBeenCalledTimes(1);
    const updateOpts = btnInteraction.update.mock.calls[0][0] as {
      embeds: { data: { footer: { text: string } } }[];
    };
    const footerText = updateOpts.embeds[0].data.footer.text;
    expect(footerText).toContain('Page 2/');
  });

  it('should go back to page 1 when Prev button is clicked from page 2', async () => {
    const interaction = createInteraction('codes');
    await cmd.execute(interaction);

    const sessionId = extractSessionId(interaction.editReply.mock.calls[0]);

    const nextBtn = createButtonInteraction(`snail:codes:next:${sessionId}`);
    await cmd.handleButton(nextBtn as never);
    expect(nextBtn.update).toHaveBeenCalled();

    const prevBtn = createButtonInteraction(`snail:codes:prev:${sessionId}`);
    await cmd.handleButton(prevBtn as never);

    const updateOpts = prevBtn.update.mock.calls[0][0] as {
      embeds: { data: { footer: { text: string } } }[];
    };
    const footerText = updateOpts.embeds[0].data.footer.text;
    expect(footerText).toContain('Page 1/');
  });

  it('should stay on page 1 when Prev is clicked from page 1', async () => {
    const interaction = createInteraction('codes');
    await cmd.execute(interaction);

    const sessionId = extractSessionId(interaction.editReply.mock.calls[0]);

    const prevBtn = createButtonInteraction(`snail:codes:prev:${sessionId}`);
    await cmd.handleButton(prevBtn as never);

    const updateOpts = prevBtn.update.mock.calls[0][0] as {
      embeds: { data: { footer: { text: string } } }[];
    };
    expect(updateOpts.embeds[0].data.footer.text).toContain('Page 1/');
  });

  it('should show expired session message for unknown session', async () => {
    const btnInteraction = createButtonInteraction('snail:codes:next:nonexistent-session');
    await cmd.handleButton(btnInteraction as never);

    expect(btnInteraction.reply).toHaveBeenCalledTimes(1);
    const replyOpts = btnInteraction.reply.mock.calls[0][0] as { content: string };
    expect(replyOpts.content).toContain('Session expired');
  });

  it('should switch to Older codes and reset to page 1', async () => {
    const interaction = createInteraction('codes');
    await cmd.execute(interaction);

    const sessionId = extractSessionId(interaction.editReply.mock.calls[0]);

    const nextBtn = createButtonInteraction(`snail:codes:next:${sessionId}`);
    await cmd.handleButton(nextBtn as never);

    const olderBtn = createButtonInteraction(`snail:codes:older:${sessionId}`);
    await cmd.handleButton(olderBtn as never);

    const updateOpts = olderBtn.update.mock.calls[0][0] as {
      embeds: { data: { footer: { text: string }; title: string } }[];
    };
    expect(updateOpts.embeds[0].data.title).toContain('Older');
    expect(updateOpts.embeds[0].data.footer.text).toContain('Page 1/');
  });

  it('should switch back to Latest codes and reset to page 1', async () => {
    const interaction = createInteraction('codes');
    await cmd.execute(interaction);

    const sessionId = extractSessionId(interaction.editReply.mock.calls[0]);

    const olderBtn = createButtonInteraction(`snail:codes:older:${sessionId}`);
    await cmd.handleButton(olderBtn as never);

    const latestBtn = createButtonInteraction(`snail:codes:latest:${sessionId}`);
    await cmd.handleButton(latestBtn as never);

    const updateOpts = latestBtn.update.mock.calls[0][0] as {
      embeds: { data: { footer: { text: string }; title: string } }[];
    };
    expect(updateOpts.embeds[0].data.title).toContain('Latest');
    expect(updateOpts.embeds[0].data.footer.text).toContain('Page 1/');
  });

  it('should ignore non-snail button interactions', async () => {
    const btnInteraction = createButtonInteraction('other:codes:next:abc123');
    await cmd.handleButton(btnInteraction as never);

    expect(btnInteraction.update).not.toHaveBeenCalled();
    expect(btnInteraction.reply).not.toHaveBeenCalled();
  });

  it('should handle Copy All button', async () => {
    const interaction = createInteraction('codes');
    await cmd.execute(interaction);

    const sessionId = extractSessionId(interaction.editReply.mock.calls[0]);

    const copyBtn = createButtonInteraction(`snail:codes:copy:${sessionId}`);
    await cmd.handleButton(copyBtn as never);

    expect(copyBtn.reply).toHaveBeenCalledTimes(1);
    const replyOpts = copyBtn.reply.mock.calls[0][0] as { content: string };
    expect(replyOpts.content).toContain('Codes');
  });

  it('should handle Copy Page button', async () => {
    const interaction = createInteraction('codes');
    await cmd.execute(interaction);

    const sessionId = extractSessionId(interaction.editReply.mock.calls[0]);

    const copyPageBtn = createButtonInteraction(`snail:codes:copypage:${sessionId}`);
    await cmd.handleButton(copyPageBtn as never);

    expect(copyPageBtn.reply).toHaveBeenCalledTimes(1);
    const replyOpts = copyPageBtn.reply.mock.calls[0][0] as { content: string };
    expect(replyOpts.content).toContain('Page 1');
  });
});
