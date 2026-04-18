/**
 * OpenAI API usage tracking and cost calculation.
 * Ported from /opt/slimy/app/lib/usage-openai.js
 */

import { database } from "./database.js";
import { openai } from "./openai.js";

interface PricingEntry {
  input_per_million?: number;
  output_per_million?: number;
  standard?: number;
  hd?: number;
}

const PRICING: Record<string, PricingEntry> = {
  "gpt-4o-mini-2024-07-18": {
    input_per_million: Number(process.env.PRICE_4OMINI_IN || 0.15),
    output_per_million: Number(process.env.PRICE_4OMINI_OUT || 0.6),
  },
  "gpt-4o-mini": {
    input_per_million: Number(process.env.PRICE_4OMINI_IN || 0.15),
    output_per_million: Number(process.env.PRICE_4OMINI_OUT || 0.6),
  },
  "dall-e-3": {
    standard: Number(process.env.PRICE_DALLE3_STANDARD || 0.04),
    hd: Number(process.env.PRICE_DALLE3_HD || 0.08),
  },
};

function calculateTokenCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number | null {
  const pricing = PRICING[model];
  if (!pricing || !pricing.input_per_million) return null;
  const inputCost = (inputTokens / 1e6) * pricing.input_per_million;
  const outputCost = (outputTokens / 1e6) * (pricing.output_per_million ?? 0);
  return inputCost + outputCost;
}

function calculateImageCost(quality: string, count: number): number {
  const pricing = PRICING["dall-e-3"];
  const tierPrice =
    pricing[quality as keyof PricingEntry] || pricing.standard || 0.04;
  return tierPrice * count;
}

async function fetchOpenAIUsage(
  startDate: string,
  endDate: string,
): Promise<unknown> {
  if (!openai.isConfigured()) return null;
  try {
    const url = `https://api.openai.com/v1/usage?start_date=${startDate}&end_date=${endDate}`;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) return response.json();
    if (response.status === 404 || response.status === 401) return null;
    throw new Error(`OpenAI usage API returned ${response.status}`);
  } catch (err) {
    console.error("[usage-openai] Failed to fetch usage:", (err as Error).message);
    return null;
  }
}

async function fetchLocalImageStats(
  guildId: string | null,
  startDate: string,
  endDate: string,
): Promise<unknown> {
  if (!database.isConfigured()) return null;
  try {
    const pool = database.getPool();
    const [rows] = await pool.query(
      `SELECT model, quality, COUNT(*) as total_images,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_images
       FROM image_generation_log
       WHERE guild_id <=> ?
         AND created_at >= ?
         AND created_at <= ?
       GROUP BY model, quality`,
      [guildId || null, startDate + "T00:00:00Z", endDate + "T23:59:59Z"],
    );
    return rows;
  } catch (err) {
    console.error(
      "[usage-openai] Failed to fetch local image stats:",
      (err as Error).message,
    );
    return null;
  }
}

function parseWindow(
  window: string,
  customStart?: string | null,
  customEnd?: string | null,
): { startDate: string; endDate: string } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (window) {
    case "today": {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case "7d": {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      endDate = new Date(now);
      break;
    }
    case "30d": {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      endDate = new Date(now);
      break;
    }
    case "this_month": {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now);
      break;
    }
    case "custom": {
      if (!customStart || !customEnd) {
        throw new Error("Custom window requires start and end dates");
      }
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      break;
    }
    default:
      throw new Error(`Unknown window: ${window}`);
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

interface ModelUsage {
  model: string;
  requests: number;
  inputTokens?: number;
  outputTokens?: number;
  images?: number;
  cost: number;
  byQuality?: Record<string, number>;
}

function aggregateUsage(
  apiData: unknown,
  localImageStats: unknown,
): { byModel: ModelUsage[]; totalCost: number; totalRequests: number } {
  const byModelMap = new Map<string, ModelUsage>();
  let totalCost = 0;
  let totalRequests = 0;

  const data = apiData as {
    data?: Array<{
      results?: Array<{
        model?: string;
        n_requests?: number;
        n_context_tokens_total?: number;
        n_generated_tokens_total?: number;
      }>;
    }>;
  };

  if (data && Array.isArray(data.data)) {
    for (const day of data.data) {
      for (const modelUsage of day.results || []) {
        const model = modelUsage.model || "unknown";
        const requests = modelUsage.n_requests || 0;
        const inputTokens = modelUsage.n_context_tokens_total || 0;
        const outputTokens = modelUsage.n_generated_tokens_total || 0;

        if (!byModelMap.has(model)) {
          byModelMap.set(model, {
            model,
            requests: 0,
            inputTokens: 0,
            outputTokens: 0,
            cost: 0,
          });
        }

        const entry = byModelMap.get(model)!;
        entry.requests += requests;
        entry.inputTokens! += inputTokens;
        entry.outputTokens! += outputTokens;

        const cost = calculateTokenCost(model, inputTokens, outputTokens);
        if (cost !== null) {
          entry.cost += cost;
          totalCost += cost;
        }

        totalRequests += requests;
      }
    }
  }

  const imageRows = localImageStats as Array<{
    model?: string;
    successful_images?: number;
    quality?: string;
  }>;
  if (imageRows && Array.isArray(imageRows)) {
    for (const row of imageRows) {
      const model = row.model || "dall-e-3";
      const count = row.successful_images || 0;
      const quality = row.quality || "standard";

      if (!byModelMap.has(model)) {
        byModelMap.set(model, {
          model,
          requests: 0,
          images: 0,
          cost: 0,
          byQuality: {},
        });
      }

      const entry = byModelMap.get(model)!;
      entry.images = (entry.images || 0) + count;
      entry.requests += count;
      const cost = calculateImageCost(quality, count);
      entry.cost += cost;
      entry.byQuality![quality] = (entry.byQuality![quality] || 0) + count;
      totalCost += cost;
      totalRequests += count;
    }
  }

  return {
    byModel: Array.from(byModelMap.values()),
    totalCost,
    totalRequests,
  };
}

export { PRICING, calculateTokenCost, calculateImageCost, fetchOpenAIUsage, fetchLocalImageStats, parseWindow, aggregateUsage };
