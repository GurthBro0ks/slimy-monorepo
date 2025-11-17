"use strict";

const express = require("express");
const router = express.Router();
const { apiHandler } = require("../lib/errors");
const database = require("../lib/database");

/**
 * POST /api/slimecraft/backups
 *
 * Create a manual backup log entry.
 * This is used by operators to record when backups are performed.
 *
 * Body: { label?, sizeMb?, notes?, triggeredBy? }
 */
router.post("/", apiHandler(async (req, res) => {
  const { label, sizeMb, notes, triggeredBy } = req.body;

  const prisma = database.getClient();
  const backup = await prisma.slimecraftBackup.create({
    data: {
      label: label || null,
      sizeMb: sizeMb ? parseInt(sizeMb) : null,
      notes: notes || null,
      triggeredBy: triggeredBy || req.user?.discordId || 'manual'
    }
  });

  return {
    ok: true,
    backup: {
      id: backup.id,
      label: backup.label,
      createdAt: backup.createdAt,
      sizeMb: backup.sizeMb,
      notes: backup.notes,
      triggeredBy: backup.triggeredBy
    }
  };
}, { routeName: "slimecraft-backups/create" }));

/**
 * GET /api/slimecraft/backups?limit=50
 *
 * Returns recent backups ordered by createdAt DESC.
 */
router.get("/", apiHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);

  const prisma = database.getClient();
  const backups = await prisma.slimecraftBackup.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  });

  return {
    ok: true,
    count: backups.length,
    limit,
    backups
  };
}, { routeName: "slimecraft-backups/list" }));

module.exports = router;
