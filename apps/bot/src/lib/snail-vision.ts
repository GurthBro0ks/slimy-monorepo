/**
 * Snail screenshot vision analysis.
 * Ported from /opt/slimy/app/lib/snail-vision.js
 * Stub implementation — actual AI vision requires Chunk 5 port of vision.ts + openai.ts wiring.
 */

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

async function performAnalysis(_base64Image: string, prompt: string): Promise<Record<string, unknown>> {
  // Stub: requires actual vision API (Chunk 5)
  console.warn("[snail-vision] Vision API not yet wired — stub response");
  return {
    stats: {
      hp: null, atk: null, def: null, rush: null,
      fame: null, tech: null, art: null, civ: null, fth: null,
    },
    equipment: { weapon: null, armor: null, accessory: null },
    confidence: "low",
    notes: `Vision API not configured. Prompt was: ${prompt.slice(0, 100)}...`,
  };
}

export async function analyzeSnailScreenshot(discordAttachmentUrl: string): Promise<Record<string, unknown>> {
  console.log("[snail-vision] analyzeSnailScreenshot called for:", discordAttachmentUrl);
  const prompt = `Analyze this Super Snail screenshot and extract all visible stats.
Return ONLY the JSON object, no other text.`;

  let analysis = await performAnalysis("", prompt);

  // Normalize stats
  if (!analysis.stats) (analysis as Record<string, unknown>).stats = {};
  for (const key of STAT_KEYS) {
    (analysis.stats as Record<string, unknown>)[key] = normalizeStatValue((analysis.stats as Record<string, unknown>)[key]);
  }

  return analysis;
}

export function formatSnailAnalysis(analysis: Record<string, unknown>): string {
  const stats = (analysis.stats || {}) as Record<string, number | null>;

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

  const confidence = (analysis.confidence || "low") as string;
  const confidenceEmoji: Record<string, string> = { high: "✅", medium: "⚠️", low: "❌" };
  output += `Confidence: ${confidenceEmoji[confidence] || "❌"} ${confidence}\n`;

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
