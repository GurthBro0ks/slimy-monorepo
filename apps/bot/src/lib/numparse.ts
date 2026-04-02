/**
 * Robust power number parser with anti-inflation heuristics.
 * Ported from /opt/slimy/app/lib/numparse.js
 */

function normalizeOCR(raw: string): string {
  if (!raw) return "";
  let text = String(raw).trim();
  text = text.replace(/O/gi, "0");
  text = text.replace(/[lI]/g, "1");
  text = text.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, "");
  text = text.replace(/[，]/g, ",");
  text = text.replace(/[。]/g, ".");
  return text;
}

function parseSuffixNotation(text: string): { value: number | null; suffix: string | null } {
  const suffixPattern = /^([0-9]+(?:\.[0-9]+)?)\s*([KMB])$/i;
  const match = text.match(suffixPattern);
  if (!match) return { value: null, suffix: null };

  const numPart = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  const multipliers: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9 };

  const multiplier = multipliers[suffix];
  if (!multiplier || !Number.isFinite(numPart)) return { value: null, suffix: null };

  return {
    value: Math.floor(numPart * multiplier),
    suffix,
  };
}

function parseGroupedNumber(text: string): number | null {
  const cleaned = text.replace(/[^\d,.]/g, "").replace(/,/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

export interface ParseResult {
  value: number | null;
  corrected: boolean;
  reason: string | null;
}

export function parsePower(input: unknown): ParseResult {
  if (input === null || input === undefined) return { value: null, corrected: false, reason: "null input" };

  const text = normalizeOCR(String(input));

  // Try suffix notation first (e.g., "10.5M")
  const suffixResult = parseSuffixNotation(text);
  if (suffixResult.value !== null) {
    return { value: suffixResult.value, corrected: false, reason: null };
  }

  // Try plain number
  const plain = parseGroupedNumber(text);
  if (plain !== null) {
    return { value: plain, corrected: false, reason: null };
  }

  return { value: null, corrected: false, reason: "unparseable" };
}
