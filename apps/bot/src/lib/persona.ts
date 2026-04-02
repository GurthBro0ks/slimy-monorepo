/**
 * Bot persona management — loads persona from JSON config file.
 * Ported from /opt/slimy/app/lib/persona.js
 */

import fs from "fs";
import path from "path";

const PERSONA_PATH = path.join(__dirname, "..", "..", "config", "slimy_ai.persona.json");
let cache: Record<string, unknown> | null = null;
let lastMTime = 0;

function loadPersona(): Record<string, unknown> {
  try {
    const stat = fs.statSync(PERSONA_PATH);
    if (!cache || stat.mtimeMs !== lastMTime) {
      const raw = fs.readFileSync(PERSONA_PATH, "utf8");
      cache = JSON.parse(raw);
      lastMTime = stat.mtimeMs;
    }
  } catch (err) {
    console.error("[persona] Failed to load persona file:", err);
    cache = null;
  }
  return (
    cache || {
      name: "slimy.ai",
      tagline: "slimy.ai default persona",
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

  if (mode === "no_personality" && base.prompt) {
    return {
      name: "slimy.ai (no personality)",
      prompt: base.prompt
        .replace(
          "Playful banter with meme-flavored sass",
          "Professional and concise",
        )
        .replace(
          "**Personality & Tone**:",
          "**Tone**: Neutral and direct. Minimal personality.",
        )
        .replace(/\*\*Catchphrases\*\*[^\n]+\n/, ""),
    };
  }

  return {
    name: base.name || "slimy.ai",
    prompt: base.prompt || "You are a helpful AI assistant.",
    tagline: base.tagline,
  };
}

export { getPersona, PERSONA_PATH };
