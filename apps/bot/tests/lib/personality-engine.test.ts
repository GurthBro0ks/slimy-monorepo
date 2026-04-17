import personalityEngine from '../../src/lib/personality-engine';

describe('personalityEngine', () => {
  describe('parsePersonalityMarkdown', () => {
    it('should extract traits from markdown', () => {
      const md = `## Traits
- warm: Friendly approach
- adaptable: Flexible style
`;
      const config = personalityEngine.parsePersonalityMarkdown(md);
      expect(config.traits).toHaveProperty('warm');
      expect(config.traits).toHaveProperty('adaptable');
    });

    it('should extract catchphrases from markdown', () => {
      const md = `## Catchphrases
- Let's go
- Quick take
- Real talk
`;
      const config = personalityEngine.parsePersonalityMarkdown(md);
      expect(config.catchphrases).toContain("Let's go");
      expect(config.catchphrases).toContain('Real talk');
    });

    it('should extract tone guidelines from markdown', () => {
      const md = `## Tone Guidelines
- Be concise
- Use active voice
`;
      const config = personalityEngine.parsePersonalityMarkdown(md);
      expect(config.toneGuidelines).toContain('Be concise');
    });

    it('should extract context behaviors from markdown', () => {
      const md = `## Context Behaviors
### Mentoring
Guide the user step by step.
### Debugging
Focus on root causes.
`;
      const config = personalityEngine.parsePersonalityMarkdown(md);
      expect(config.contextBehaviors).toHaveLength(2);
      expect(config.contextBehaviors[0].scenario).toBe('Mentoring');
      expect(config.contextBehaviors[1].scenario).toBe('Debugging');
    });

    it('should extract adaptation rules from markdown', () => {
      const md = `## Adaptation Rules
- Mirror user energy
- Scale technical depth
`;
      const config = personalityEngine.parsePersonalityMarkdown(md);
      expect(config.adaptationRules).toContain('Mirror user energy');
    });

    it('should extract base prompt from markdown', () => {
      const md = `## Base Personality
You are a helpful AI assistant focused on gaming.
`;
      const config = personalityEngine.parsePersonalityMarkdown(md);
      expect(config.basePrompt).toContain('helpful AI assistant');
    });
  });

  describe('getFallbackConfig', () => {
    it('should return valid defaults', () => {
      const config = personalityEngine.getFallbackConfig();
      expect(config.traits).toBeDefined();
      expect(config.catchphrases.length).toBeGreaterThan(0);
      expect(config.toneGuidelines.length).toBeGreaterThan(0);
      expect(config.adaptationRules.length).toBeGreaterThan(0);
      expect(config.basePrompt).toBeTruthy();
    });
  });

  describe('buildPersonalityPrompt', () => {
    it('should build a prompt without personality mode', () => {
      const prompt = personalityEngine.buildPersonalityPrompt({ mode: '' });
      expect(prompt).toContain('Slimy.ai');
      expect(prompt.length).toBeGreaterThan(50);
    });

    it('should build a prompt with personality mode', () => {
      const prompt = personalityEngine.buildPersonalityPrompt({ mode: 'personality' });
      expect(prompt.toLowerCase()).toContain('personality');
    });

    it('should build a prompt with no_personality mode', () => {
      const prompt = personalityEngine.buildPersonalityPrompt({ mode: 'no_personality' });
      expect(prompt).toContain('professional');
    });

    it('should build a prompt with super_snail mode', () => {
      const prompt = personalityEngine.buildPersonalityPrompt({ mode: 'super_snail' });
      expect(prompt.toUpperCase()).toContain('SNAIL');
    });

    it('should apply PG-13 rating layer', () => {
      const prompt = personalityEngine.buildPersonalityPrompt({ rating: 'pg13' });
      expect(prompt).toContain('PG-13');
    });

    it('should apply default rating layer', () => {
      const prompt = personalityEngine.buildPersonalityPrompt({ rating: 'default' });
      expect(prompt).toContain('UNRATED');
    });

    it('should include consistency rules', () => {
      const prompt = personalityEngine.buildPersonalityPrompt({});
      expect(prompt).toContain('CONSISTENCY');
    });

    it('should include context previousToneShift note', () => {
      const prompt = personalityEngine.buildPersonalityPrompt({
        context: { previousToneShift: true },
      });
      expect(prompt).toContain('tone shift');
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics object', () => {
      const analytics = personalityEngine.getAnalytics();
      expect(analytics.catchphraseFrequency).toBeDefined();
      expect(typeof analytics.toneConsistency).toBe('number');
      expect(typeof analytics.userSatisfaction).toBe('number');
    });
  });

  describe('reloadConfig', () => {
    it('should force reload and return config', () => {
      const config = personalityEngine.reloadConfig();
      expect(config).toBeDefined();
      expect(config.basePrompt).toBeTruthy();
    });
  });
});
