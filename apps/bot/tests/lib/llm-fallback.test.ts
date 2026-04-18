import { hasConfiguredProvider, callWithFallback } from '../../src/lib/llm-fallback';

function extractSystem(messages: Array<{ role: string; content: unknown }>): { system: string | undefined; messages: Array<{ role: string; content: unknown }> } {
  const systemParts: string[] = [];
  const rest: Array<{ role: string; content: unknown }> = [];
  for (const message of messages) {
    if (message.role === 'system' && typeof message.content === 'string') {
      systemParts.push(message.content);
    } else {
      rest.push(message);
    }
  }
  return { system: systemParts.join('\n').trim() || undefined, messages: rest };
}

describe('llm-fallback — extractSystem (local mirror)', () => {
  it('should extract system messages', () => {
    const messages = [
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hello' },
    ];
    const result = extractSystem(messages);
    expect(result.system).toBe('You are helpful.');
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe('user');
  });

  it('should merge multiple system messages', () => {
    const messages = [
      { role: 'system', content: 'Part 1.' },
      { role: 'system', content: 'Part 2.' },
      { role: 'user', content: 'Hi' },
    ];
    const result = extractSystem(messages);
    expect(result.system).toBe('Part 1.\nPart 2.');
    expect(result.messages).toHaveLength(1);
  });

  it('should return undefined system when no system messages', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
    ];
    const result = extractSystem(messages);
    expect(result.system).toBeUndefined();
    expect(result.messages).toHaveLength(1);
  });

  it('should handle non-string system content', () => {
    const messages = [
      { role: 'system', content: 123 },
      { role: 'user', content: 'Hello' },
    ];
    const result = extractSystem(messages);
    expect(result.system).toBeUndefined();
    expect(result.messages).toHaveLength(2);
  });
});

describe('llm-fallback — hasConfiguredProvider', () => {
  it('should return boolean', () => {
    expect(typeof hasConfiguredProvider()).toBe('boolean');
  });
});

describe('llm-fallback — callWithFallback', () => {
  it('should throw when no providers configured', async () => {
    const originalOpenai = process.env.OPENAI_API_KEY;
    const originalGemini = process.env.GEMINI_API_KEY;
    const originalAnthropic = process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    try {
      await expect(callWithFallback({
        messages: [{ role: 'user', content: 'test' }],
      })).rejects.toThrow('No LLM providers configured');
    } finally {
      process.env.OPENAI_API_KEY = originalOpenai;
      process.env.GEMINI_API_KEY = originalGemini;
      process.env.ANTHROPIC_API_KEY = originalAnthropic;
    }
  });
});
