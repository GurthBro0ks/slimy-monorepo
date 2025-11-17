"use strict";

const express = require("express");
const router = express.Router();
const { apiHandler } = require("../lib/errors");
const database = require("../lib/database");

/**
 * POST /api/slimecraft/status-history/poll
 *
 * Internal endpoint to poll Slimecraft bedrock server status and record it.
 * Intended to be called by a cron job or scheduled task.
 *
 * Calls the bedrock status endpoint (configured via SLIMECRAFT_STATUS_INTERNAL_URL),
 * parses the response, and inserts a SlimecraftStatusPing record.
 */
router.post("/poll", apiHandler(async (req, res) => {
  const statusUrl = process.env.SLIMECRAFT_STATUS_INTERNAL_URL;

  if (!statusUrl) {
    return {
      ok: false,
      error: "SLIMECRAFT_STATUS_INTERNAL_URL not configured"
    };
  }

  let statusData = {
    online: false,
    latencyMs: null,
    playerCount: null,
    raw: null
  };

  try {
    // Fetch the bedrock status from the configured endpoint
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add a reasonable timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (response.ok) {
      const data = await response.json();

      // Parse the response based on expected format
      // Adjust this based on actual bedrock status API response structure
      statusData = {
        online: data.online ?? data.status === 'online' ?? false,
        latencyMs: data.latency ?? data.latencyMs ?? data.ping ?? null,
        playerCount: data.players ?? data.playerCount ?? data.playersOnline ?? null,
        raw: data
      };
    } else {
      // Status check endpoint returned error - server likely offline
      statusData.online = false;
      statusData.raw = {
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    // Network error or timeout - server offline or unreachable
    console.error('[slimecraft-status-history] Poll failed:', error.message);
    statusData.online = false;
    statusData.raw = {
      error: error.message,
      type: error.name
    };
  }

  // Insert the status ping into database
  const prisma = database.getClient();
  const ping = await prisma.slimecraftStatusPing.create({
    data: {
      online: statusData.online,
      latencyMs: statusData.latencyMs,
      playerCount: statusData.playerCount,
      raw: statusData.raw
    }
  });

  return {
    ok: true,
    ping: {
      id: ping.id,
      timestamp: ping.timestamp,
      online: ping.online,
      latencyMs: ping.latencyMs,
      playerCount: ping.playerCount
    }
  };
}, { routeName: "slimecraft-status-history/poll" }));

/**
 * GET /api/slimecraft/status-history/recent?limit=100
 *
 * Returns recent status pings ordered by timestamp DESC.
 */
router.get("/recent", apiHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);

  const prisma = database.getClient();
  const pings = await prisma.slimecraftStatusPing.findMany({
    orderBy: {
      timestamp: 'desc'
    },
    take: limit,
    select: {
      id: true,
      timestamp: true,
      online: true,
      latencyMs: true,
      playerCount: true,
      // Exclude raw field by default to reduce payload size
    }
  });

  return {
    ok: true,
    count: pings.length,
    limit,
    pings
  };
}, { routeName: "slimecraft-status-history/recent" }));

module.exports = router;
