"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const database = require("../lib/database");

const router = express.Router();

/**
 * GET /api/saved-prompts
 * Get all saved prompts for the current user
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const prisma = database.getClient();
    const prompts = await prisma.savedPrompt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(prompts);
  } catch (error) {
    console.error("[saved-prompts] Error fetching prompts:", error);
    res.status(500).json({ error: "Failed to fetch saved prompts" });
  }
});

/**
 * POST /api/saved-prompts
 * Create a new saved prompt
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, tags } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        error: "title and content are required",
      });
    }

    // Validate title length
    if (title.length > 200) {
      return res.status(400).json({
        error: "title must be 200 characters or less",
      });
    }

    // Validate tags if provided
    if (tags !== undefined && tags !== null && typeof tags !== "string") {
      return res.status(400).json({
        error: "tags must be a comma-separated string",
      });
    }

    const prisma = database.getClient();
    const prompt = await prisma.savedPrompt.create({
      data: {
        userId,
        title: title.trim(),
        content,
        tags: tags ? tags.trim() : null,
      },
      select: {
        id: true,
        title: true,
        content: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(prompt);
  } catch (error) {
    console.error("[saved-prompts] Error creating prompt:", error);
    res.status(500).json({ error: "Failed to create saved prompt" });
  }
});

/**
 * PATCH /api/saved-prompts/:id
 * Update a saved prompt (if owned by user)
 */
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const promptId = parseInt(req.params.id, 10);

    if (isNaN(promptId)) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }

    const { title, content, tags } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (title !== undefined) {
      if (title.length > 200) {
        return res.status(400).json({
          error: "title must be 200 characters or less",
        });
      }
      updateData.title = title.trim();
    }
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) {
      if (tags !== null && typeof tags !== "string") {
        return res.status(400).json({
          error: "tags must be a comma-separated string or null",
        });
      }
      updateData.tags = tags ? tags.trim() : null;
    }

    // Check if there are any fields to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No valid fields to update",
      });
    }

    const prisma = database.getClient();

    // First check if prompt exists and belongs to user
    const existing = await prisma.savedPrompt.findUnique({
      where: { id: promptId },
      select: { userId: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Prompt not found" });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to update this prompt" });
    }

    // Update the prompt
    const prompt = await prisma.savedPrompt.update({
      where: { id: promptId },
      data: updateData,
      select: {
        id: true,
        title: true,
        content: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(prompt);
  } catch (error) {
    console.error("[saved-prompts] Error updating prompt:", error);

    // Handle Prisma-specific errors
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Prompt not found" });
    }

    res.status(500).json({ error: "Failed to update prompt" });
  }
});

/**
 * DELETE /api/saved-prompts/:id
 * Delete a saved prompt (if owned by user)
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const promptId = parseInt(req.params.id, 10);

    if (isNaN(promptId)) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }

    const prisma = database.getClient();

    // First check if prompt exists and belongs to user
    const existing = await prisma.savedPrompt.findUnique({
      where: { id: promptId },
      select: { userId: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Prompt not found" });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this prompt" });
    }

    // Delete the prompt
    await prisma.savedPrompt.delete({
      where: { id: promptId },
    });

    res.status(204).send();
  } catch (error) {
    console.error("[saved-prompts] Error deleting prompt:", error);

    // Handle Prisma-specific errors
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Prompt not found" });
    }

    res.status(500).json({ error: "Failed to delete prompt" });
  }
});

module.exports = router;
