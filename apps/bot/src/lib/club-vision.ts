/**
 * Club screenshot AI vision parsing using GPT-4o Vision.
 * Ported from /opt/slimy/app/lib/club-vision.js
 */

import { openai } from "./openai.js";
import { canonicalize } from "./club-store.js";
import { parsePower } from "./numparse.js";

const DEFAULT_MODEL = process.env.CLUB_VISION_MODEL || "gpt-4o";
const STRICT_MODEL = process.env.CLUB_VISION_STRICT_MODEL || "gpt-4o";
const ENSEMBLE_MODEL_A = process.env.CLUB_VISION_ENSEMBLE_A || "gpt-4o";
const ENSEMBLE_MODEL_B = process.env.CLUB_VISION_ENSEMBLE_B || "gpt-4o";
const MAX_RETRIES = Number(process.env.CLUB_VISION_MAX_RETRIES || 4);
const BASE_RETRY_DELAY_MS = Number(process.env.CLUB_VISION_RETRY_BASE_DELAY_MS || 500);
const RETRY_JITTER_MS = Number(process.env.CLUB_VISION_RETRY_JITTER_MS || 250);

const DEFAULT_SYSTEM_PROMPT = `
You read Super Snail "Manage Members" screens. Each member tile has a display name and either the label "Sim Power" or "Power" (total).
Return pure JSON in this exact schema:
{"metric":"sim"|"total","rows":[{"name":string,"value":integer,"confidence":number}]}
- "metric" must be "sim" or "total" inferred from the on-screen label.
- "value" is an integer. Strip commas, dots, spaces, and other formatting.
- "confidence" is between 0 and 1 describing your certainty the value is correct.
- Ignore tiles without a numeric value.
- Do not add commentary or trailing text. JSON only.
`.trim();

const STRICT_SYSTEM_PROMPT = `
You perform OCR on Super Snail "Manage Members" screens. Focus on precision.
Return ONLY JSON with schema {"metric":"sim"|"total","rows":[{"name":string,"value":integer,"confidence":number}]}.
Re-check every digit carefully. If unclear, omit the row rather than guessing.
`.trim();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VisionRow {
  name: string;
  display: string;
  canonical: string;
  value: number | null;
  confidence: number;
  corrected: boolean;
  parseReason: string | null;
  ensembleSource?: string;
  ensembleConfidence?: number;
  ensembleReconciled?: unknown;
}

export interface ParseResult {
  metric: string;
  rows: VisionRow[];
  ensembleMetadata?: Record<string, unknown>;
}

// ─── Retry Logic ──────────────────────────────────────────────────────────────

