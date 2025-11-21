"use strict";

const express = require("express");
const { z } = require("zod");
const { requireRole, requireGuildMember } = require("../middleware/auth");
const { requireCsrf } = require("../middleware/csrf");
const database = require("../lib/database");

const router = express.Router();

// Validation schemas
const CreateAnalysisSchema = z.object({
  guildId: z.string().min(1),
  title: z.string().optional(),
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  images: z.array(z.object({
    imageUrl: z.string().url(),
    originalName: z.string(),
    fileSize: z.number().int().positive(),
  })).optional(),
  metrics: z.array(z.object({
    name: z.string().min(1),
    value: z.any(),
    unit: z.string().optional(),
    category: z.string().min(1),
  })).optional(),
});

// POST /api/club-analytics/analysis - Create new analysis
router.post(
  "/analysis",
  requireCsrf,
  requireRole("admin"),
  express.json(),
  async (req, res) => {
    try {
      const parsed = CreateAnalysisSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "invalid_input",
          details: parsed.error.issues,
        });
      }

      const { guildId, title, summary, confidence, images, metrics } = parsed.data;

      // Verify user has access to this guild
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "unauthorized" });
      }

      const prisma = database.getClient();

      // Create analysis with related data
      const analysis = await prisma.clubAnalysis.create({
        data: {
          guildId,
          userId: user.id,
          title: title || null,
          summary,
          confidence,
          images: images ? {
            create: images.map(img => ({
              imageUrl: img.imageUrl,
              originalName: img.originalName,
              fileSize: img.fileSize,
            })),
          } : undefined,
          metrics: metrics ? {
            create: metrics.map(m => ({
              name: m.name,
              value: m.value,
              unit: m.unit || null,
              category: m.category,
            })),
          } : undefined,
        },
        include: {
          images: true,
          metrics: true,
        },
      });

      res.status(201).json({ ok: true, analysis });
    } catch (err) {
      console.error("[club-analytics POST] failed", err);
      res.status(500).json({ error: "server_error" });
    }
  }
);

// GET /api/club-analytics/analyses - List all analyses
router.get(
  "/analyses",
  requireRole("club"),
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "unauthorized" });
      }

      const prisma = database.getClient();

      // Optional filtering by guildId
      const { guildId } = req.query;
      const where = guildId ? { guildId } : {};

      const analyses = await prisma.clubAnalysis.findMany({
        where,
        include: {
          images: true,
          metrics: true,
          guild: {
            select: {
              id: true,
              name: true,
              discordId: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50, // Limit to recent 50
      });

      res.json({ ok: true, analyses, count: analyses.length });
    } catch (err) {
      console.error("[club-analytics GET] failed", err);
      res.status(500).json({ error: "server_error" });
    }
  }
);

// GET /api/club-analytics/analyses/:id - Get single analysis
router.get(
  "/analyses/:id",
  requireRole("club"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const prisma = database.getClient();

      const analysis = await prisma.clubAnalysis.findUnique({
        where: { id },
        include: {
          images: true,
          metrics: true,
          guild: {
            select: {
              id: true,
              name: true,
              discordId: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      if (!analysis) {
        return res.status(404).json({ error: "not_found" });
      }

      res.json({ ok: true, analysis });
    } catch (err) {
      console.error("[club-analytics GET :id] failed", err);
      res.status(500).json({ error: "server_error" });
    }
  }
);

module.exports = router;
