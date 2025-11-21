"use strict";

/**
 * Screenshot Analysis Service
 *
 * Handles screenshot analysis metadata and retrieval.
 * For now, returns demo data. In the future, this can be backed by:
 * - Database for storing analysis results
 * - OCR/Vision AI pipelines
 * - Discord/upload integrations
 */

/**
 * Return a list of recent screenshot analyses.
 * For now, this is demo data. Later it can be backed by DB/OCR pipelines.
 *
 * @returns {Promise<Array>} List of screenshot analysis records
 */
async function listScreenshotAnalyses() {
  const now = new Date();

  return [
    {
      id: "demo-1",
      type: "snail_city", // or "club_power", "inventory", etc.
      status: "parsed",   // "parsed" | "pending" | "error"
      description: "Supersnail city overview",
      source: "upload",   // "upload" | "discord" | "manual"
      fileName: "city-overview-1.png",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
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
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      details: null,
    },
    {
      id: "demo-3",
      type: "snail_stats",
      status: "error",
      description: "Supersnail stat page (parse failed)",
      source: "upload",
      fileName: "snail-stats-failed.png",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      details: { error: "Text too blurry" },
    },
    {
      id: "demo-4",
      type: "inventory",
      status: "parsed",
      description: "Resource inventory check",
      source: "upload",
      fileName: "inventory-scan.png",
      createdAt: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
      updatedAt: new Date(now.getTime() - 3600000).toISOString(),
      details: {
        resources: {
          gems: 15420,
          coins: 892000,
          tickets: 37,
        },
      },
    },
    {
      id: "demo-5",
      type: "club_power",
      status: "parsed",
      description: "Previous week club power comparison",
      source: "discord",
      fileName: "club-power-week-43.png",
      createdAt: new Date(now.getTime() - 7 * 24 * 3600000).toISOString(), // 1 week ago
      updatedAt: new Date(now.getTime() - 7 * 24 * 3600000).toISOString(),
      details: {
        totalPower: 4285000,
        members: 45,
        rank: 12,
      },
    },
  ];
}

module.exports = {
  listScreenshotAnalyses,
};
