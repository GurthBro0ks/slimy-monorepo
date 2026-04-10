/**
 * Dual-Model VLM Roster OCR for Super Snail Manage Members screenshots.
 *
 * Runs Gemini 2.5 Flash AND GLM-4.6V in parallel on each screenshot,
 * diffs the results per row, and uses Gemini 2.5 Pro as tiebreaker on conflicts.
 *
 * Env vars:
 *   GEMINI_API_KEY          — Gemini API key
 *   AI_API_KEY              — Z.AI API key (for GLM-4.6V)
 *   ROSTER_OCR_GLM_MODEL    — GLM model string (default: glm-4.6v)
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const ZAI_BASE_URL =
  process.env.ROSTER_OCR_ZAI_BASE_URL ||
  process.env.AI_BASE_URL ||
  "https://api.z.ai/api/paas/v4";

const GEMINI_MODEL_PRIMARY = "gemini-2.5-flash";
const GEMINI_MODEL_TIEBREAKER = "gemini-2.5-pro";
const GLM_MODEL = process.env.ROSTER_OCR_GLM_MODEL || "glm-4.6v";

const SYSTEM_PROMPT = `Extract visible member rows from this Super Snail Manage Members screenshot.
Return ONLY a JSON array. Each row: {name, power, last_seen}.
SKIP any row where the power number is cut off or not fully visible.
power must be an integer with no commas. last_seen is a string like '5h ago' or 'Online'.
Do NOT include any text outside the JSON array.`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RosterRow {
  name: string;
  power: bigint;
  last_seen: string;
}

export interface ModelResult {
  rows: RosterRow[];
  raw: string;
  model: string;
}

export interface DiffEntry {
  row_index: number;
  name: string;
  power: bigint;
  last_seen: string;
  confidence: 'high' | 'low';
  source: 'agreed' | 'gemini' | 'glm' | 'conflict';
  geminiValue?: bigint;
  glmValue?: bigint;
}

export interface RosterOcrResult {
  imageIndex: number;
  rows: DiffEntry[];
  totalMembers: number;
  conflictCount: number;
  highConfidenceCount: number;
}

// ─── Fetch Clients ───────────────────────────────────────────────────────────

async function geminiChat(
  model: string,
  messages: Array<{ role: string; content: unknown }>,
  apiKey: string,
): Promise<{ content: string; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }> {
  const url = `${GEMINI_BASE_URL}chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0 }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Gemini API error ${response.status}: ${text}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };

  return {
    content: data.choices?.[0]?.message?.content || "",
    usage: data.usage,
  };
}

async function glmChat(
  model: string,
  messages: Array<{ role: string; content: unknown }>,
  apiKey: string,
): Promise<{ content: string; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }> {
  const url = `${ZAI_BASE_URL}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0 }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`GLM API error ${response.status}: ${text}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };

  // GLM-4.6V (chain-of-thought mode) may return response in reasoning_content
  // instead of content when the model is doing internal reasoning
  const message = data.choices?.[0]?.message;
  const content = message?.content || message?.reasoning_content || "";

  return {
    content,
    usage: data.usage,
  };
}

// ─── Image Encoding ───────────────────────────────────────────────────────────

async function attachmentToDataUrl(attachmentUrl: string): Promise<string> {
  const response = await fetch(attachmentUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = response.headers.get("content-type") || "image/png";
  return `data:${contentType};base64,${base64}`;
}

// ─── Model Invocation ──────────────────────────────────────────────────────────

function buildVisionMessage(imageDataUrl: string): { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string; detail: string } } {
  return {
    type: 'image_url' as const,
    image_url: { url: imageDataUrl, detail: 'high' as const },
  };
}

async function callGemini(
  imageDataUrl: string,
  apiKey: string,
  model: string = GEMINI_MODEL_PRIMARY,
): Promise<ModelResult> {
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: [
        { type: 'text' as const, text: 'Extract the roster data from this screenshot.' },
        buildVisionMessage(imageDataUrl),
      ],
    },
  ];

  const response = await geminiChat(model, messages, apiKey);
  const rows = parseRosterJson(response.content, model);
  return { rows, raw: response.content, model };
}

async function callGlm(
  imageDataUrl: string,
  apiKey: string,
): Promise<ModelResult> {
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: [
        { type: 'text' as const, text: 'Extract the roster data from this screenshot.' },
        buildVisionMessage(imageDataUrl),
      ],
    },
  ];

  const response = await glmChat(GLM_MODEL, messages, apiKey);
  const rows = parseRosterJson(response.content, GLM_MODEL);
  return { rows, raw: response.content, model: GLM_MODEL };
}

// ─── JSON Parsing ─────────────────────────────────────────────────────────────

function parseRosterJson(raw: string, model: string): RosterRow[] {
  let cleaned = String(raw || "").trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
  }
  cleaned = cleaned.trim();

  // Try JSON array first
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Fall back to regex-based markdown parsing
    return parseMarkdownRoster(cleaned, model);
  }

  if (!Array.isArray(parsed)) {
    // Try to find a JSON array inside the text
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        parsed = JSON.parse(arrayMatch[0]);
      } catch {
        return parseMarkdownRoster(cleaned, model);
      }
    } else {
      return parseMarkdownRoster(cleaned, model);
    }
  }

  const rows: RosterRow[] = [];
  const items = parsed as Array<{ name?: unknown; power?: unknown; last_seen?: unknown }>;
  for (const item of items) {
    const obj = item;

    const name = typeof obj.name === 'string' ? obj.name.trim() : null;
    if (!name) continue;

    let power: bigint;
    if (typeof obj.power === 'bigint') {
      power = obj.power;
    } else if (typeof obj.power === 'number') {
      power = BigInt(Math.floor(obj.power));
    } else if (typeof obj.power === 'string') {
      const cleaned2 = obj.power.replace(/[^0-9]/g, '');
      power = cleaned2 ? BigInt(cleaned2) : 0n;
    } else {
      continue;
    }

    const last_seen = typeof obj.last_seen === 'string' ? obj.last_seen.trim() : '';

    rows.push({ name, power, last_seen });
  }

  return rows;
}

/**
 * Parse markdown-formatted roster responses (e.g. from Gemini Flash
 * when it ignores the "return JSON only" instruction).
 *
 * Handles two observed formats:
 *   **Name:** Stone        (label + name)
 *   **Sim Power:** 14,321,191
 *   **Status:** Online
 *
 *   **Stone**              (bold name only, no label)
 *   - Sim Power: 14,321,191
 *   - Status: Online
 */