function shouldRetry(err: unknown): boolean {
  if (!err) return false;
  const e = err as Record<string, unknown>;
  const status = e.status || e.statusCode || e.httpStatus || e.code;
  if (status === 429 || status === "rate_limit_exceeded") return true;
  if (status === 500 || status === 502 || status === 503 || status === 504) return true;
  const message = String((err as Error).message || "").toLowerCase();
  if (message.includes("rate limit") || message.includes("exceeded quota")) return true;
  return false;
}

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  context: Record<string, unknown> = {},
): Promise<T> {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < MAX_RETRIES) {
    attempt += 1;
    try {
      const response = await fn();
      if (response && typeof response === "object" && "usage" in response) {
        const r = response as { usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } };
        if (r.usage) {
          console.debug("[club-vision] Usage", {
            attempt,
            prompt_tokens: r.usage.prompt_tokens,
            completion_tokens: r.usage.completion_tokens,
            total_tokens: r.usage.total_tokens,
            model: context.model,
          });
        }
      }
      return response;
    } catch (err) {
      lastError = err as Error;
      if (!shouldRetry(err) || attempt >= MAX_RETRIES) {
        console.error("[club-vision] Vision request failed", {
          attempt,
          maxRetries: MAX_RETRIES,
          model: context.model,
          error: (err as Error).message,
        });
        throw err;
      }

      const backoff =
        BASE_RETRY_DELAY_MS * 2 ** (attempt - 1) + Math.random() * RETRY_JITTER_MS;
      console.warn("[club-vision] Retry due to OpenAI rate limit", {
        attempt,
        model: context.model,
        waitMs: Math.round(backoff),
        message: (err as Error).message,
      });
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  throw lastError || new Error("Vision request failed after retries");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Page Classification ──────────────────────────────────────────────────────

export async function classifyPage(
  imageUrl: string,
  filenameHint: string | null = null,
): Promise<"sim" | "total" | "unknown"> {
  if (filenameHint) {
    const filename = String(filenameHint).toLowerCase();
    if (filename.includes("sim-") || filename.includes("sim_")) return "sim";
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured for page classification");
  }

  const response = await executeWithRetry(
    () =>
      openai.chat.completions.create({
        model: DEFAULT_MODEL,
        temperature: 0,
        max_tokens: 50,
        messages: [
          {
            role: "system",
            content:
              'Determine if this Super Snail "Manage Members" screen shows "Sim Power" or "Power" (total). Respond with ONLY "sim", "total", or "unknown".',
          },
          {
            role: "user",
            content: [
              { type: "text" as const, text: "What type of power is shown?" },
              { type: "image_url" as const, image_url: { url: imageUrl, detail: "low" } },
            ],
          },
        ],
      }),
    { model: DEFAULT_MODEL, task: "classify" },
  );

  const rawContent = (response as { choices?: Array<{ message?: { content?: string } }> })
    ?.choices?.[0]?.message?.content || "";
  const normalized = rawContent.trim().toLowerCase();

  if (normalized.includes("sim")) return "sim";
  if (normalized.includes("power") || normalized.includes("total")) return "total";
  return "unknown";
}

// ─── Single-Model Parse ───────────────────────────────────────────────────────

export async function parseManageMembersImage(
  imageUrl: string,
  forced: string | null = null,
  options: Record<string, unknown> = {},
): Promise<ParseResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured for vision parsing");
  }
  if (!imageUrl) throw new Error("imageUrl is required");

  const strict = Boolean(options.strict);
  const model = (options.model as string) || (strict ? STRICT_MODEL : DEFAULT_MODEL);
  const systemPrompt = strict ? STRICT_SYSTEM_PROMPT : DEFAULT_SYSTEM_PROMPT;

  const response = await executeWithRetry(
    () =>
      openai.chat.completions.create({
        model,
        temperature: 0,
        max_tokens: 400,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text" as const, text: "Read this Manage Members screenshot and return the JSON." },
              { type: "image_url" as const, image_url: { url: imageUrl, detail: "high" } },
            ],
          },
        ],
      }),
    { model, strict },
  );

  const rawContent = (response as { choices?: Array<{ message?: { content?: string } }> })
    ?.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error("Vision response was empty");

  let parsed: { metric?: unknown; rows?: unknown[] };
  try {
    parsed = JSON.parse(stripCodeFence(rawContent));
  } catch (err) {
    console.error("[club-vision] Failed to parse JSON", { raw: rawContent });
    throw new Error(`Vision returned invalid JSON: ${(err as Error).message}`);
  }

  let metric = typeof parsed?.metric === "string" ? parsed.metric.toLowerCase() : null;
  if (metric !== "sim" && metric !== "total") metric = forced || null;
  if (forced && (forced === "sim" || forced === "total")) metric = forced;
  if (!metric) throw new Error("Unable to determine metric for screenshot");

  const rows = Array.isArray(parsed?.rows) ? parsed.rows : [];
  const deduped = new Map<string, VisionRow>();

  for (const row of rows) {
    const rowObj = row as { name?: unknown; value?: unknown; confidence?: unknown };
    const display = String(rowObj?.name ?? "").trim();
    const canonical = canonicalize(display);

    const parseResult = parsePower(rowObj?.value);
    const value = parseResult.value;
    const confidence = clampConfidence(rowObj?.confidence ?? 0);

    if (!canonical || value === null) continue;

    const existing = deduped.get(canonical);
    if (!existing) {
      deduped.set(canonical, {
        name: display || canonical,
        display: display || canonical,
        canonical,
        value,
        confidence,
        corrected: parseResult.corrected || false,
        parseReason: parseResult.reason || null,
      });
      continue;
    }

    if (value !== null && (existing.value === null || value > existing.value)) {
      existing.value = value;
      existing.display = display || existing.display;
      existing.name = display || existing.name;
      existing.corrected = parseResult.corrected || existing.corrected;
      existing.parseReason = parseResult.reason || existing.parseReason;
    }
    if (confidence > existing.confidence) {
      existing.confidence = confidence;
    }
  }

  return {
    metric,
    rows: Array.from(deduped.values()),
  };
}

// ─── Digit Reconciliation ─────────────────────────────────────────────────────

interface ReconciliationResult {
  value: number | null;
  hasDisagreement: boolean;
  disagreements: Array<{ position: number; modelA: string; modelB: string }>;
  valueA: number;
  valueB: number;
  sources: { modelA: string; modelB: string };
}

