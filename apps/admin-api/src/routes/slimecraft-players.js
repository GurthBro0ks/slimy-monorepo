"use strict";

const express = require("express");
const { z } = require("zod");
const { PrismaClient } = require("@prisma/client");

const { requireAuth } = require("../middleware/auth");
const { validateBody, validateQuery } = require("../middleware/validate");

const prisma = new PrismaClient();
const router = express.Router();

// Validation schemas
const createPlayerSchema = z.object({
  minecraftName: z.string().min(1).max(16),
  discordId: z.string().optional(),
  discordTag: z.string().optional(),
  notes: z.string().optional(),
});

const updatePlayerSchema = z.object({
  discordId: z.string().optional(),
  discordTag: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

const listPlayersQuerySchema = z.object({
  activeOnly: z.string().optional(),
});

// GET /api/slimecraft/players - List all players
router.get(
  "/",
  validateQuery(listPlayersQuerySchema),
  async (req, res, next) => {
    try {
      const activeOnly = req.query.activeOnly === "true";

      const players = await prisma.slimecraftPlayer.findMany({
        where: activeOnly ? { isActive: true } : {},
        orderBy: { joinedAt: "desc" },
        select: {
          id: true,
          minecraftName: true,
          discordId: true,
          discordTag: true,
          joinedAt: true,
          isActive: true,
          notes: true,
        },
      });

      res.json({ players });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/slimecraft/players - Create or update a player
router.post(
  "/",
  requireAuth,
  validateBody(createPlayerSchema),
  async (req, res, next) => {
    try {
      const { minecraftName, discordId, discordTag, notes } = req.body;

      // Upsert player by minecraftName
      const player = await prisma.slimecraftPlayer.upsert({
        where: { minecraftName },
        update: {
          discordId: discordId ?? undefined,
          discordTag: discordTag ?? undefined,
          notes: notes ?? undefined,
        },
        create: {
          minecraftName,
          discordId,
          discordTag,
          notes,
        },
      });

      res.json({ player });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/slimecraft/players/:id - Get player details with stats
router.get("/:id", async (req, res, next) => {
  try {
    const playerId = parseInt(req.params.id, 10);

    if (isNaN(playerId)) {
      return res.status(400).json({ error: "Invalid player ID" });
    }

    const player = await prisma.slimecraftPlayer.findUnique({
      where: { id: playerId },
      include: {
        stats: {
          orderBy: { snapshotDate: "desc" },
          take: 20, // Get last 20 stat snapshots
        },
      },
    });

    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    res.json({ player });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/slimecraft/players/:id - Update player
router.patch(
  "/:id",
  requireAuth,
  validateBody(updatePlayerSchema),
  async (req, res, next) => {
    try {
      const playerId = parseInt(req.params.id, 10);

      if (isNaN(playerId)) {
        return res.status(400).json({ error: "Invalid player ID" });
      }

      const updateData = {};
      if (req.body.discordId !== undefined) updateData.discordId = req.body.discordId;
      if (req.body.discordTag !== undefined) updateData.discordTag = req.body.discordTag;
      if (req.body.notes !== undefined) updateData.notes = req.body.notes;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

      const player = await prisma.slimecraftPlayer.update({
        where: { id: playerId },
        data: updateData,
      });

      res.json({ player });
    } catch (err) {
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Player not found" });
      }
      next(err);
    }
  }
);

module.exports = router;
