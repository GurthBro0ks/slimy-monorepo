import { autoDetectMode, cleanupOldHistories } from '../../src/lib/chat-shared';

describe('autoDetectMode', () => {
  it('should detect mentor mode for calm keywords (highest score)', () => {
    expect(autoDetectMode('I need to calm down')).toBe('mentor');
    expect(autoDetectMode('help me reset my mind')).toBe('mentor');
    expect(autoDetectMode('let me breathe for a moment')).toBe('mentor');
  });

  it('should detect mentor mode for help keywords', () => {
    expect(autoDetectMode('can you teach me algebra')).toBe('mentor');
    expect(autoDetectMode('explain this to me')).toBe('mentor');
  });

  it('should detect partner mode when only partner keywords present', () => {
    expect(autoDetectMode('let us brainstorm ideas for a project')).toBe('partner');
    expect(autoDetectMode('I want something creative today')).toBe('partner');
  });

  it('should default to mentor for ambiguous text', () => {
    expect(autoDetectMode('hello there')).toBe('mentor');
  });

  it('should default to mentor for empty string', () => {
    expect(autoDetectMode('')).toBe('mentor');
  });

  it('should default to mentor for undefined', () => {
    expect(autoDetectMode()).toBe('mentor');
  });

  it('should handle mixed keywords by picking highest score', () => {
    expect(autoDetectMode('calm breathe brainstorm')).toBe('mentor');
  });
});

describe('cleanupOldHistories', () => {
  it('should not throw when called', () => {
    expect(() => cleanupOldHistories()).not.toThrow();
  });
});
