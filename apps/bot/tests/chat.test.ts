import cmd from '../src/commands/chat.js';
import { runConversation, getEffectiveModesForChannel } from '../src/commands/chat.js';

describe('chat command — module structure', () => {
  it('should export data with name', () => {
    expect(cmd.data.name).toBe('chat');
  });

  it('should export execute function', () => {
    expect(typeof cmd.execute).toBe('function');
  });

  it('should export runConversation', () => {
    expect(typeof runConversation).toBe('function');
  });

  it('should export getEffectiveModesForChannel', () => {
    expect(typeof getEffectiveModesForChannel).toBe('function');
  });
});
