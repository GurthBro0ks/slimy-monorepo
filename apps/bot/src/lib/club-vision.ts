/**
 * Club screenshot AI vision parsing.
 * Ported from /opt/slimy/app/lib/club-vision.js
 * Stub implementation — requires Chunk 5 for full openai wiring.
 */

import { canonicalize } from './club-store.js';
import { parsePower } from './numparse.js';

const DEFAULT_MODEL = process.env.CLUB_VISION_MODEL || "gpt-4o";

interface VisionRow {
  name: string;
  display: string;
  canonical: string;
  value: number | null;
  confidence: number;
  corrected: boolean;
  parseReason: string | null;
}

interface ParseResult {
  metric: string;
  rows: VisionRow[];
}

function clampConfidence(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(1, Math.max(0, Math.round(num * 1000) / 1000));
}

function stripCodeFence(text: string): string {
  let cleaned = String(text || "").trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
  }
  return cleaned.trim();
}

export async function parseManageMembersImage(
  imageUrl: string,
  forced: string | null = null,
  options: Record<string, unknown> = {},
): Promise<ParseResult> {
  if (!process.env.OPENAI_API_KEY && !process.env.AI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured for vision parsing");
  }
  if (!imageUrl) throw new Error("imageUrl is required");

  console.warn("[club-vision] parseManageMembersImage stub called — vision not yet wired");

  // Return stub data so the session flow doesn't crash
  return {
    metric: forced || "total",
    rows: [],
  };
}

export async function parseManageMembersImageEnsemble(
  imageUrl: string,
  forced: string | null = null,
): Promise<ParseResult & { ensembleMetadata: Record<string, unknown> }> {
  console.warn("[club-vision] parseManageMembersImageEnsemble stub called");

  const result = await parseManageMembersImage(imageUrl, forced);
  return {
    ...result,
    ensembleMetadata: {
      totalMembers: 0,
      disagreements: 0,
      onlyInA: 0,
      onlyInB: 0,
      bothModels: 0,
    },
  };
}

export async function classifyPage(
  imageUrl: string,
  filenameHint: string | null = null,
): Promise<"sim" | "total" | "unknown"> {
  if (filenameHint) {
    const filename = String(filenameHint).toLowerCase();
    if (filename.includes("sim-") || filename.includes("sim_")) return "sim";
  }
  return "unknown";
}
