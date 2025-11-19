/**
 * Example: Guild Routes using Result type pattern
 *
 * This demonstrates how to use the refactored GuildService
 * with the new Result type for cleaner error handling
 */

"use strict";

const express = require("express");
const guildService = require("../services/guild.service");

const router = express.Router();

/**
 * Example: Get guild by ID with Result type handling
 *
 * BEFORE (throwing errors):
 *
 * router.get("/:id", async (req, res, next) => {
 *   try {
 *     const guild = await guildService.getGuildById(req.params.id);
 *     res.json(guild);
 *   } catch (err) {
 *     next(err);
 *   }
 * });
 *
 * AFTER (Result type):
 */
router.get("/:id", async (req, res) => {
  const result = await guildService.getGuildById(req.params.id);

  if (!result.ok) {
    // Handle error explicitly with proper status codes
    if (result.error.message === "Guild not found") {
      return res.status(404).json({
        error: "not-found",
        message: result.error.message,
      });
    }

    // Database or other errors
    return res.status(500).json({
      error: "internal-error",
      message: "Failed to fetch guild",
    });
  }

  // Success case - result.data contains the guild
  res.json(result.data);
});

/**
 * Example: Get guild by Discord ID with Result type handling
 */
router.get("/discord/:discordId", async (req, res) => {
  const result = await guildService.getGuildByDiscordId(req.params.discordId);

  if (!result.ok) {
    const statusCode = result.error.message === "Guild not found" ? 404 : 500;
    return res.status(statusCode).json({
      error: result.error.message === "Guild not found" ? "not-found" : "internal-error",
      message: result.error.message,
    });
  }

  res.json(result.data);
});

/**
 * Example: Chaining operations with Result type
 */
router.post("/:id/clone", async (req, res) => {
  // Get the original guild
  const originalResult = await guildService.getGuildById(req.params.id);

  if (!originalResult.ok) {
    return res.status(404).json({
      error: "source-not-found",
      message: "Original guild not found",
    });
  }

  // Create a new guild based on the original
  try {
    const newGuild = await guildService.createGuild({
      discordId: req.body.newDiscordId,
      name: `${originalResult.data.name} (Clone)`,
      settings: originalResult.data.settings,
    });

    res.status(201).json(newGuild);
  } catch (err) {
    res.status(500).json({
      error: "creation-failed",
      message: err.message,
    });
  }
});

/**
 * Benefits of Result type:
 *
 * 1. Explicit error handling - no hidden exceptions
 * 2. Type-safe - TypeScript knows result.data exists when result.ok is true
 * 3. Better error discrimination - can distinguish between not-found, validation, and database errors
 * 4. No try-catch nesting - cleaner code structure
 * 5. Composable - can chain operations easily
 */

module.exports = router;
