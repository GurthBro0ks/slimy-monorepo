import { describe, it, expect, vi, beforeEach } from 'vitest';
import cmd from '../src/commands/snail.js';

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
    let replyResult: unknown = null;
    await cmd.execute({
      options: { getSubcommand: () => 'analyze', getAttachment: () => null },
      deferReply: async () => {},
      editReply: async () => {},
      reply: async (opts: { content: string }) => { replyResult = opts; },
      fetchReply: async () => ({}),
      channel: { sendTyping: async () => {} },
      user: { id: 'test-user', username: 'test' },
      guildId: null,
    });
    expect(replyResult).toBeTruthy();
    expect((replyResult as { content: string }).content).toContain('attach');
  });
});
