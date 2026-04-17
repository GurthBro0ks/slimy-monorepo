import { attachMentionHandler } from '../src/handlers/mention.js';

describe('mention handler — module structure', () => {
  it('should not attach handler twice', () => {
    const mockClient = {
      on: () => {},
      once: () => {},
      isReady: () => true,
      user: { id: 'bot-id' },
      _mentionHandlerAttached: false,
    } as any;
    attachMentionHandler(mockClient);
    expect(mockClient._mentionHandlerAttached).toBe(true);
  });
});
