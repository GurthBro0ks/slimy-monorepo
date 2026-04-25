/**
 * Sim Wars Individual Troop OCR — Gemini-based dual-screenshot troop stats extraction.
 *
 * Processes two screenshot types:
 *   1. Sim Wars deploy screen — troop power (speech bubble), HP, Attack, Defense, Rush, Leadership
 *   2. Troop Stats popup — CRIT DMG REDUC%, ELMT DMG (fire, water, earth, wind, poison)
 *
 * Uses gemini-2.5-flash (primary) and gemini-2.5-pro (secondary) in parallel,
 * diffs results, and returns structured troop stats.
 */

import { createLogger } from './logger.js';

const logger = createLogger({ context: 'sim-wars-troop-ocr' });

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
const GEMINI_MODEL_PRIMARY = 'gemini-2.5-flash';
const GEMINI_MODEL_SECONDARY = 'gemini-2.5-pro';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('/home/slimy/slimy-monorepo/node_modules/.pnpm/sharp@0.33.5/node_modules/sharp/lib/index.js');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TroopStats {
  troop_power: number | null;
  troop_hp: number | null;
  troop_attack: number | null;
  troop_defense: number | null;
  troop_rush: number | null;
  troop_leadership_current: number | null;
  troop_leadership_max: number | null;
  troop_crit_dmg_reduc_pct: number | null;
  troop_fire_dmg: number | null;
  troop_water_dmg: number | null;
  troop_earth_dmg: number | null;
  troop_wind_dmg: number | null;
  troop_poison_dmg: number | null;
}

export interface TroopOcrResult {
  stats: TroopStats;
  confidence: {
    deploy: 'high' | 'low' | 'missing';
    popup: 'high' | 'low' | 'missing';
  };
  notes: string[];
  rawResponses: { model: string; content: string }[];
}

// ─── Value Normalization ──────────────────────────────────────────────────────

export function normalizeTroopValue(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;

  let text = String(raw).trim();
  if (!text || text === '-' || text.toLowerCase() === 'null' || text.toLowerCase() === 'n/a') return null;

  text = text.replace(/,/g, '').replace(/\s+/g, '').trim();

  const pctMatch = text.match(/^([0-9]+(?:\.[0-9]+)?)%$/);
  if (pctMatch) {
    const val = parseFloat(pctMatch[1]);
    return Number.isFinite(val) ? val : null;
  }

  const leadershipMatch = text.match(/^([0-9]+)\s*\/\s*([0-9]+)$/);
  if (leadershipMatch) {
    const current = parseInt(leadershipMatch[1], 10);
    return Number.isFinite(current) ? current : null;
  }

  const suffixMatch = text.match(/^([0-9]+(?:\.[0-9]+)?)\s*([KMB])$/i);
  if (suffixMatch) {
    const numPart = parseFloat(suffixMatch[1]);
    const suffix = suffixMatch[2].toUpperCase();
    const multipliers: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9 };
    const multiplier = multipliers[suffix];
    if (multiplier && Number.isFinite(numPart)) {
      return Math.floor(numPart * multiplier);
    }
  }

  const plainNum = parseFloat(text);
  if (Number.isFinite(plainNum)) {
    return text.includes('.') ? plainNum : Math.floor(plainNum);
  }

  return null;
}

export function normalizeTroopInteger(raw: unknown): number | null {
  const val = normalizeTroopValue(raw);
  if (val === null) return null;
  return Math.floor(val);
}

export function parseLeadershipPair(raw: unknown): { current: number | null; max: number | null } {
  if (raw === null || raw === undefined) return { current: null, max: null };
  const text = String(raw).trim().replace(/,/g, '').replace(/\s+/g, '');
  const match = text.match(/^([0-9]+)\s*\/\s*([0-9]+)$/);
  if (match) {
    const cur = parseInt(match[1], 10);
    const mx = parseInt(match[2], 10);
    return {
      current: Number.isFinite(cur) ? cur : null,
      max: Number.isFinite(mx) ? mx : null,
    };
  }
  const num = parseInt(text, 10);
  if (Number.isFinite(num)) return { current: num, max: null };
  return { current: null, max: null };
}

// ─── Image Encoding ───────────────────────────────────────────────────────────

