/**
 * Minimal numeric parsing helpers used by @slimy/core in tests.
 * This is intentionally small: add new helpers here if future callers need them.
 */

/**
 * Parse power numbers from OCR/text with anti-inflation heuristics.
 *
 * Biases toward under-counting when input looks suspicious:
 * - Normalizes common OCR slips: O→0, l/I→1
 * - Supports K/M/B suffixes
 * - Repairs loose thousands-grouping (1,234,5678 → 1,234,567)
 * - Trims obvious trailing digits (2180102088 → 218010208)
 * - Can down-weight extreme outliers when provided a median hint
 *
 * @param {string|number|null|undefined} rawText
 * @param {object} [options]
 * @param {number|null} [options.median] - Median of nearby values; used to spot outliers.
 * @returns {{ value: number|null, corrected: boolean, reason?: string }}
 */
function parsePower(rawText, { median = null } = {}) {
  const base = { value: null, corrected: false };
  if (rawText == null) return base;

  let text = String(rawText).trim();
  if (!text) return base;

  const original = text;
  text = normalizeOcrDigits(text);
  if (text !== original) {
    base.corrected = true;
    base.reason = "normalized_ocr_digits";
  }

  // Extract suffix (K/M/B) if present.
  const suffixMatch = text.match(/([kmb])\s*$/i);
  let multiplier = 1;
  if (suffixMatch) {
    const suffix = suffixMatch[1].toLowerCase();
    multiplier = suffix === "k" ? 1e3 : suffix === "m" ? 1e6 : 1e9;
    text = text.slice(0, suffixMatch.index).trim();
  }

  // Remove whitespace inside the number (e.g., "1 234 567").
  text = text.replace(/\s+/g, "");

  // Separate integer/decimal portions for grouping fixes.
  const [intPortion, decimalPortion = ""] = text.split(".");

  const grouping = fixGrouping(intPortion);
  let corrected = base.corrected || grouping.corrected;
  let reasons = [];
  if (base.reason) reasons.push(base.reason);
  if (grouping.reason) reasons.push(grouping.reason);

  let numeric = grouping.text;

  // Remove commas for numeric parsing.
  let compact = numeric.replace(/,/g, "");

  // Trailing digit inflation detection only applies to whole numbers.
  if (!decimalPortion && !suffixMatch) {
    const trailing = trimTrailingDigits(compact, {
      median,
      groupingSuspicious: grouping.suspicious,
    });
    if (trailing.corrected) {
      compact = trailing.digits;
      corrected = true;
      if (trailing.reason) reasons.push(trailing.reason);
    }
  }

  const candidate = decimalPortion ? `${compact}.${decimalPortion}` : compact;
  const parsed = Number(candidate);
  if (!Number.isFinite(parsed)) {
    return { value: null, corrected: corrected || false, reason: reasons.join(",") || undefined };
  }

  const value = parsed * multiplier;
  return {
    value: Number.isFinite(value) ? value : null,
    corrected,
    reason: reasons.length ? reasons.join(",") : undefined,
  };
}

function normalizeOcrDigits(text) {
  return String(text).replace(/[oO]/g, "0").replace(/[lI]/g, "1");
}

function fixGrouping(intPortion) {
  const parts = String(intPortion || "").split(",");
  if (parts.length <= 1) {
    return { text: intPortion, corrected: false, suspicious: false };
  }

  const invalid =
    parts.some((part, idx) => {
      if (idx === 0) {
        return part.length === 0 || part.length > 3;
      }
      return part.length !== 3;
    }) || parts[parts.length - 1].length > 3;

  if (!invalid) {
    return { text: intPortion, corrected: false, suspicious: false };
  }

  const sanitizedParts = [...parts];
  const lastIdx = sanitizedParts.length - 1;
  const last = sanitizedParts[lastIdx];
  if (last.length > 3) {
    // Drop excess tail digits to deflate inflated grouping.
    sanitizedParts[lastIdx] = last.slice(0, 3);
  }

  // Collapse commas entirely if mid-groups are malformed (e.g., "12,34,567").
  let sanitized = sanitizedParts.join("");
  if (sanitized.length >= 4) {
    const groups = [];
    let idx = sanitized.length;
    while (idx > 0) {
      const start = Math.max(0, idx - 3);
      groups.unshift(sanitized.slice(start, idx));
      idx = start;
    }
    // Keep leading group as-is (1-3 digits), others are 3-digit chunks.
    sanitized = `${groups[0]}${groups.length > 1 ? "," + groups.slice(1).join(",") : ""}`;
  }

  return {
    text: sanitized,
    corrected: true,
    suspicious: true,
    reason: "normalized_grouping",
  };
}

function trimTrailingDigits(digits, { median = null, groupingSuspicious = false } = {}) {
  const raw = Number(digits);
  if (!Number.isFinite(raw)) {
    return { digits, corrected: false };
  }

  const repeatedTail =
    digits.length >= 2 && digits[digits.length - 1] === digits[digits.length - 2];
  const veryLong = digits.length >= 10;
  const candidateDigits = digits.slice(0, -1);
  const candidateVal = Number(candidateDigits);

  const outlier =
    Number.isFinite(median) && median > 0 && raw > median * 8 && candidateVal > 0;

  const shouldTrim =
    (groupingSuspicious && (veryLong || repeatedTail || outlier)) ||
    (veryLong && repeatedTail) ||
    outlier;

  if (shouldTrim && candidateVal) {
    return {
      digits: candidateDigits,
      corrected: true,
      reason: "trimmed_trailing_digit",
    };
  }

  return { digits, corrected: false };
}

function toNumber(value) {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

function toInt(value) {
  if (value == null) return null;
  const n = parseInt(String(value).trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function toFloat(value) {
  if (value == null) return null;
  const n = parseFloat(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

/**
 * Convert a value to integer cents (e.g. "12.34" -> 1234) or null if invalid.
 */
function toCents(value) {
  const f = toFloat(value);
  if (f == null) return null;
  return Math.round(f * 100);
}
module.exports = {
  toNumber,
  toInt,
  toFloat,
  toCents,
  parsePower,
  default: {
    toNumber,
    toInt,
    toFloat,
    toCents,
    parsePower,
  },
};
