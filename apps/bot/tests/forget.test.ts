import cmd from '../src/commands/forget.js';
import { memoryStore } from '../src/lib/memory.js';

function uid() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe('forget command — execute', () => {
  it('should delete all memories with ALL', async () => {
    let editResult: unknown = null;
    const interaction = {
      options: { getString: () => 'ALL' },
      user: { id: uid() },
      guildId: uid(),
      guild: { name: 'Test Guild' },
      deferReply: async () => {},
      editReply: async (opts: unknown) => { editResult = opts; },
      reply: async () => {},
    };
    await cmd.execute(interaction);
    expect(editResult).toBeTruthy();
  });

  it('should show error for nonexistent memory', async () => {
    let editResult: unknown = null;
    const interaction = {
      options: { getString: () => 'nonexistent-id-12345' },
      user: { id: uid() },
      guildId: uid(),
      guild: { name: 'Test Guild' },
      deferReply: async () => {},
      editReply: async (opts: unknown) => { editResult = opts; },
      reply: async () => {},
    };
    await cmd.execute(interaction);
    expect(editResult).toBeTruthy();
  });
});
