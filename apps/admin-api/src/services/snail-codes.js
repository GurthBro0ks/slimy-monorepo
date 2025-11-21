"use strict";

/**
 * Snail Codes Service
 *
 * Provides aggregated Super Snail codes from various sources.
 * This is a temporary stub implementation with hardcoded data.
 *
 * TODO: Replace with real aggregator logic that:
 * - Polls/scrapes Snelp wiki, Reddit, Discord, Twitter
 * - Stores codes in database with discovery timestamps
 * - Validates code status (active/expired/unknown)
 * - Provides automatic updates and notifications
 */

/**
 * Temporary hardcoded code list for initial implementation.
 * This should be replaced with database queries or live aggregator data.
 */
const STUB_CODES = [
  {
    code: "SNAIL2025",
    source: "snelp",
    status: "active",
    notes: "New Year 2025 celebration code from Snelp wiki",
    discoveredAt: "2025-01-01T00:00:00.000Z",
    lastCheckedAt: "2025-11-21T09:00:00.000Z",
  },
  {
    code: "SLIMYCLUB",
    source: "reddit",
    status: "active",
    notes: "Community code shared on r/SuperSnail",
    discoveredAt: "2025-11-15T14:30:00.000Z",
    lastCheckedAt: "2025-11-21T08:00:00.000Z",
  },
  {
    code: "DISCORDHYPE",
    source: "discord",
    status: "expired",
    notes: "Discord server exclusive - expired on Nov 18",
    discoveredAt: "2025-11-10T10:00:00.000Z",
    lastCheckedAt: "2025-11-20T12:00:00.000Z",
  },
  {
    code: "TWITTERDROP",
    source: "twitter",
    status: "active",
    notes: "From official Super Snail Twitter account",
    discoveredAt: "2025-11-18T16:45:00.000Z",
    lastCheckedAt: "2025-11-21T07:30:00.000Z",
  },
  {
    code: "COMMUNITY99",
    source: "reddit",
    status: "unknown",
    notes: "Shared by community member, status unverified",
    discoveredAt: "2025-11-20T20:15:00.000Z",
    lastCheckedAt: "2025-11-20T20:15:00.000Z",
  },
  {
    code: "SNELPBONUS",
    source: "snelp",
    status: "active",
    notes: "Bonus code from Snelp community events page",
    discoveredAt: "2025-11-12T11:00:00.000Z",
    lastCheckedAt: "2025-11-21T09:00:00.000Z",
  },
  {
    code: "HALLOWEEN2024",
    source: "other",
    status: "expired",
    notes: "Halloween event code - ended Oct 31",
    discoveredAt: "2024-10-15T00:00:00.000Z",
    lastCheckedAt: "2025-11-01T00:00:00.000Z",
  },
  {
    code: "SECRETSHELL",
    source: "discord",
    status: "active",
    notes: "Hidden code found in Discord treasure hunt",
    discoveredAt: "2025-11-19T13:20:00.000Z",
    lastCheckedAt: "2025-11-21T08:45:00.000Z",
  },
];

/**
 * List all snail codes with optional filtering.
 *
 * @param {Object} filters - Optional filters
 * @param {string} [filters.source] - Filter by source (snelp, reddit, discord, twitter, other)
 * @param {string} [filters.status] - Filter by status (active, expired, unknown)
 * @returns {Promise<Array>} Array of code objects
 */
async function listSnailCodes(filters = {}) {
  // TODO: Replace with real database query or aggregator API call
  // For now, filter the stub data

  let codes = [...STUB_CODES];

  if (filters.source) {
    codes = codes.filter(code => code.source === filters.source);
  }

  if (filters.status) {
    codes = codes.filter(code => code.status === filters.status);
  }

  return codes;
}

module.exports = {
  listSnailCodes,
};
