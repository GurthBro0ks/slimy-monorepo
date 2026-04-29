/**
 * Bot persona management — loads persona from JSON config file.
 * Ported from /opt/slimy/app/lib/persona.js
 */

import fs from "fs";
import path from "path";

const PERSONA_PATH = path.join(__dirname, "..", "..", "config", "slimy_ai.persona.json");
let cache: Record<string, unknown> | null = null;
let lastMTime = 0;
let warnedMissingPersona = false;

const DEFAULT_PERSONALITY_PROMPT = `You are Slimy.ai, a casual and technically useful Discord assistant.

Personality mode:
- Be conversational, warm, and direct.
- Use light humor and natural phrasing when it helps.
- Match the user's energy without becoming noisy.
- Give practical answers with clear next steps.
- You can be a little playful, but stay useful first.`;

const DEFAULT_NO_PERSONALITY_PROMPT = `You are Slimy.ai in no-personality mode.

No-personality mode:
- Be concise, neutral, and factual.
- Do not use playful banter, catchphrases, or performative tone.
- Avoid unnecessary personality commentary.
- Answer the user's question directly.
- Use structured technical language when helpful.`;

function loadPersona(): Record<string, unknown> {
  try {
    const stat = fs.statSync(PERSONA_PATH);
    if (!cache || stat.mtimeMs !== lastMTime) {
      const raw = fs.readFileSync(PERSONA_PATH, "utf8");
      cache = JSON.parse(raw);
      lastMTime = stat.mtimeMs;
    }
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === "ENOENT") {
      if (!warnedMissingPersona) {
        console.warn("[persona] Missing persona file; using default persona");
        warnedMissingPersona = true;
      }
    } else {
      console.error("[persona] Failed to load persona file:", err);
    }
    cache = null;
  }
  return (
    cache || {
      name: "slimy.ai",
      tagline: "slimy.ai default persona",
      prompt: DEFAULT_PERSONALITY_PROMPT,
      modes: {},
      tone_and_voice: {},
      catchphrases: [],
    }
  );
}

function getPersona(mode: string): { name: string; prompt: string; tagline?: string } {
  const base = loadPersona() as {
    name: string;
    tagline?: string;
    prompt?: string;
    modes?: Record<string, unknown>;
    tone_and_voice?: Record<string, unknown>;
    catchphrases?: string[];
  };

  if (mode === "no_personality") {
    return {
      name: "slimy.ai (no personality)",
      prompt: DEFAULT_NO_PERSONALITY_PROMPT,
    };
  }

  if (mode === "personality") {
    return {
      name: base.name || "slimy.ai",
      prompt: base.prompt || DEFAULT_PERSONALITY_PROMPT,
      tagline: base.tagline,
    };
  }

  return {
    name: base.name || "slimy.ai",
    prompt: base.prompt || DEFAULT_PERSONALITY_PROMPT,
    tagline: base.tagline,
  };
}

export { getPersona, PERSONA_PATH };
