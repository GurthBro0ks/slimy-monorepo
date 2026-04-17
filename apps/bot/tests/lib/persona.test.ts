import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('persona — getPersona', () => {
  it('should return default persona when file does not exist', async () => {
    const { getPersona } = await import('../../src/lib/persona');
    const result = getPersona('default');
    expect(result.name).toBeTruthy();
    expect(result.prompt).toBeTruthy();
  });

  it('should return default prompt for unknown mode', async () => {
    const { getPersona } = await import('../../src/lib/persona');
    const result = getPersona('unknown_mode');
    expect(result.prompt).toBeTruthy();
    expect(result.name).toBeTruthy();
  });

  it('should return prompt string', async () => {
    const { getPersona } = await import('../../src/lib/persona');
    const result = getPersona('default');
    expect(typeof result.prompt).toBe('string');
    expect(result.prompt.length).toBeGreaterThan(0);
  });
});
