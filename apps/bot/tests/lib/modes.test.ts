import { emptyState, MODE_KEYS, PRIMARY_MODES, OPTIONAL_MODES, RATING_MODES } from '../../src/lib/modes';

describe('modes constants', () => {
  it('MODE_KEYS should include standard modes', () => {
    expect(MODE_KEYS).toContain('admin');
    expect(MODE_KEYS).toContain('chat');
    expect(MODE_KEYS).toContain('super_snail');
    expect(MODE_KEYS).toContain('personality');
    expect(MODE_KEYS).toContain('no_personality');
  });

  it('PRIMARY_MODES should be a subset of MODE_KEYS', () => {
    for (const mode of PRIMARY_MODES) {
      expect(MODE_KEYS).toContain(mode);
    }
  });

  it('OPTIONAL_MODES should be a subset of MODE_KEYS', () => {
    for (const mode of OPTIONAL_MODES) {
      expect(MODE_KEYS).toContain(mode);
    }
  });

  it('RATING_MODES should be a subset of MODE_KEYS', () => {
    for (const mode of RATING_MODES) {
      expect(MODE_KEYS).toContain(mode);
    }
  });
});

describe('emptyState', () => {
  it('should return all modes as false', () => {
    const state = emptyState();
    for (const key of MODE_KEYS) {
      expect(state[key]).toBe(false);
    }
  });

  it('should have a key for every MODE_KEY', () => {
    const state = emptyState();
    expect(Object.keys(state).sort()).toEqual([...MODE_KEYS].sort());
  });
});
