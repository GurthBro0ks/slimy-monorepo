import cmd from '../src/commands/snail.js';

describe('snail command — module structure', () => {
  it('should export data with name', () => {
    expect(cmd.data.name).toBe('snail');
  });

  it('should export execute function', () => {
    expect(typeof cmd.execute).toBe('function');
  });
});

describe('snail command — handleSheet', () => {
  it('should show sheets not configured message', async () => {
    let editResult: unknown = null;
    await cmd.execute({
      options: { getSubcommand: () => 'sheet', getAttachment: () => null },
      deferReply: async () => {},
      editReply: async (opts: Record<string, unknown>) => { editResult = opts; },
      reply: async () => {},
      channel: { sendTyping: async () => {} },
      user: { id: 'test-user', username: 'test' },
      guildId: null,
    });
    expect(editResult).toBeTruthy();
    expect((editResult as { content: string }).content).toContain('not yet configured');
  });
});

describe('snail command — handleAnalyze without attachment', () => {
  it('should require screenshot attachment', async () => {
    let replyResult: unknown = null;
    await cmd.execute({
      options: { getSubcommand: () => 'analyze', getAttachment: () => null },
      deferReply: async () => {},
      editReply: async () => {},
      reply: async (opts: { content: string }) => { replyResult = opts; },
      channel: { sendTyping: async () => {} },
      user: { id: 'test-user', username: 'test' },
      guildId: null,
    });
    expect(replyResult).toBeTruthy();
    expect((replyResult as { content: string }).content).toContain('attach');
  });
});
