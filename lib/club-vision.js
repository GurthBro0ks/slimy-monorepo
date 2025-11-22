"use strict";

const { parsePower } = require("./numparse");

function normalizeMemberKey(input) {
  if (!input) return null;
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function classifyPage(dataUrl, filename = "", options = {}) {
  const lower = String(filename || "").toLowerCase();
  const hints = {};

  if (lower.startsWith("sim-") || lower.includes("_sim")) {
    hints.filename = filename;
    return { type: "sim", score: 0.9, hints };
  }
  if (lower.includes("total")) {
    hints.filename = filename;
    return { type: "total", score: 0.7, hints };
  }

  const lines = gatherLines(dataUrl, options);
  const textBlob = lines.join("\n").toLowerCase();
  if (/\bsim\s+power\b/.test(textBlob) || /\bsim\b/.test(textBlob)) {
    hints.anchor = "sim";
    return { type: "sim", score: 0.7, hints };
  }
  if (/\bpower\b/.test(textBlob)) {
    hints.anchor = "power";
    return { type: "total", score: 0.55, hints };
  }

  return { type: "unknown", score: 0.4, hints };
}

async function parseManageMembersImageEnsemble(dataUrl, metric = "total", options = {}) {
  const lines = gatherLines(dataUrl, options);
  if (!lines.length) {
    return {
      metric: metric || "total",
      rows: [],
      ensembleMetadata: { totalMembers: 0, disagreements: [], median: null },
    };
  }

  let resolvedMetric = metric;
  if (!resolvedMetric || resolvedMetric === "auto" || resolvedMetric === "unknown") {
    const classification = classifyPage(dataUrl, options.filename || "", options);
    resolvedMetric = classification.type === "unknown" ? "total" : classification.type;
  }

  const parsedRows = [];
  for (const line of lines) {
    const parsedLine = parseLine(line);
    if (parsedLine) {
      parsedRows.push(parsedLine);
    }
  }

  const median = computeMedian(
    parsedRows.map((row) => row.parsed.value).filter((val) => typeof val === "number"),
  );

  const rows = parsedRows
    .map((row) => {
      const reParsed = parsePower(row.rawPower, { median });
      const corrected = reParsed.corrected || row.parsed.corrected;
      const reasonParts = [reParsed.reason, row.parsed.reason].filter(Boolean);
      return {
        canonical: row.canonical,
        display: row.display,
        raw: row.rawPower,
        value: reParsed.value,
        corrected,
        reason: reasonParts.length ? reasonParts.join(",") : undefined,
      };
    })
    .filter((row) => row.value !== null);

  return {
    metric: resolvedMetric || "total",
    rows,
    ensembleMetadata: {
      totalMembers: rows.length,
      disagreements: [],
      median: median || null,
    },
  };
}

function parseLine(line) {
  const token = extractNumberToken(line);
  if (!token) return null;

  const display = line.replace(token, "").trim() || line.trim();
  const parsed = parsePower(token);
  if (parsed.value === null) {
    return null;
  }

  return {
    display,
    canonical: normalizeMemberKey(display),
    rawPower: token,
    parsed,
  };
}

function extractNumberToken(line) {
  if (!line) return null;
  const matches = String(line).match(/([0-9oOiIlL.,\s]+(?:[kmbKMB])?)/g);
  if (!matches || !matches.length) return null;
  // Use the last numeric-looking token on the line; names often precede numbers.
  return matches[matches.length - 1].trim();
}

function gatherLines(dataUrl, { text, ocrLines } = {}) {
  if (Array.isArray(ocrLines) && ocrLines.length) {
    return ocrLines.map((line) => String(line || "").trim()).filter(Boolean);
  }

  const sourceText =
    typeof text === "string"
      ? text
      : typeof dataUrl === "string"
        ? decodeDataUrlText(dataUrl) || dataUrl
        : "";

  if (!sourceText) return [];

  return sourceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function decodeDataUrlText(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:([^;,]+)?;base64,(.+)$/i);
  if (!match) return null;
  try {
    const decoded = Buffer.from(match[2], "base64").toString("utf8");
    return isMostlyText(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function isMostlyText(text) {
  if (!text) return false;
  const printable = text.replace(/[\x20-\x7E\r\n\t]/g, "");
  return printable.length <= text.length * 0.15;
}

function computeMedian(values) {
  const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v)).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  if (nums.length % 2 === 0) {
    return (nums[mid - 1] + nums[mid]) / 2;
  }
  return nums[mid];
}

module.exports = {
  classifyPage,
  parseManageMembersImageEnsemble,
  normalizeMemberKey,
};
