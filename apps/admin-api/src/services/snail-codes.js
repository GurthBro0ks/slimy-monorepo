"use strict";

/**
 * Snail Codes Service
 *
 * Provides snail codes data for the web application.
 * This service can be extended to:
 * - Fetch from external scrapers/aggregators
 * - Query from database
 * - Integrate with real-time code discovery systems
 *
 * For now, returns demo/placeholder data with the correct structure.
 */

/**
 * Get list of snail codes
 *
 * @returns {Promise<Array<SnailCode>>} List of snail codes
 */
async function listSnailCodes() {
  // TODO: Replace with real data source (database, scraper aggregator, etc.)
  // For now, returning demo data with varied sources and statuses

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return [
    {
      id: "demo-1",
      code: "SNAIL2025",
      source: "snelp",
      status: "active",
      title: "Launch bonus code",
      foundAt: lastWeek.toISOString(),
      expiresAt: null,
    },
    {
      id: "demo-2",
      code: "WINTER2024",
      source: "reddit",
      status: "active",
      title: "Winter event code",
      foundAt: yesterday.toISOString(),
      expiresAt: nextMonth.toISOString(),
    },
    {
      id: "demo-3",
      code: "DISCORD500K",
      source: "discord",
      status: "active",
      title: "500K Discord members celebration",
      foundAt: lastWeek.toISOString(),
      expiresAt: nextWeek.toISOString(),
    },
    {
      id: "demo-4",
      code: "FREEGEMS100",
      source: "twitter",
      status: "expired",
      title: "Twitter giveaway",
      foundAt: new Date("2024-11-01").toISOString(),
      expiresAt: new Date("2024-11-15").toISOString(),
    },
    {
      id: "demo-5",
      code: "HALLOWEEN2024",
      source: "snelp",
      status: "expired",
      title: "Halloween special",
      foundAt: new Date("2024-10-20").toISOString(),
      expiresAt: new Date("2024-11-01").toISOString(),
    },
    {
      id: "demo-6",
      code: "TESTCODE123",
      source: "other",
      status: "unknown",
      title: "Community submitted code",
      foundAt: yesterday.toISOString(),
      expiresAt: null,
    },
    {
      id: "demo-7",
      code: "REDDITLAUNCH",
      source: "reddit",
      status: "active",
      title: "Reddit community launch",
      foundAt: new Date("2024-11-10").toISOString(),
      expiresAt: null,
    },
    {
      id: "demo-8",
      code: "SNELPBONUS",
      source: "snelp",
      status: "active",
      title: "Snelp exclusive bonus",
      foundAt: yesterday.toISOString(),
      expiresAt: nextMonth.toISOString(),
    },
  ];
}

module.exports = {
  listSnailCodes,
};