function parseMarkdownRoster(text: string, model: string): RosterRow[] {
  const rows: RosterRow[] = [];

  // Pattern A: **Name:** Stone or **Username:** Stone (label before name)
  const patternA = /\*\*(?:Name|Username):?\*\*\s*(.+?)\n[\s\S]*?(?:Sim\s*Power)[:\s]+([0-9,]+)[\s\S]*?(?:Status|Active|Last Active)[:\s]+(.+?)(?=\n\s*\d+\.|\n\n|$)/gi;

  // Pattern B: **Stone** (bold name only, no label — GLM numbered list style)
  const patternB = /\*\*([^*]+)\*\*[\s\S]*?(?:Sim\s*Power)[:\s]+([0-9,]+)[\s\S]*?(?:Status|Active|Last Active)[:\s]+(.+?)(?=\n\s*\d+\.|\n\n|$)/gi;

  for (const pattern of [patternA, patternB]) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      let name = match[1].trim();
      // Skip empty slots and placeholder names
      if (!name || name === '(Empty Slot)' || name === 'None' || name.toLowerCase().includes('empty')) continue;
      // Strip surrounding ** from pattern B captures
      name = name.replace(/^\*+/, '').replace(/\*+$/, '').trim();
      if (!name) continue;
      const powerStr = match[2].replace(/,/g, '');
      const power = powerStr ? BigInt(powerStr) : 0n;
      const last_seen = match[3].trim();
      rows.push({ name, power, last_seen });
    }
    if (rows.length > 0) break;
  }

  if (rows.length === 0) {
    console.warn(`[roster-ocr] ${model} returned unparseable format, skipping`, {
      snippet: text.slice(0, 300),
    });
  }

  return rows;
}

// ─── Diff Logic ───────────────────────────────────────────────────────────────