async function attachmentToDataUrl(attachmentUrl: string): Promise<string> {
  let buffer: Buffer;
  let contentType: string;

  if (attachmentUrl.startsWith('data:')) {
    const commaIdx = attachmentUrl.indexOf(',');
    const meta = attachmentUrl.slice(5, commaIdx);
    contentType = meta.split(';')[0] || 'image/png';
    const base64 = attachmentUrl.slice(commaIdx + 1);
    buffer = Buffer.from(base64, 'base64');
  } else {
    const response = await fetch(attachmentUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    contentType = response.headers.get('content-type') || 'image/png';
    buffer = Buffer.from(await response.arrayBuffer());
  }

  if (buffer.length < 1_000_000) {
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  }

  const resized = await sharp(buffer).resize(1568, 1568, { fit: 'inside' }).jpeg({ quality: 85 }).toBuffer();
  return `data:image/jpeg;base64,${resized.toString('base64')}`;
}

// ─── Gemini API Call ──────────────────────────────────────────────────────────

async function geminiChat(
  model: string,
  messages: Array<{ role: string; content: unknown }>,
  apiKey: string,
): Promise<{ content: string; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }> {
  const url = `${GEMINI_BASE_URL}chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0 }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Gemini API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };

  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
  };
}

// ─── OCR Prompts ──────────────────────────────────────────────────────────────

const DEPLOY_SCREEN_PROMPT = `You are extracting troop stats from a Super Snail Sim Wars deploy screen screenshot.

This screenshot shows:
- A speech bubble or label containing the troop's power value
- Bottom stats area showing: HP, Attack, Defense, Rush, and Leadership (displayed as current/max)

Return ONLY valid JSON with this exact schema:
{
  "troop_power": <integer or null>,
  "troop_hp": <integer or null>,
  "troop_attack": <integer or null>,
  "troop_defense": <integer or null>,
  "troop_rush": <integer or null>,
  "troop_leadership_current": <integer or null>,
  "troop_leadership_max": <integer or null>
}

Rules:
- Strip commas, spaces, and suffixes from numbers. "12,345" → 12345. "12.0M" → 12000000.
- Leadership is shown as a gauge like "1979/1979" on the bottom left. Split it into current and max as EXACT integers. "1979/1979" → current: 1979, max: 1979. NEVER abbreviate or round leadership values.
- If a value is not visible or unclear, return null for that field.
- Do NOT guess values.
- Return ONLY the JSON object, no commentary.`;

const POPUP_SCREEN_PROMPT = `You are extracting troop stats from a Super Snail Troop Stats popup screenshot.

This screenshot shows:
- Troop CRIT DMG REDUC percentage
- ELMT DMG section with: Fire, Water, Earth, Wind, Poison damage values

Return ONLY valid JSON with this exact schema:
{
  "troop_crit_dmg_reduc_pct": <number or null>,
  "troop_fire_dmg": <integer or null>,
  "troop_water_dmg": <integer or null>,
  "troop_earth_dmg": <integer or null>,
  "troop_wind_dmg": <integer or null>,
  "troop_poison_dmg": <integer or null>
}

Rules:
- CRIT DMG REDUC is a percentage. Preserve the exact decimal value. "20.8%" → 20.8 (NOT 20 or 21). "15%" → 15. Strip the % sign.
- ELMT DMG values are integers. Strip commas and suffixes. "12.0M" → 12000000.
- If a value is not visible or unclear, return null for that field.
- Do NOT guess values.
- Return ONLY the JSON object, no commentary.`;

// ─── Response Parsing ─────────────────────────────────────────────────────────

function stripCodeFence(text: string): string {
  let cleaned = String(text || '').trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
  }
  return cleaned.trim();
}

function parseJsonResponse(raw: string, model: string): Record<string, unknown> {
  const cleaned = stripCodeFence(raw);
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // fall through
      }
    }
  }
  logger.warn(`${model} returned unparseable JSON`, { snippet: cleaned.slice(0, 300) });
  return {};
}

// ─── Screenshot Classification ────────────────────────────────────────────────

function classifyResponse(data: Record<string, unknown>): 'deploy' | 'popup' | 'unknown' {
  const deployFields = ['troop_power', 'troop_hp', 'troop_attack', 'troop_defense', 'troop_rush'];
  const popupFields = ['troop_crit_dmg_reduc_pct', 'troop_fire_dmg', 'troop_water_dmg', 'troop_earth_dmg', 'troop_wind_dmg', 'troop_poison_dmg'];

  let deployScore = 0;
  let popupScore = 0;

  for (const f of deployFields) {
    if (data[f] !== undefined && data[f] !== null) deployScore++;
  }
  for (const f of popupFields) {
    if (data[f] !== undefined && data[f] !== null) popupScore++;
  }

  if (deployScore > popupScore) return 'deploy';
  if (popupScore > deployScore) return 'popup';
  return 'unknown';
}

// ─── Diff / Merge ─────────────────────────────────────────────────────────────

function mergeField(a: unknown, b: unknown): unknown {
  if (a === null || a === undefined) return b;
  if (b === null || b === undefined) return a;
  if (normalizeTroopValue(a) !== null) return a;
  return b;
}

// ─── Main Extract ─────────────────────────────────────────────────────────────

export interface ExtractTroopOptions {
  skipLiveOcr?: boolean;
}

export async function extractTroopStats(
  imageAttachments: Array<{ url: string; name?: string }>,
  options: ExtractTroopOptions = {},
): Promise<TroopOcrResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error('Missing GEMINI_API_KEY: required for troop OCR');
  if (imageAttachments.length === 0) throw new Error('At least one image is required');

  const skipLive = options.skipLiveOcr ?? process.env.SKIP_LIVE_OCR === '1';
  const emptyResult: TroopOcrResult = {
    stats: {
      troop_power: null, troop_hp: null, troop_attack: null, troop_defense: null,
      troop_rush: null, troop_leadership_current: null, troop_leadership_max: null,
      troop_crit_dmg_reduc_pct: null, troop_fire_dmg: null, troop_water_dmg: null,
      troop_earth_dmg: null, troop_wind_dmg: null, troop_poison_dmg: null,
    },
    confidence: { deploy: 'missing', popup: 'missing' },
    notes: [],
    rawResponses: [],
  };

  if (skipLive) return emptyResult;

  const imageDataUrls = await Promise.all(
    imageAttachments.map((att) => attachmentToDataUrl(att.url)),
  );

  // Run both models on each image in parallel
  type ModelResult = { model: string; data: Record<string, unknown>; raw: string; type: 'deploy' | 'popup' | 'unknown' };
  const allModelResults: ModelResult[] = [];

  for (let i = 0; i < imageDataUrls.length; i++) {
    const dataUrl = imageDataUrls[i];
    const imageName = imageAttachments[i].name || `image ${i + 1}`;
    logger.info(`Processing image ${i + 1}/${imageAttachments.length}`, { image: imageName });

    // Try both prompts with both models
    const [flashDeploy, flashPopup, proDeploy, proPopup] = await Promise.all([
      geminiChat(GEMINI_MODEL_PRIMARY, [
        { role: 'system', content: DEPLOY_SCREEN_PROMPT },
        { role: 'user', content: [
          { type: 'text', text: 'Extract deploy screen troop stats from this screenshot.' },
          { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
        ]},
      ], geminiKey).then(r => ({ model: GEMINI_MODEL_PRIMARY, content: r.content })).catch(err => {
        logger.error('Flash deploy OCR failed', err, { imageIndex: i });
        return { model: GEMINI_MODEL_PRIMARY, content: '' };
      }),
      geminiChat(GEMINI_MODEL_PRIMARY, [
        { role: 'system', content: POPUP_SCREEN_PROMPT },
        { role: 'user', content: [
          { type: 'text', text: 'Extract troop stats popup data from this screenshot.' },
          { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
        ]},
      ], geminiKey).then(r => ({ model: GEMINI_MODEL_PRIMARY, content: r.content })).catch(err => {
        logger.error('Flash popup OCR failed', err, { imageIndex: i });
        return { model: GEMINI_MODEL_PRIMARY, content: '' };
      }),
      geminiChat(GEMINI_MODEL_SECONDARY, [
        { role: 'system', content: DEPLOY_SCREEN_PROMPT },
        { role: 'user', content: [
          { type: 'text', text: 'Extract deploy screen troop stats from this screenshot.' },
          { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
        ]},
      ], geminiKey).then(r => ({ model: GEMINI_MODEL_SECONDARY, content: r.content })).catch(err => {
        logger.error('Pro deploy OCR failed', err, { imageIndex: i });
        return { model: GEMINI_MODEL_SECONDARY, content: '' };
      }),
      geminiChat(GEMINI_MODEL_SECONDARY, [
        { role: 'system', content: POPUP_SCREEN_PROMPT },
        { role: 'user', content: [
          { type: 'text', text: 'Extract troop stats popup data from this screenshot.' },
          { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
        ]},
      ], geminiKey).then(r => ({ model: GEMINI_MODEL_SECONDARY, content: r.content })).catch(err => {
        logger.error('Pro popup OCR failed', err, { imageIndex: i });
        return { model: GEMINI_MODEL_SECONDARY, content: '' };
      }),
    ]);

    const results: ModelResult[] = [
      { model: flashDeploy.model, data: parseJsonResponse(flashDeploy.content, flashDeploy.model), raw: flashDeploy.content, type: 'unknown' },
      { model: flashPopup.model, data: parseJsonResponse(flashPopup.content, flashPopup.model), raw: flashPopup.content, type: 'unknown' },
      { model: proDeploy.model, data: parseJsonResponse(proDeploy.content, proDeploy.model), raw: proDeploy.content, type: 'unknown' },
      { model: proPopup.model, data: parseJsonResponse(proPopup.content, proPopup.model), raw: proPopup.content, type: 'unknown' },
    ];

    for (const r of results) {
      r.type = classifyResponse(r.data);
      allModelResults.push(r);
    }

    logger.info(`Image ${i + 1} classified`, {
      image: imageName,
      flashDeployType: results[0].type,
      flashPopupType: results[1].type,
      proDeployType: results[2].type,
      proPopupType: results[3].type,
    });
  }

  // Merge results: pick best deploy data and best popup data
  const deployResults = allModelResults.filter(r => r.type === 'deploy');
  const popupResults = allModelResults.filter(r => r.type === 'popup');

  let mergedDeploy: Record<string, unknown> = {};
  for (const r of deployResults) {
    for (const [k, v] of Object.entries(r.data)) {
      mergedDeploy[k] = mergeField(mergedDeploy[k], v);
    }
  }

  let mergedPopup: Record<string, unknown> = {};
  for (const r of popupResults) {
    for (const [k, v] of Object.entries(r.data)) {
      mergedPopup[k] = mergeField(mergedPopup[k], v);
    }
  }

  const deployFieldCount = Object.values(mergedDeploy).filter(v => v !== null && v !== undefined).length;
  const popupFieldCount = Object.values(mergedPopup).filter(v => v !== null && v !== undefined).length;

  const leadershipRaw = mergedDeploy['troop_leadership_current'] ?? mergedDeploy['leadership'];
  const leadershipPair = parseLeadershipPair(leadershipRaw);

  const stats: TroopStats = {
    troop_power: normalizeTroopInteger(mergedDeploy['troop_power']),
    troop_hp: normalizeTroopInteger(mergedDeploy['troop_hp']),
    troop_attack: normalizeTroopInteger(mergedDeploy['troop_attack']),
    troop_defense: normalizeTroopInteger(mergedDeploy['troop_defense']),
    troop_rush: normalizeTroopInteger(mergedDeploy['troop_rush']),
    troop_leadership_current: leadershipPair.current ?? normalizeTroopInteger(mergedDeploy['troop_leadership_current']),
    troop_leadership_max: leadershipPair.max ?? normalizeTroopInteger(mergedDeploy['troop_leadership_max']),
    troop_crit_dmg_reduc_pct: normalizeTroopValue(mergedPopup['troop_crit_dmg_reduc_pct']),
    troop_fire_dmg: normalizeTroopInteger(mergedPopup['troop_fire_dmg']),
    troop_water_dmg: normalizeTroopInteger(mergedPopup['troop_water_dmg']),
    troop_earth_dmg: normalizeTroopInteger(mergedPopup['troop_earth_dmg']),
    troop_wind_dmg: normalizeTroopInteger(mergedPopup['troop_wind_dmg']),
    troop_poison_dmg: normalizeTroopInteger(mergedPopup['troop_poison_dmg']),
  };

  const notes: string[] = [];
  if (deployResults.length === 0) notes.push('No deploy screen data extracted');
  if (popupResults.length === 0) notes.push('No troop stats popup data extracted');
  if (deployResults.length > 1) notes.push(`Merged deploy data from ${deployResults.length} model responses`);
  if (popupResults.length > 1) notes.push(`Merged popup data from ${popupResults.length} model responses`);

  logger.info('Troop OCR complete', {
    deployFields: deployFieldCount,
    popupFields: popupFieldCount,
    deploySources: deployResults.length,
    popupSources: popupResults.length,
  });

  return {
    stats,
    confidence: {
      deploy: deployFieldCount >= 3 ? 'high' : deployFieldCount > 0 ? 'low' : 'missing',
      popup: popupFieldCount >= 3 ? 'high' : popupFieldCount > 0 ? 'low' : 'missing',
    },
    notes,
    rawResponses: allModelResults.map(r => ({ model: r.model, content: r.raw.slice(0, 500) })),
  };
}
