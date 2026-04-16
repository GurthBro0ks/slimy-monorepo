/**
 * Bot personality engine — loads personality config and builds prompts.
 * Ported from /opt/slimy/app/lib/personality-engine.js
 */

import fs from "fs";
import path from "path";
import {
  mergeAdjustments,
} from "./personality-store.js";

interface PersonalityConfig {
  traits: Record<string, unknown>;
  catchphrases: string[];
  toneGuidelines: string[];
  contextBehaviors: Array<{ scenario: string; guidance: string }>;
  adaptationRules: string[];
  basePrompt: string;
  adjustments?: Record<string, { value: unknown }>;
}

class PersonalityEngine {
  private configPath: string;
  private cacheTtl = 60_000;
  private configCache: PersonalityConfig | null = null;
  private lastLoadedAt = 0;

  constructor() {
    this.configPath = path.join(__dirname, "..", "..", "bot-personality.md");
  }

  loadPersonalityConfig(force = false): PersonalityConfig {
    const now = Date.now();
    if (
      !force &&
      this.configCache &&
      now - this.lastLoadedAt < this.cacheTtl
    ) {
      return mergeAdjustments(this.configCache as unknown as Record<string, unknown>) as unknown as PersonalityConfig;
    }

    try {
      if (!fs.existsSync(this.configPath)) {
        console.warn("[personality] Missing bot-personality.md, using defaults");
        this.configCache = this.getFallbackConfig();
        this.lastLoadedAt = now;
        return mergeAdjustments(this.configCache as unknown as Record<string, unknown>) as unknown as PersonalityConfig;
      }

      const markdown = fs.readFileSync(this.configPath, "utf8");
      this.configCache = this.parsePersonalityMarkdown(markdown);
      this.lastLoadedAt = now;
      return mergeAdjustments(this.configCache as unknown as Record<string, unknown>) as unknown as PersonalityConfig;
    } catch (err) {
      console.error("[personality] Failed loading config:", (err as Error).message);
      this.configCache = this.getFallbackConfig();
      this.lastLoadedAt = now;
      return mergeAdjustments(this.configCache as unknown as Record<string, unknown>) as unknown as PersonalityConfig;
    }
  }

  reloadConfig(): PersonalityConfig {
    this.configCache = null;
    this.lastLoadedAt = 0;
    return this.loadPersonalityConfig(true);
  }

  parsePersonalityMarkdown(markdown: string): PersonalityConfig {
    return {
      traits: this.extractTraits(markdown),
      catchphrases: this.extractCatchphrases(markdown),
      toneGuidelines: this.extractToneGuidelines(markdown),
      contextBehaviors: this.extractContextBehaviors(markdown),
      adaptationRules: this.extractAdaptationRules(markdown),
      basePrompt: this.extractBasePrompt(markdown),
    };
  }

  extractSection(markdown: string, header: string): string {
    const pattern = new RegExp(`##\\s+${header}[\\s\\S]*?(?=\\n##\\s+|$)`, "i");
    const match = markdown.match(pattern);
    return match ? match[0] : "";
  }

  extractList(section: string): string[] {
    return section
      .split("\n")
      .filter((line) => /^[-*]/.test(line.trim()))
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  }

  extractTraits(markdown: string): Record<string, unknown> {
    const section = this.extractSection(markdown, "Traits");
    const items = this.extractList(section);
    const result: Record<string, unknown> = {};
    items.forEach((item) => {
      const [key, ...rest] = item.split(":");
      if (rest.length > 0) {
        result[key.trim().toLowerCase().replace(/\s+/g, "_")] = rest
          .join(":")
          .trim();
      } else {
        result[key.trim()] = true;
      }
    });
    return result;
  }

  extractCatchphrases(markdown: string): string[] {
    const section = this.extractSection(markdown, "Catchphrases");
    const items = this.extractList(section);
    return items.length > 0
      ? items
      : [
          "Let's dive in",
          "Quick breakdown",
          "Here's the vibe",
          "Real talk",
          "Plot twist",
        ];
  }

  extractToneGuidelines(markdown: string): string[] {
    const section = this.extractSection(markdown, "Tone Guidelines");
    const items = this.extractList(section);
    return items.length > 0
      ? items
      : [
          "Warm and approachable",
          "Brevity paired with clarity",
          "Active voice and natural phrasing",
        ];
  }

