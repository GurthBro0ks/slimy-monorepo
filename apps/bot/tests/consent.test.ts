import cmd from '../src/commands/consent.js';

function uid() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mockInteraction(options: Record<string, unknown> = {}) {
  const replies: Array<{ content?: string; ephemeral?: boolean }> = [];
  return {
    options: {
      getSubcommand: options.subcommand || (() => 'status'),
      getBoolean: options.getBoolean || (() => null),
    },
    guild: { id: options.guildId || uid() },
    user: { id: options.userId || uid() },
    reply: async (opts: { content: string; ephemeral?: boolean }) => {
      replies.push(opts);
    },
    replies,
  };
}

describe('consent command — execute', () => {
  it('should show consent status (OFF by default)', async () => {
    const userId = uid(), guildId = uid();
    const interaction = mockInteraction({ subcommand: () => 'status', userId, guildId });
    await cmd.execute(interaction);
    expect(interaction.replies.length).toBe(1);
    expect(interaction.replies[0].ephemeral).toBe(true);
    expect(interaction.replies[0].content).toContain('Memory');
  });

  it('should set consent to true', async () => {
    const userId = uid(), guildId = uid();
    const interaction = mockInteraction({ subcommand: () => 'set', getBoolean: () => true, userId, guildId });
    await cmd.execute(interaction);
    expect(interaction.replies.length).toBe(1);
    expect(interaction.replies[0].content).toContain('ON');
  });

  it('should set consent to false', async () => {
    const userId = uid(), guildId = uid();
    const interaction = mockInteraction({ subcommand: () => 'set', getBoolean: () => false, userId, guildId });
    await cmd.execute(interaction);
    expect(interaction.replies.length).toBe(1);
    expect(interaction.replies[0].content).toContain('OFF');
  });

  it('should show usage for unknown subcommand', async () => {
    const userId = uid(), guildId = uid();
    const interaction = mockInteraction({ subcommand: () => 'unknown', getBoolean: () => null, userId, guildId });
    await cmd.execute(interaction);
    expect(interaction.replies.length).toBe(1);
    expect(interaction.replies[0].content).toContain('Usage');
  });
});