export function diffResults(geminiRows: RosterRow[], glmRows: RosterRow[]): DiffEntry[] {
  const geminiMap = new Map(geminiRows.map((r) => [r.name.toLowerCase(), r]));
  const glmMap = new Map(glmRows.map((r) => [r.name.toLowerCase(), r]));

  const allNames = new Set([...geminiMap.keys(), ...glmMap.keys()]);
  const entries: DiffEntry[] = [];

  for (const nameLower of allNames) {
    const geminiRow = geminiMap.get(nameLower);
    const glmRow = glmMap.get(nameLower);

    const displayName = geminiRow?.name || glmRow?.name || nameLower;

    if (!geminiRow && glmRow) {
      entries.push({
        row_index: entries.length,
        name: displayName,
        power: glmRow.power,
        last_seen: glmRow.last_seen,
        confidence: 'low',
        source: 'glm',
        glmValue: glmRow.power,
      });
    } else if (geminiRow && !glmRow) {
      entries.push({
        row_index: entries.length,
        name: displayName,
        power: geminiRow.power,
        last_seen: geminiRow.last_seen,
        confidence: 'low',
        source: 'gemini',
        geminiValue: geminiRow.power,
      });
    } else if (geminiRow && glmRow) {
      if (geminiRow.power === glmRow.power) {
        entries.push({
          row_index: entries.length,
          name: displayName,
          power: geminiRow.power,
          last_seen: geminiRow.last_seen || glmRow.last_seen,
          confidence: 'high',
          source: 'agreed',
          geminiValue: geminiRow.power,
          glmValue: glmRow.power,
        });
      } else {
        entries.push({
          row_index: entries.length,
          name: displayName,
          power: geminiRow.power,
          last_seen: geminiRow.last_seen || glmRow.last_seen,
          confidence: 'low',
          source: 'conflict',
          geminiValue: geminiRow.power,
          glmValue: glmRow.power,
        });
      }
    }
  }

  return entries;
}

// ─── Tiebreaker ───────────────────────────────────────────────────────────────

async function runTiebreaker(
  imageDataUrl: string,
  geminiApiKey: string,
  name: string,
): Promise<bigint> {
  const tiebreakerPrompt = `A Super Snail member row shows conflicting power values between two models.
The member name is "${name}".
Look carefully at the screenshot and return ONLY the correct integer power value.
Return ONLY a plain integer — no JSON, no explanation.`;

  const messages = [
    { role: 'system' as const, content: 'You are a precise Super Snail game data extractor. Return ONLY numbers.' },
    {
      role: 'user' as const,
      content: [
        { type: 'text' as const, text: tiebreakerPrompt },
        buildVisionMessage(imageDataUrl),
      ],
    },
  ];

  const response = await geminiChat(GEMINI_MODEL_TIEBREAKER, messages, geminiApiKey);
  const cleaned = String(response.content || "").replace(/[^0-9]/g, "");
  return cleaned ? BigInt(cleaned) : 0n;
}

// ─── Main Extract Function ────────────────────────────────────────────────────

export interface ExtractRosterOptions {
  skipLiveOcr?: boolean;
}

