import { canonicalize, stripDiscordEmoji, stripSquareTags, stripColonedEmoji } from '../../src/lib/club-store';

describe('club-store — canonicalize', () => {
  it('should lowercase and trim', () => {
    expect(canonicalize('  Hello World  ')).toBe('hello world');
  });

  it('should strip discord custom emoji', () => {
    expect(canonicalize('User<:emoji:12345>Name')).toContain('user');
    expect(canonicalize('User<:emoji:12345>Name')).toContain('name');
    expect(canonicalize('User<:emoji:12345>Name')).not.toContain('emoji');
  });

  it('should strip animated emoji', () => {
    const result = canonicalize('User<a:party:999>Name');
    expect(result).not.toContain('party');
  });

  it('should strip square bracket tags', () => {
    expect(canonicalize('User[CLAN]Name')).not.toContain('[CLAN]');
  });

  it('should strip colon emoji', () => {
    expect(canonicalize('User:fire:Name')).not.toContain(':fire:');
  });

  it('should normalize unicode', () => {
    const result = canonicalize('café');
    expect(result).toBe('cafe');
  });

  it('should return empty for falsy input', () => {
    expect(canonicalize('')).toBe('');
    expect(canonicalize(null as unknown as string)).toBe('');
    expect(canonicalize(undefined as unknown as string)).toBe('');
  });

  it('should handle emoji characters', () => {
    const result = canonicalize('User🔥Name');
    expect(result).toContain('user');
    expect(result).toContain('name');
  });

  it('should collapse whitespace', () => {
    expect(canonicalize('a   b')).toBe('a b');
  });
});

describe('club-store — stripDiscordEmoji', () => {
  it('should strip static emoji', () => {
    expect(stripDiscordEmoji('<:smile:123>')).toBe(' ');
  });

  it('should strip animated emoji', () => {
    expect(stripDiscordEmoji('<a:dance:456>')).toBe(' ');
  });

  it('should leave regular text', () => {
    expect(stripDiscordEmoji('hello')).toBe('hello');
  });
});

describe('club-store — stripSquareTags', () => {
  it('should strip bracketed content', () => {
    expect(stripSquareTags('[ADMIN] User')).toBe('  User');
  });

  it('should handle multiple tags', () => {
    expect(stripSquareTags('[A][B] Name')).toBe('   Name');
  });
});

describe('club-store — stripColonedEmoji', () => {
  it('should strip :emoji: patterns', () => {
    const result = stripColonedEmoji(':fire: :heart:');
    expect(result).not.toContain(':fire:');
    expect(result).not.toContain(':heart:');
  });

  it('should leave non-emoji colons', () => {
    expect(stripColonedEmoji('time: 10:00')).toBe('time: 10:00');
  });
});