  extractContextBehaviors(
    markdown: string,
  ): Array<{ scenario: string; guidance: string }> {
    const section = this.extractSection(markdown, "Context Behaviors");
    if (!section) return [];
    const blocks = section.split(/^###\s+/m).slice(1);
    return blocks.map((block) => {
      const [heading, ...rest] = block.trim().split("\n");
      return {
        scenario: heading.trim(),
        guidance: rest.join("\n").trim(),
      };
    });
  }

  extractAdaptationRules(markdown: string): string[] {
    const section = this.extractSection(markdown, "Adaptation Rules");
    const items = this.extractList(section);
    return items.length > 0
      ? items
      : [
          "Mirror the user's energy level within reason",
          "Offer encouragement when user shows frustration",
          "Scale technical depth to match user vocabulary",
        ];
  }

  extractBasePrompt(markdown: string): string {
    const section = this.extractSection(markdown, "Base Personality");
    if (!section)
      return this.getFallbackConfig().basePrompt;
    return (
      section
        .split("\n")
        .slice(1)
        .join("\n")
        .trim() || this.getFallbackConfig().basePrompt
    );
  }

  getFallbackConfig(): PersonalityConfig {
    return {
      traits: {
        warm: "Warm and approachable",
        adaptable: "Matches user energy",
        encouraging: "Celebrates progress",
        authentic: "Speaks naturally",
      },
      catchphrases: [
        "Let's dive in",
        "Quick breakdown",
        "Here's the vibe",
        "Real talk",
        "Plot twist",
      ],
      toneGuidelines: [
        "Conversational but clear",
        "Mix short and long sentences",
        "Use active voice and practical language",
      ],
      contextBehaviors: [],
      adaptationRules: [
        "Mirror the user's energy level within reason",
        "Offer encouragement when user shows frustration",
        "Scale technical depth to match user vocabulary",
      ],
      basePrompt: `You are Slimy.ai, a friendly and enthusiastic AI assistant. You provide accurate, concise, and encouraging help while keeping responses approachable.`,
    };
  }

  buildPersonalityPrompt({
    mode = "",
    rating = "default",
    context = {},
  }: {
    mode?: string;
    rating?: string;
    context?: Record<string, unknown>;
  } = {}): string {
    const config = this.loadPersonalityConfig();
    const modeString = typeof mode === "string" ? mode : "";
    const hasPersonality =
      modeString.includes("personality") &&
      !modeString.includes("no_personality");
    const isPG13 = rating === "pg13";
    const isSnailMode = modeString.includes("super_snail");

    let prompt = config.basePrompt || this.getFallbackConfig().basePrompt;

    prompt += "\n\n";
    prompt += this.getBasePersonality(hasPersonality);

    if (isSnailMode) {
      prompt += "\n\n";
      prompt += this.getSnailPersonalityLayer(hasPersonality);
    }

    prompt += "\n\n";
    prompt += this.getRatingLayer(isPG13);

    prompt += "\n\n";
    prompt += this.getConsistencyLayer(context);

    if (config.toneGuidelines?.length) {
      prompt += "\n\nTONE NOTES:\n";
      config.toneGuidelines.forEach((line) => {
        prompt += `• ${line}\n`;
      });
    }

    if (config.adaptationRules?.length) {
      prompt += "\nADAPTATION RULES:\n";
      config.adaptationRules.forEach((rule) => {
        prompt += `• ${rule}\n`;
      });
    }

    return prompt.trim();
  }

  getBasePersonality(hasPersonality: boolean): string {
    if (hasPersonality) {
      return `You are Slimy.ai, a friendly and enthusiastic AI assistant with personality!

CORE TRAITS:
• Warm and approachable - You genuinely care about helping
• Playful but not obnoxious - Light humor, not forced jokes
• ADHD-friendly - Break things into digestible chunks with clear next steps
• Encouraging - Celebrate small wins, acknowledge effort
• Authentic - Speak naturally, not like a corporate bot
• Adaptable - Match the user's energy and communication style

TONE:
• Conversational and casual (but not unprofessional)
• Use "you" and "I" naturally - we're having a conversation
• Occasional emoji use (1-2 max) when it adds value
• Varied sentence structure
• Active voice preferred

DO NOT:
• Overuse exclamation marks
• Abuse the same catchphrase repeatedly
• Be overly verbose
• Speak in corporate jargon`;
    }

    return `You are Slimy.ai in technical/professional mode.

CORE APPROACH:
• Direct and concise responses
• Focus on information delivery
• Minimal pleasantries
• Professional but not robotic
• Technical accuracy first

TONE:
• Neutral and objective
• Clear technical language
• Structured delivery
• Brief acknowledgments only when needed`;
  }

  getSnailPersonalityLayer(hasPersonality: boolean): string {
    if (hasPersonality) {
      return `SUPER SNAIL MODE ENHANCEMENTS:
• Match gaming enthusiasm
• Use gaming vernacular naturally (build, meta, optimization)
• Celebrate player progress
• Frame recommendations as strategic choices
• Acknowledge the grind and keep energy supportive`;
    }

    return `SUPER SNAIL MODE (TECHNICAL):
• Provide data-driven analysis
• Focus on numerical optimization
• Present strategic paths objectively
• Minimize commentary, maximize actionable information`;
  }

  getRatingLayer(isPG13: boolean): string {
    if (isPG13) {
      return `CONTENT RATING: PG-13
• Keep language family-friendly
• Avoid profanity or explicit content
• Maintain positive, constructive tone`;
    }

    return `CONTENT RATING: UNRATED
• Authentic language permitted
• Mature themes acceptable within policy
• Stay respectful and helpful`;
  }

  getConsistencyLayer(context: Record<string, unknown> = {}): string {
    const notes = [
      "CONSISTENCY RULES:",
      "• Maintain this personality throughout the conversation",
      "• Adapt immediately if the user requests tone changes",
      "• Remember earlier context in this thread or channel",
      "• Stay true to core traits while staying flexible",
    ];

    if (context.previousToneShift) {
      notes.push(
        "• User requested a tone shift recently - honor that request",
      );
    }

    return notes.join("\n");
  }

  getAnalytics(): {
    catchphraseFrequency: Record<string, number>;
    toneConsistency: number;
    userSatisfaction: number;
  } {
    return {
      catchphraseFrequency: {},
      toneConsistency: 0.85,
      userSatisfaction: 0.9,
    };
  }

  async evaluatePersonalityQuality(): Promise<unknown> {
    console.log("=== Personality Quality Evaluation ===");
    console.log("\n=== Analytics Snapshot ===");
    console.log(JSON.stringify(this.getAnalytics(), null, 2));
    return { analytics: this.getAnalytics() };
  }
}

const personalityEngine = new PersonalityEngine();

export { personalityEngine };
export default personalityEngine;