export async function extractRoster(
  imageAttachments: Array<{ url: string; name?: string }>,
  options: ExtractRosterOptions = {},
): Promise<RosterOcrResult[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const glmKey =
    process.env.ROSTER_OCR_GLM_API_KEY ||
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY;

  if (!geminiKey || !glmKey) {
    throw new Error("Missing API keys: GEMINI_API_KEY and AI_API_KEY are required for roster OCR");
  }

  // ─── GLM Model Validation ─────────────────────────────────────────────────
  // Verify GLM model is accessible. If Z.AI returns 401 (expired key) or
  // model_not_found, fail loudly rather than silently falling back to GPT-4o.
  const glmUrl = `${ZAI_BASE_URL}/chat/completions`;
  try {
    const validationResponse = await fetch(glmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${glmKey}`,
      },
      body: JSON.stringify({
        model: GLM_MODEL,
        messages: [{ role: "user", content: "reply with just the word: ok" }],
        max_tokens: 5,
        temperature: 0,
      }),
    });
    if (!validationResponse.ok) {
      const body = await validationResponse.json().catch(() => ({})) as {
        error?: { message?: string; code?: string | number };
      };
      const errMsg = body?.error?.message || `HTTP ${validationResponse.status}`;
      const status = validationResponse.status;
      if (status === 401 || status === 403) {
        throw new Error(
          `GLM auth failed (${status}): Z.AI API key is expired or invalid. ` +
          `Key starts with: ${glmKey.slice(0, 12)}... Please renew at z.ai. Got: ${errMsg}`,
        );
      }
      if (errMsg.includes("not_found") || errMsg.includes("model_not_found")) {
        throw new Error(
          `GLM model not found: '${GLM_MODEL}'. Check ROSTER_OCR_GLM_MODEL. Got: ${errMsg}`,
        );
      }
      throw new Error(`GLM validation failed: ${errMsg}`);
    }
  } catch (err) {
    if (err instanceof Error && (
      err.message.includes("GLM") ||
      err.message.includes("auth") ||
      err.message.includes("model_not_found") ||
      err.message.includes("not_found") ||
      err.message.includes("401") ||
      err.message.includes("403")
    )) {
      throw err;
    }
    // For other errors (network, etc.), let them propagate from the actual OCR call
  }

  if (imageAttachments.length === 0) {
    throw new Error("At least one image is required");
  }

  if (imageAttachments.length > 9) {
    throw new Error("Maximum 9 images per roster scan");
  }

  const skipLive = options.skipLiveOcr ?? process.env.SKIP_LIVE_OCR === "1";
  const results: RosterOcrResult[] = [];

  for (let i = 0; i < imageAttachments.length; i++) {
    const attachment = imageAttachments[i];
    console.info(`[roster-ocr] Processing image ${i + 1}/${imageAttachments.length}: ${attachment.name || attachment.url}`);

    let geminiResult: ModelResult;
    let glmResult: ModelResult;

    if (skipLive) {
      // Return empty result for testing
      results.push({
        imageIndex: i,
        rows: [],
        totalMembers: 0,
        conflictCount: 0,
        highConfidenceCount: 0,
      });
      continue;
    }

    // Fetch image data URL
    const imageDataUrl = await attachmentToDataUrl(attachment.url);

    // Run both models in parallel
    // GLM errors propagate — pipeline fails loudly if GLM is unavailable (no silent fallback to GPT-4o)
    const [gem, glm] = await Promise.all([
      callGemini(imageDataUrl, geminiKey).catch((err) => {
        console.error(`[roster-ocr] Gemini failed for image ${i}: ${err.message}`);
        return { rows: [], raw: '', model: GEMINI_MODEL_PRIMARY } as ModelResult;
      }),
      callGlm(imageDataUrl, glmKey),
    ]);

    geminiResult = gem;
    glmResult = glm;

    // Diff the results
    let diffed = diffResults(geminiResult.rows, glmResult.rows);

    // Resolve conflicts with tiebreaker
    const conflicts = diffed.filter((e) => e.source === 'conflict');
    for (const conflict of conflicts) {
      console.info(`[roster-ocr] Resolving conflict for "${conflict.name}" via Gemini 2.5 Pro tiebreaker`);
      const tiebreakerValue = await runTiebreaker(imageDataUrl, geminiKey, conflict.name);
      conflict.power = tiebreakerValue;
      conflict.source = 'gemini'; // tiebreaker is gemini-pro
      conflict.confidence = 'high';
    }

    // Recompute diff state after tiebreaker
    diffed = diffed.map((e) => {
      if (e.source === 'conflict') {
        return { ...e, source: 'gemini' as const, confidence: 'high' as const };
      }
      return e;
    });

    const conflictCount = diffed.filter((e) => e.source === 'conflict').length;
    const highConfidenceCount = diffed.filter((e) => e.confidence === 'high').length;

    results.push({
      imageIndex: i,
      rows: diffed,
      totalMembers: diffed.length,
      conflictCount,
      highConfidenceCount,
    });
  }

  return results;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatRosterEmbed(results: RosterOcrResult[]): string {
  if (results.length === 0) return "No results.";

  const totalMembers = results.reduce((sum, r) => sum + r.totalMembers, 0);
  const totalConflicts = results.reduce((sum, r) => sum + r.conflictCount, 0);
  const highConf = results.reduce((sum, r) => sum + r.highConfidenceCount, 0);

  let output = `**Roster OCR Results** — ${totalMembers} members across ${results.length} image(s)\n`;
  output += `Confidence: ${highConf}/${totalMembers} high | ${totalConflicts} conflicts resolved\n\n`;

  for (const result of results) {
    output += `**Image ${result.imageIndex + 1}** (${result.totalMembers} members)\n`;
    for (const row of result.rows) {
      const powerStr = row.power.toLocaleString();
      const flag = row.source === 'conflict' ? ' ⚠️ CONFLICT' :
        row.source === 'agreed' ? ' ✅' :
        row.source === 'gemini' ? ' 🔵 (Gemini)' :
        ' 🟢 (GLM)';
      output += `  ${row.name} — ${powerStr} (${row.last_seen})${flag}\n`;
    }
    output += "\n";
  }

  return output;
}
