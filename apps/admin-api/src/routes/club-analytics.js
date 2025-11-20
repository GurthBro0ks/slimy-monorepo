"use strict";

/**
 * Club Analytics Routes
 *
 * Initial scaffolding for Club Analytics v1 - provides endpoints for ingesting,
 * storing, and serving club power analytics data. Feature-flagged and safe:
 * will not break if dependencies are missing.
 */

const express = require("express");
const router = express.Router();
const database = require("../lib/database");
const { apiHandler } = require("../lib/errors");

// Import Google Sheets integration (optional, feature-flagged)
let sheetsClient;
try {
  sheetsClient = require("../../lib/google/sheetsClient");
} catch (err) {
  // Sheets integration not available - this is fine, we'll log when needed
  sheetsClient = null;
}

/**
 * POST /api/club-analytics/snapshot
 *
 * Create a new club snapshot with member power data
 *
 * Body: {
 *   guildId: string,
 *   members: Array<{
 *     memberKey: string,
 *     totalPower: number,
 *     simPower?: number,
 *     rank?: number
 *   }>,
 *   metadata?: any
 * }
 */
router.post("/snapshot", apiHandler(async (req, res) => {
  const { guildId, members = [], metadata } = req.body;

  // Validate input
  if (!guildId) {
    return res.status(400).json({
      error: "missing_guild_id",
      message: "guildId is required"
    });
  }

  if (!Array.isArray(members) || members.length === 0) {
    return res.status(400).json({
      error: "invalid_members",
      message: "members must be a non-empty array"
    });
  }

  // Validate each member has required fields
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (!member.memberKey || member.totalPower === undefined) {
      return res.status(400).json({
        error: "invalid_member_data",
        message: `Member at index ${i} is missing required fields (memberKey, totalPower)`
      });
    }
  }

  const prisma = database.getClient();

  // Create snapshot and member records in a transaction
  const snapshot = await prisma.$transaction(async (tx) => {
    // Create the snapshot
    const snap = await tx.clubSnapshot.create({
      data: {
        guildId,
        metadata: metadata || null,
        capturedAt: new Date(),
      }
    });

    // Create all member snapshots
    const memberData = members.map(m => ({
      snapshotId: snap.id,
      memberKey: m.memberKey,
      totalPower: BigInt(Math.floor(m.totalPower)),
      simPower: m.simPower !== undefined ? BigInt(Math.floor(m.simPower)) : BigInt(0),
      rank: m.rank !== undefined ? m.rank : null,
    }));

    await tx.clubMemberSnapshot.createMany({
      data: memberData
    });

    return snap;
  });

  // Optionally push to Google Sheets (fire-and-forget)
  if (sheetsClient && sheetsClient.isSheetsEnabled()) {
    sheetsClient.pushSnapshotToSheet(snapshot.id)
      .catch(err => {
        console.error('[club-analytics] Failed to push snapshot to Sheets:', err.message);
      });
  }

  return {
    ok: true,
    snapshot: {
      id: snapshot.id,
      guildId: snapshot.guildId,
      capturedAt: snapshot.capturedAt,
      memberCount: members.length
    }
  };
}, { routeName: "club-analytics/snapshot" }));

/**
 * GET /api/club-analytics/latest?guildId=...
 *
 * Get the latest snapshot for a guild with all member data
 */
router.get("/latest", apiHandler(async (req, res) => {
  const guildId = (req.query.guildId || "").toString().trim();

  if (!guildId) {
    return res.status(400).json({
      error: "missing_guild_id",
      message: "guildId query parameter is required"
    });
  }

  const prisma = database.getClient();

  // Find the most recent snapshot for this guild
  const snapshot = await prisma.clubSnapshot.findFirst({
    where: { guildId },
    orderBy: { capturedAt: 'desc' },
    include: {
      members: {
        orderBy: { rank: 'asc' }
      }
    }
  });

  if (!snapshot) {
    return res.status(404).json({
      error: "no_snapshot_found",
      message: `No snapshots found for guild ${guildId}`
    });
  }

  // Convert BigInt to string for JSON serialization
  const members = snapshot.members.map(m => ({
    id: m.id,
    memberKey: m.memberKey,
    totalPower: m.totalPower.toString(),
    simPower: m.simPower.toString(),
    rank: m.rank
  }));

  return {
    ok: true,
    snapshot: {
      id: snapshot.id,
      guildId: snapshot.guildId,
      capturedAt: snapshot.capturedAt,
      metadata: snapshot.metadata,
      memberCount: members.length,
      members
    }
  };
}, { routeName: "club-analytics/latest" }));

/**
 * GET /api/club-analytics/history?guildId=...&limit=10
 *
 * Get historical snapshots for a guild (lightweight, no member details)
 */
router.get("/history", apiHandler(async (req, res) => {
  const guildId = (req.query.guildId || "").toString().trim();
  const limit = Math.min(parseInt(req.query.limit || "10", 10), 50);

  if (!guildId) {
    return res.status(400).json({
      error: "missing_guild_id",
      message: "guildId query parameter is required"
    });
  }

  const prisma = database.getClient();

  // Get recent snapshots with member count
  const snapshots = await prisma.clubSnapshot.findMany({
    where: { guildId },
    orderBy: { capturedAt: 'desc' },
    take: limit,
    include: {
      _count: {
        select: { members: true }
      }
    }
  });

  return {
    ok: true,
    guildId,
    count: snapshots.length,
    snapshots: snapshots.map(s => ({
      id: s.id,
      guildId: s.guildId,
      capturedAt: s.capturedAt,
      metadata: s.metadata,
      memberCount: s._count.members
    }))
  };
}, { routeName: "club-analytics/history" }));

module.exports = router;
