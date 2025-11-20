"use strict";

const express = require("express");
const { z } = require("zod");

const { requireAuth } = require("../middleware/auth");
const { requireGuildAccess } = require("../middleware/rbac");
const { validateBody, validateQuery } = require("../middleware/validate");
const seasonService = require("../services/seasons/seasonService");
const aggregationService = require("../services/seasons/aggregation");

const router = express.Router();

// Validation schemas
const createSeasonSchema = z.object({
  guildId: z.string().min(1),
  name: z.string().min(1).max(100),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
});

const updateSeasonSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  isActive: z.boolean().optional(),
});

const seasonsQuerySchema = z.object({
  guildId: z.string().min(1),
});

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * GET /api/seasons
 * List all seasons for a guild
 */
router.get(
  "/",
  validateQuery(seasonsQuerySchema),
  async (req, res, next) => {
    try {
      const { guildId } = req.query;

      // Check if user has access to this guild
      const hasAccess = req.user.guilds?.some(g => g.id === guildId || g.discordId === guildId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this guild" });
      }

      const seasons = await seasonService.listSeasonsForGuild(guildId);

      res.json({
        seasons,
        total: seasons.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/seasons/current
 * Get the currently active season for a guild
 */
router.get(
  "/current",
  validateQuery(seasonsQuerySchema),
  async (req, res, next) => {
    try {
      const { guildId } = req.query;

      // Check if user has access to this guild
      const hasAccess = req.user.guilds?.some(g => g.id === guildId || g.discordId === guildId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this guild" });
      }

      const season = await seasonService.getCurrentSeason(guildId);

      if (!season) {
        return res.json({
          message: "No active season found",
          season: null,
        });
      }

      // Convert BigInt to string for JSON serialization
      const seasonWithStats = {
        ...season,
        memberStats: season.memberStats.map(stat => ({
          ...stat,
          totalPowerGain: stat.totalPowerGain.toString(),
        })),
      };

      res.json({
        season: seasonWithStats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/seasons/:id
 * Get a specific season by ID
 */
router.get(
  "/:id",
  async (req, res, next) => {
    try {
      const seasonId = parseInt(req.params.id);

      if (isNaN(seasonId)) {
        return res.status(400).json({ error: "Invalid season ID" });
      }

      const season = await seasonService.getSeasonById(seasonId);

      // Check if user has access to this guild
      const hasAccess = req.user.guilds?.some(
        g => g.id === season.guildId || g.discordId === season.guildId
      );
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this guild" });
      }

      // Convert BigInt to string for JSON serialization
      const seasonWithStats = {
        ...season,
        memberStats: season.memberStats.map(stat => ({
          ...stat,
          totalPowerGain: stat.totalPowerGain.toString(),
        })),
      };

      res.json({ season: seasonWithStats });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/seasons
 * Create a new season
 */
router.post(
  "/",
  validateBody(createSeasonSchema),
  async (req, res, next) => {
    try {
      const { guildId, name, startDate, endDate } = req.body;

      // Check if user has access to this guild
      const hasAccess = req.user.guilds?.some(g => g.id === guildId || g.discordId === guildId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this guild" });
      }

      const season = await seasonService.createSeason(guildId, name, startDate, endDate);

      res.status(201).json({
        season,
        message: "Season created successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/seasons/:id
 * Update a season
 */
router.patch(
  "/:id",
  validateBody(updateSeasonSchema),
  async (req, res, next) => {
    try {
      const seasonId = parseInt(req.params.id);

      if (isNaN(seasonId)) {
        return res.status(400).json({ error: "Invalid season ID" });
      }

      // Get the season to check guild access
      const existingSeason = await seasonService.getSeasonById(seasonId);

      // Check if user has access to this guild
      const hasAccess = req.user.guilds?.some(
        g => g.id === existingSeason.guildId || g.discordId === existingSeason.guildId
      );
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this guild" });
      }

      const season = await seasonService.updateSeason(seasonId, req.body);

      res.json({
        season,
        message: "Season updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/seasons/:id/close
 * Close a season (set isActive to false)
 */
router.post(
  "/:id/close",
  async (req, res, next) => {
    try {
      const seasonId = parseInt(req.params.id);

      if (isNaN(seasonId)) {
        return res.status(400).json({ error: "Invalid season ID" });
      }

      // Get the season to check guild access
      const existingSeason = await seasonService.getSeasonById(seasonId);

      // Check if user has access to this guild
      const hasAccess = req.user.guilds?.some(
        g => g.id === existingSeason.guildId || g.discordId === existingSeason.guildId
      );
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this guild" });
      }

      await seasonService.closeSeason(seasonId);

      res.json({
        message: "Season closed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/seasons/:id/recalculate
 * Recalculate season stats
 */
router.post(
  "/:id/recalculate",
  async (req, res, next) => {
    try {
      const seasonId = parseInt(req.params.id);

      if (isNaN(seasonId)) {
        return res.status(400).json({ error: "Invalid season ID" });
      }

      // Get the season to check guild access
      const existingSeason = await seasonService.getSeasonById(seasonId);

      // Check if user has access to this guild
      const hasAccess = req.user.guilds?.some(
        g => g.id === existingSeason.guildId || g.discordId === existingSeason.guildId
      );
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this guild" });
      }

      await aggregationService.recalculateSeasonStats(seasonId);

      res.json({
        message: "Season stats recalculated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/seasons/:id/top-performers
 * Get top performers for a season
 */
router.get(
  "/:id/top-performers",
  async (req, res, next) => {
    try {
      const seasonId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit) || 10;

      if (isNaN(seasonId)) {
        return res.status(400).json({ error: "Invalid season ID" });
      }

      // Get the season to check guild access
      const existingSeason = await seasonService.getSeasonById(seasonId);

      // Check if user has access to this guild
      const hasAccess = req.user.guilds?.some(
        g => g.id === existingSeason.guildId || g.discordId === existingSeason.guildId
      );
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this guild" });
      }

      const topPerformers = await aggregationService.getTopPerformers(seasonId, limit);

      // Convert BigInt to string for JSON serialization
      const performers = topPerformers.map(stat => ({
        ...stat,
        totalPowerGain: stat.totalPowerGain.toString(),
      }));

      res.json({
        topPerformers: performers,
        count: performers.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/seasons/:id
 * Delete a season
 */
router.delete(
  "/:id",
  async (req, res, next) => {
    try {
      const seasonId = parseInt(req.params.id);

      if (isNaN(seasonId)) {
        return res.status(400).json({ error: "Invalid season ID" });
      }

      // Get the season to check guild access
      const existingSeason = await seasonService.getSeasonById(seasonId);

      // Check if user has access to this guild
      const hasAccess = req.user.guilds?.some(
        g => g.id === existingSeason.guildId || g.discordId === existingSeason.guildId
      );
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this guild" });
      }

      await seasonService.deleteSeason(seasonId);

      res.json({
        message: "Season deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
