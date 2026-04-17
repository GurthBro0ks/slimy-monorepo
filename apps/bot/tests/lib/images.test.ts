import { describe, it, expect } from 'vitest';

function isGLMImageModel(model?: string): boolean {
  return (model || '').toLowerCase().includes('glm-image');
}

describe('images — isGLMImageModel', () => {
  it('should detect glm-image model', () => {
    expect(isGLMImageModel('glm-image')).toBe(true);
    expect(isGLMImageModel('GLM-IMAGE-v2')).toBe(true);
    expect(isGLMImageModel('glm-image-4')).toBe(true);
  });

  it('should not match non-glm models', () => {
    expect(isGLMImageModel('dall-e-3')).toBe(false);
    expect(isGLMImageModel('gpt-4o')).toBe(false);
    expect(isGLMImageModel('')).toBe(false);
    expect(isGLMImageModel(undefined)).toBe(false);
  });
});

