import { detectImageIntent } from '../../src/lib/image-intent';

describe('detectImageIntent', () => {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);

  it('should detect "draw" intent', () => {
    if (!hasKey) return;
    expect(detectImageIntent('draw a mountain')).toBe(true);
  });

  it('should detect "illustrate" intent', () => {
    if (!hasKey) return;
    expect(detectImageIntent('please illustrate the concept')).toBe(true);
  });

  it('should detect "generate" + "image" intent', () => {
    if (!hasKey) return;
    expect(detectImageIntent('generate an image of a dog')).toBe(true);
  });

  it('should not trigger on plain text without image intent', () => {
    expect(detectImageIntent('what is the weather today')).toBe(false);
  });

  it('should not trigger on empty string', () => {
    expect(detectImageIntent('')).toBe(false);
  });

  it('should not trigger on unrelated "make" usage', () => {
    expect(detectImageIntent('make sure to check the logs')).toBe(false);
  });

  it('should return false when no API key is configured', () => {
    const savedKey = process.env.OPENAI_API_KEY;
    const savedAiKey = process.env.AI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_API_KEY;
    expect(detectImageIntent('create an image')).toBe(false);
    if (savedKey) process.env.OPENAI_API_KEY = savedKey;
    if (savedAiKey) process.env.AI_API_KEY = savedAiKey;
  });

  it('should detect "photo of" pattern', () => {
    if (!hasKey) return;
    expect(detectImageIntent('show me a photo of the ocean')).toBe(true);
  });

  it('should not detect image intent from non-image "show" usage', () => {
    expect(detectImageIntent('show me the results')).toBe(false);
  });
});
