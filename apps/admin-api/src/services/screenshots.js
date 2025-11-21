"use strict";

/**
 * Screenshots Service
 *
 * Manages screenshot analysis records.
 * Demo implementation - returns mock data for development.
 * Later this can be extended to read from DB or OCR pipeline.
 */

/**
 * Return a list of recent screenshot analyses.
 * Demo implementation; later this can read from DB or OCR pipeline.
 *
 * @returns {Promise<Array<Object>>} List of screenshot analysis records
 */
async function listScreenshotAnalyses() {
  const now = new Date().toISOString();

  return [
    {
      id: "demo-1",
      type: "snail_city",             // e.g. "snail_city" | "club_power" | ...
      status: "parsed",               // "parsed" | "pending" | "error"
      description: "Supersnail city overview",
      source: "upload",               // "upload" | "discord" | "manual"
      fileName: "city-overview-1.png",
      createdAt: now,
      updatedAt: now,
      details: {
        snailLevel: 125,
        cityLevel: 40,
        club: "Demo Club",
      },
    },
    {
      id: "demo-2",
      type: "club_power",
      status: "pending",
      description: "Weekly club power screenshot",
      source: "discord",
      fileName: "club-power-week-44.png",
      createdAt: now,
      updatedAt: now,
      details: null,
    },
    {
      id: "demo-3",
      type: "snail_stats",
      status: "error",
      description: "Supersnail stat page (parse failed)",
      source: "upload",
      fileName: "snail-stats-failed.png",
      createdAt: now,
      updatedAt: now,
      details: { error: "Text too blurry" },
    },
  ];
}

module.exports = {
  listScreenshotAnalyses,
};
