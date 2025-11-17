"use strict";

const express = require("express");
const { z } = require("zod");
const { PrismaClient } = require("@prisma/client");

const { requireAuth } = require("../middleware/auth");
const { validateBody, validateQuery } = require("../middleware/validate");

const prisma = new PrismaClient();
const router = express.Router();

// Validation schemas
const playerStatsSchema = z.object({
  minecraftName: z.string().min(1).max(16),
  playTime: z.number().int().nonnegative().optional(),
  deaths: z.number().int().nonnegative().optional(),
  mobsKilled: z.number().int().nonnegative().optional(),
  blocksBroken: z.number().int().nonnegative().optional(),
  blocksPlaced: z.number().int().nonnegative().optional(),
});

const importStatsSchema = z.object({
  snapshotDate: z.string().datetime().optional(),
  players: z.array(playerStatsSchema).min(1),
});

const leaderboardQuerySchema = z.object({
  metric: z.enum(["playTime", "deaths", "mobsKilled", "blocksBroken", "blocksPlaced"]).optional(),
  limit: z.string().optional(),
});

// POST /api/slimecraft/player-stats/import - Import player stats
router.post(
  "/import",
  requireAuth,
  validateBody(importStatsSchema),
  async (req, res, next) => {
    try {
      const { snapshotDate, players } = req.body;
      const snapshot = snapshotDate ? new Date(snapshotDate) : new Date();

      const results = [];

      // Process each player
      for (const playerData of players) {
        const { minecraftName, playTime, deaths, mobsKilled, blocksBroken, blocksPlaced } = playerData;

        // Upsert player
        const player = await prisma.slimecraftPlayer.upsert({
          where: { minecraftName },
          update: {},
          create: { minecraftName },
        });

        // Create stat snapshot
        const stat = await prisma.slimecraftPlayerStat.create({
          data: {
            playerId: player.id,
            snapshotDate: snapshot,
            playTime,
            deaths,
            mobsKilled,
            blocksBroken,
            blocksPlaced,
          },
        });

        results.push({
          player: player.minecraftName,
          statId: stat.id,
        });
      }

      res.json({
        success: true,
        imported: results.length,
        results,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/slimecraft/player-stats/leaderboard - Get leaderboard
router.get(
  "/leaderboard",
  validateQuery(leaderboardQuerySchema),
  async (req, res, next) => {
    try {
      const metric = req.query.metric || "playTime";
      const limit = parseInt(req.query.limit || "20", 10);

      // Get all players with their latest stats
      const players = await prisma.slimecraftPlayer.findMany({
        where: { isActive: true },
        include: {
          stats: {
            orderBy: { snapshotDate: "desc" },
            take: 1,
          },
        },
      });

      // Map to leaderboard format
      const leaderboard = players
        .map((player) => {
          const latestStat = player.stats[0];
          if (!latestStat) return null;

          return {
            playerId: player.id,
            minecraftName: player.minecraftName,
            discordTag: player.discordTag,
            value: latestStat[metric] || 0,
            snapshotDate: latestStat.snapshotDate,
          };
        })
        .filter((entry) => entry !== null && entry.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);

      res.json({
        metric,
        leaderboard,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
