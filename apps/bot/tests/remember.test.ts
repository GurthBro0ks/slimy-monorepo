import cmd from '../src/commands/remember.js';
import { memoryStore } from '../src/lib/memory.js';

function uid() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe('remember command — execute', () => {
  it('should require consent before saving', async () => {
    const userId = uid(), guildId = uid();
    let replyResult: unknown = null;
    const interaction = {
      options: { getString: (name: string) => name === 'note' ? 'test note' : null },
      user: { id: userId },
      guildId,
      guild: { name: 'Test Guild' },
      channelId: uid(),
      channel: { name: 'test' },
      deferReply: async () => {},
      editReply: async () => {},
      reply: async (opts: unknown) => { replyResult = opts; },
    };
    await cmd.execute(interaction);
    expect(replyResult).toBeTruthy();
    const content = (replyResult as { content: string }).content;
    expect(content).toContain('consent');
  });

  it('should save a memory when consent is given', async () => {
    const userId = uid(), guildId = uid();
    await memoryStore.setConsent({ userId, guildId, allowed: true });
    let editResult: unknown = null;
    const interaction = {
      options: { getString: (name: string) => name === 'note' ? 'test memory save' : null },
      user: { id: userId },
      guildId,
      guild: { name: 'Test Guild' },
      channelId: uid(),
      channel: { name: 'test' },
      deferReply: async () => {},
      editReply: async (opts: unknown) => { editResult = opts; },
      reply: async () => {},
    };
    await cmd.execute(interaction);
    expect(editResult).toBeTruthy();
  });
});
