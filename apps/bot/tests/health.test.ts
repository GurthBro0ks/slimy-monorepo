import { isHealthCommand } from '../src/commands/health.js';

function mockMessage(content: string) {
  return { content } as any;
}

describe('health command — isHealthCommand', () => {
  it('should match !bothealth', () => {
    expect(isHealthCommand(mockMessage('!bothealth'))).toBe(true);
  });

  it('should match !health', () => {
    expect(isHealthCommand(mockMessage('!health'))).toBe(true);
  });

  it('should be case insensitive', () => {
    expect(isHealthCommand(mockMessage('!BOTHEALTH'))).toBe(true);
    expect(isHealthCommand(mockMessage('  !health  '))).toBe(true);
  });

  it('should not match other commands', () => {
    expect(isHealthCommand(mockMessage('!diag'))).toBe(false);
    expect(isHealthCommand(mockMessage('hello'))).toBe(false);
  });
});