function reconcileDigits(
  valueA: string | number,
  valueB: string | number,
  _nameA: string,
  _nameB: string,
): ReconciliationResult {
  const strA = String(valueA || "").padStart(12, "0");
  const strB = String(valueB || "").padStart(12, "0");
  let reconciled = "";
  let hasDisagreement = false;
  const disagreements: Array<{ position: number; modelA: string; modelB: string }> = [];

  for (let i = 0; i < Math.max(strA.length, strB.length); i++) {
    const digitA = strA[i] || "0";
    const digitB = strB[i] || "0";

    if (digitA === digitB) {
      reconciled += digitA;
    } else {
      hasDisagreement = true;
      disagreements.push({ position: i, modelA: digitA, modelB: digitB });
      reconciled += digitB; // Default to model B
    }
  }

  const finalValue = Number(reconciled);

  return {
    value: Number.isFinite(finalValue) ? finalValue : null,
    hasDisagreement,
    disagreements,
    valueA: Number(valueA),
    valueB: Number(valueB),
    sources: { modelA: ENSEMBLE_MODEL_A, modelB: ENSEMBLE_MODEL_B },
  };
}

// ─── Ensemble Parse ───────────────────────────────────────────────────────────

export async function parseManageMembersImageEnsemble(
  imageUrl: string,
  forced: string | null = null,
): Promise<ParseResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured for vision parsing");
  }
  if (!imageUrl) throw new Error("imageUrl is required");

  console.info("[club-vision] Running ensemble parse", {
    modelA: ENSEMBLE_MODEL_A,
    modelB: ENSEMBLE_MODEL_B,
  });

  const [resultA, resultB] = await Promise.all([
    parseManageMembersImage(imageUrl, forced, { model: ENSEMBLE_MODEL_A, strict: false }),
    parseManageMembersImage(imageUrl, forced, { model: ENSEMBLE_MODEL_B, strict: true }),
  ]);

  let metric = resultA.metric || resultB.metric;
  if (forced && (forced === "sim" || forced === "total")) metric = forced;
  if (!metric) throw new Error("Unable to determine metric for screenshot");

  const mapA = new Map(resultA.rows.map((r) => [r.canonical, { ...r, source: "A" }]));
  const mapB = new Map(resultB.rows.map((r) => [r.canonical, { ...r, source: "B" }]));

  const allCanonicals = new Set([...mapA.keys(), ...mapB.keys()]);
  const reconciledRows: VisionRow[] = [];
  const ensembleMetadata: Record<string, number> = {
    totalMembers: allCanonicals.size,
    disagreements: 0,
    onlyInA: 0,
    onlyInB: 0,
    bothModels: 0,
  };

  for (const canonical of allCanonicals) {
    const rowA = mapA.get(canonical);
    const rowB = mapB.get(canonical);

    if (!rowA && rowB) {
      ensembleMetadata.onlyInB = (ensembleMetadata.onlyInB || 0) + 1;
      reconciledRows.push({
        ...rowB,
        ensembleSource: "B",
        ensembleConfidence: (rowB.confidence || 0) * 0.9,
      });
      continue;
    }

    if (rowA && !rowB) {
      ensembleMetadata.onlyInA = (ensembleMetadata.onlyInA || 0) + 1;
      reconciledRows.push({
        ...rowA,
        ensembleSource: "A",
        ensembleConfidence: (rowA.confidence || 0) * 0.7,
      });
      continue;
    }

    // Both models found this member — reconcile digit by digit
    ensembleMetadata.bothModels = (ensembleMetadata.bothModels || 0) + 1;
    const reconciled = reconcileDigits(
      rowA!.value ?? 0,
      rowB!.value ?? 0,
      ENSEMBLE_MODEL_A,
      ENSEMBLE_MODEL_B,
    );

    if (reconciled.hasDisagreement) {
      ensembleMetadata.disagreements = (ensembleMetadata.disagreements || 0) + 1;
    }

    const display = rowB!.display || rowA!.display;

    reconciledRows.push({
      name: display,
      display,
      canonical,
      value: reconciled.value,
      confidence: Math.min(rowA!.confidence, rowB!.confidence),
      corrected: (rowA!.corrected || rowB!.corrected),
      parseReason: reconciled.hasDisagreement ? "ensemble-reconciled" : (rowA!.parseReason || rowB!.parseReason),
      ensembleSource: "both",
      ensembleConfidence: reconciled.hasDisagreement ? 0.85 : 1.0,
      ensembleReconciled: reconciled,
    });
  }

  console.info("[club-vision] Ensemble reconciliation complete", ensembleMetadata);

  return {
    metric,
    rows: reconciledRows,
    ensembleMetadata,
  };
}
