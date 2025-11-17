"use strict";

const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");
const database = require("../lib/database");
const { saveUploadedScreenshot } = require("../lib/fileStorage");
const { analyzeScreenshot, isValidImageFormat } = require("../lib/visionAnalysis");

const router = express.Router();

// Configure multer for in-memory file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1, // Single file upload
  },
  fileFilter: (_req, file, cb) => {
    if (isValidImageFormat(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid image format. Supported: JPG, PNG, GIF, WEBP"));
    }
  },
});

/**
 * POST /api/screenshot/upload
 * Upload a club screenshot and optionally analyze it with GPT-4 Vision
 *
 * Body (multipart/form-data):
 * - file: Image file (required)
 * - guildId: Guild/server ID (required)
 * - uploaderUserId: User ID of uploader (optional)
 * - autoAnalyze: Whether to automatically analyze (default: true)
 */
router.post("/upload", requireAuth, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "file_too_large", message: "File size exceeds 10MB limit" });
      }
      return res.status(400).json({ error: "upload_failed", message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    // Validate required fields
    const { guildId, uploaderUserId, autoAnalyze = "true" } = req.body;

    if (!guildId) {
      return res.status(400).json({ error: "missing_guild_id", message: "guildId is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "missing_file", message: "No file uploaded" });
    }

    // Verify guild exists
    const prisma = database.getClient();
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
    });

    if (!guild) {
      return res.status(404).json({ error: "guild_not_found", message: "Guild not found" });
    }

    // Verify uploader exists if provided
    if (uploaderUserId) {
      const uploader = await prisma.user.findUnique({
        where: { id: uploaderUserId },
      });

      if (!uploader) {
        return res.status(404).json({ error: "user_not_found", message: "Uploader user not found" });
      }
    }

    // Save file to disk
    const { storagePath } = await saveUploadedScreenshot(
      req.file.buffer,
      req.file.originalname
    );

    // Create screenshot record in database
    const screenshot = await prisma.clubScreenshot.create({
      data: {
        guildId,
        uploaderUserId: uploaderUserId || null,
        originalFilename: req.file.originalname,
        storagePath,
      },
    });

    // Optionally run analysis
    let analysis = null;
    if (autoAnalyze === "true" || autoAnalyze === true) {
      try {
        const analysisResult = await analyzeScreenshot(storagePath, { guildId });

        // Use the authenticated user's ID, or the uploader's ID, or null
        const analysisUserId = req.user?.id || uploaderUserId || null;

        if (analysisUserId) {
          analysis = await prisma.clubScreenshotAnalysis.create({
            data: {
              screenshotId: screenshot.id,
              userId: analysisUserId,
              model: process.env.VISION_MODEL || "gpt-4-vision-preview",
              rawResponse: analysisResult.rawResponse,
              summary: analysisResult.summary,
            },
          });
        } else {
          // If no user ID available, just return the analysis without saving
          analysis = {
            summary: analysisResult.summary,
            rawResponse: analysisResult.rawResponse,
            saved: false,
          };
        }
      } catch (analysisError) {
        console.error("[screenshot] Analysis failed:", analysisError);
        // Don't fail the upload if analysis fails
        analysis = {
          error: "analysis_failed",
          message: analysisError.message,
        };
      }
    }

    res.json({
      ok: true,
      screenshot: {
        id: screenshot.id,
        guildId: screenshot.guildId,
        uploaderUserId: screenshot.uploaderUserId,
        originalFilename: screenshot.originalFilename,
        storagePath: screenshot.storagePath,
        createdAt: screenshot.createdAt,
      },
      analysis: analysis ? {
        id: analysis.id || null,
        summary: analysis.summary,
        model: analysis.model || null,
        saved: analysis.saved !== false,
      } : null,
    });
  } catch (error) {
    console.error("[screenshot] Upload failed:", error);
    res.status(500).json({
      error: "upload_failed",
      message: error.message || "An error occurred during upload"
    });
  }
});

/**
 * GET /api/screenshot/:id
 * Get screenshot metadata and analysis results
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const screenshotId = parseInt(req.params.id, 10);

    if (isNaN(screenshotId)) {
      return res.status(400).json({ error: "invalid_id", message: "Screenshot ID must be a number" });
    }

    const prisma = database.getClient();
    const screenshot = await prisma.clubScreenshot.findUnique({
      where: { id: screenshotId },
      include: {
        guild: {
          select: {
            id: true,
            discordId: true,
            name: true,
          },
        },
        uploader: {
          select: {
            id: true,
            discordId: true,
            username: true,
            globalName: true,
          },
        },
        analyses: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                globalName: true,
              },
            },
          },
        },
      },
    });

    if (!screenshot) {
      return res.status(404).json({ error: "not_found", message: "Screenshot not found" });
    }

    res.json({
      ok: true,
      screenshot,
    });
  } catch (error) {
    console.error("[screenshot] Fetch failed:", error);
    res.status(500).json({
      error: "fetch_failed",
      message: error.message || "An error occurred"
    });
  }
});

/**
 * GET /api/screenshot/guild/:guildId
 * List screenshots for a guild
 */
router.get("/guild/:guildId", requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;

    const prisma = database.getClient();
    const [screenshots, total] = await Promise.all([
      prisma.clubScreenshot.findMany({
        where: { guildId },
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              globalName: true,
            },
          },
          analyses: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1, // Just get the latest analysis
            select: {
              id: true,
              summary: true,
              model: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.clubScreenshot.count({
        where: { guildId },
      }),
    ]);

    res.json({
      ok: true,
      screenshots,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + screenshots.length < total,
      },
    });
  } catch (error) {
    console.error("[screenshot] List failed:", error);
    res.status(500).json({
      error: "list_failed",
      message: error.message || "An error occurred"
    });
  }
});

module.exports = router;
