import { openai } from '../../src/lib/openai';

describe('openai client', () => {
  it('should export chat completions create function', () => {
    expect(typeof openai.chat.completions.create).toBe('function');
  });

  it('should export isConfigured function', () => {
    expect(typeof openai.isConfigured).toBe('function');
  });

  it('isConfigured should return boolean', () => {
    const result = openai.isConfigured();
    expect(typeof result).toBe('boolean');
  });

  it('should throw when API key not configured', async () => {
    const originalKey = process.env.AI_API_KEY;
    const originalOpenai = process.env.OPENAI_API_KEY;
    delete process.env.AI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const { openai: freshOpenai } = await import('../../src/lib/openai');
      await expect(freshOpenai.chat.completions.create({
        messages: [{ role: 'user', content: 'test' }],
      })).rejects.toThrow('not configured');
    } finally {
      process.env.AI_API_KEY = originalKey;
      process.env.OPENAI_API_KEY = originalOpenai;
    }
  });
});
