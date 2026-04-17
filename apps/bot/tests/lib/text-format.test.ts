import { trimForDiscord, formatChatDisplay } from '../../src/lib/text-format';

describe('trimForDiscord', () => {
  it('should return empty string for falsy input', () => {
    expect(trimForDiscord('', 100)).toBe('');
  });

  it('should return text unchanged if under limit', () => {
    expect(trimForDiscord('hello', 100)).toBe('hello');
  });

  it('should trim text exactly at limit', () => {
    expect(trimForDiscord('hello', 5)).toBe('hello');
  });

  it('should trim text over limit with ellipsis', () => {
    const result = trimForDiscord('hello world', 6);
    expect(result).toBe('hello…');
    expect(result.length).toBe(6);
  });

  it('should handle limit of 1', () => {
    expect(trimForDiscord('hello', 1)).toBe('…');
  });
});

describe('formatChatDisplay', () => {
  it('should format a basic chat exchange', () => {
    const result = formatChatDisplay({
      userLabel: 'Alice',
      userMsg: 'Hi there',
      persona: 'slimy.ai',
      response: 'Hello!',
    });

    expect(result).toContain('**Alice:** Hi there');
    expect(result).toContain('**slimy.ai:** Hello!');
  });

  it('should use defaults when no args provided', () => {
    const result = formatChatDisplay({});

    expect(result).toContain('**You:** (no input)');
    expect(result).toContain('**slimy.ai:** (no content)');
  });

  it('should trim long user messages', () => {
    const longMsg = 'a'.repeat(500);
    const result = formatChatDisplay({ userMsg: longMsg });

    expect(result).toContain('**You:**');
    const userPart = result.split('\n\n')[0];
    expect(userPart.length).toBeLessThanOrEqual(420);
  });

  it('should trim long responses to fit Discord limit', () => {
    const longResponse = 'b'.repeat(3000);
    const result = formatChatDisplay({ response: longResponse });

    expect(result.length).toBeLessThanOrEqual(2002);
  });

  it('should use custom persona name', () => {
    const result = formatChatDisplay({ persona: 'CustomBot' });
    expect(result).toContain('**CustomBot:**');
  });
});
