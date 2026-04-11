/**
 * Snail screenshot vision analysis.
 * Ported from /opt/slimy/app/lib/snail-vision.js
 */

import { openai } from "./openai.js";

const SNAIL_SYSTEM_PROMPT = `You are a Super Snail game stats analyzer. Extract data from screenshots with precision.

Output ONLY valid JSON in this exact format:
{
  "stats": {
    "hp": number or null, "atk": number or null, "def": number or null,
    "rush": number or null, "fame": number or null, "tech": number or null,
    "art": number or null, "civ": number or null, "fth": number or null
  },
  "equipment": {
    "weapon": "description or null", "armor": "description or null", "accessory": "description or null"
  },
  "confidence": "high" | "medium" | "low",
  "notes": "any issues or unclear elements"
}`;

const STAT_KEYS = ["hp", "atk", "def", "rush", "fame", "tech", "art", "civ", "fth"];

function normalizeStatValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  const cleaned = String(value).replace(/[^0-9]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? Math.round(num) : null;
}

function stripCodeFence(text: string): string {
  let cleaned = String(text || "").trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
  }
  return cleaned.trim();
}

function clampConfidence(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  if (num < 0) return 0;
  if (num > 1) return 1;
  return Math.round(num * 1000) / 1000;
}

async function performAnalysis(imageUrl: string, prompt: string): Promise<Record<string, unknown>> {
  if (!imageUrl) throw new Error("Image URL is required for vision analysis");

  const response = await openai.chat.completions.create({
    model: "glm-4.6v",
    temperature: 0,
    max_tokens: 500,
    messages: [
      { role: "system", content: SNAIL_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text" as const, text: prompt },
          { type: "image_url" as const, image_url: { url: imageUrl, detail: "high" } },
        ],
      },
    ],
  });

  const rawContent = (response as { choices?: Array<{ message?: { content?: string } }> })
    ?.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error("Vision response was empty");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripCodeFence(rawContent)) as Record<string, unknown>;
  } catch (err) {
    throw new Error(`Vision returned invalid JSON: ${(err as Error).message}`);
  }

  // Validate stats object presence
  if (!parsed.stats || typeof parsed.stats !== "object") {
    throw new Error("Vision response missing stats object");
  }

  // Validate confidence field
  const confidenceRaw = parsed.confidence;
  if (confidenceRaw !== "high" && confidenceRaw !== "medium" && confidenceRaw !== "low") {
    // Downgrade to low if missing/invalid rather than throwing, to be resilient
    (parsed as Record<string, unknown>).confidence = "low";
  }

  return parsed;
}

export async function analyzeSnailScreenshot(discordAttachmentUrl: string): Promise<Record<string, unknown>> {
  console.log("[snail-vision] analyzeSnailScreenshot called for:", discordAttachmentUrl);
  const prompt = `Analyze this Super Snail screenshot and extract all visible stats.
Return ONLY the JSON object, no other text.`;

  const analysis = await performAnalysis(discordAttachmentUrl, prompt);

  // Normalize stats
  if (!analysis.stats) (analysis as Record<string, unknown>).stats = {};
  for (const key of STAT_KEYS) {
    (analysis.stats as Record<string, unknown>)[key] = normalizeStatValue((analysis.stats as Record<string, unknown>)[key]);
  }

  // Build per-stat confidence map (all stats same confidence level for now)
  const confLevel = (analysis.confidence as string) || "low";
  const confMap: Record<string, number> = {};
  const confScore: Record<string, number> = { high: 0.9, medium: 0.6, low: 0.3 };
  for (const key of STAT_KEYS) {
    confMap[key] = confScore[confLevel] ?? 0.3;
  }
  (analysis as Record<string, unknown>).confidence = confMap;

  return analysis;
}

export function formatSnailAnalysis(analysis: Record<string, unknown>): string {
  const stats = (analysis.stats || {}) as Record<string, number | null>;
  const confMap = (analysis.confidence || {}) as Record<string, number>;

  const overallConf: string = (() => {
    const vals = Object.values(confMap);
    if (!vals.length) return "low";
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg >= 0.75) return "high";
    if (avg >= 0.45) return "medium";
    return "low";
  })();
  const confidenceEmoji: Record<string, string> = { high: "✅", medium: "⚠️", low: "❌" };
  const confidenceLabel = overallConf.charAt(0).toUpperCase() + overallConf.slice(1);

  let output = "🐌 **Super Snail Stats Extracted**\n\n";

  output += "**Primary Stats:**\n";
  output += `• HP: ${stats.hp?.toLocaleString() || "???"}\n`;
  output += `• ATK: ${stats.atk?.toLocaleString() || "???"}\n`;
  output += `• DEF: ${stats.def?.toLocaleString() || "???"}\n`;
  output += `• RUSH: ${stats.rush?.toLocaleString() || "???"}\n\n`;

  output += "**Pentagon Stats:**\n";
  output += `• FAME: ${stats.fame?.toLocaleString() || "???"}\n`;
  output += `• TECH: ${stats.tech?.toLocaleString() || "???"}\n`;
  output += `• ART: ${stats.art?.toLocaleString() || "???"}\n`;
  output += `• CIV: ${stats.civ?.toLocaleString() || "???"}\n`;
  output += `• FTH: ${stats.fth?.toLocaleString() || "???"}\n\n`;

  output += `Confidence: ${confidenceEmoji[overallConf] || "❌"} ${confidenceLabel}\n`;

  const notes = analysis.notes as string | undefined;
  if (notes) output += `\n📝 Notes: ${notes}\n`;

  const missing = Object.entries(stats)
    .filter(([, value]) => value === null)
    .map(([key]) => key.toUpperCase());

  if (missing.length > 0) {
    output += `\n❓ Missing: ${missing.join(", ")}`;
    output += `\nPlease provide these manually or upload a clearer screenshot.`;
  }

  return output;
}
