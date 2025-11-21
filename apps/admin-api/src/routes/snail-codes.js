"use strict";

/**
 * Snail Codes Routes
 *
 * Handles snail codes API endpoints for the web application.
 * Provides a global /api/snail/codes endpoint (separate from guild-specific routes).
 *
 * All routes are read-only and idempotent.
 */

const express = require("express");
const { apiHandler } = require("../lib/errors");
const { listSnailCodes } = require("../services/snail-codes");

const router = express.Router();

/**
 * GET /api/snail/codes
 *
 * Get list of snail codes.
 * This is a read-only, idempotent endpoint.
 *
 * Response:
 *   - ok: boolean
 *   - codes: array - Array of code objects with the following shape:
 *     - id: string - Unique identifier
 *     - code: string - The actual code string
 *     - source: string - Source of the code (snelp, reddit, twitter, discord, other)
 *     - status: string - Status of the code (active, expired, unknown)
 *     - title: string (optional) - Human-readable label
 *     - foundAt: string (optional) - ISO timestamp when code was found
 *     - expiresAt: string | null (optional) - ISO timestamp when code expires
 *
 * Errors:
 *   - 500: server_error - Internal server error
 */
router.get("/codes", apiHandler(async (req, res) => {
  try {
    const codes = await listSnailCodes();

    return {
      ok: true,
      codes,
    };
  } catch (error) {
    console.error("[snail-codes/codes] Failed to fetch codes:", error);
    throw error;
  }
}, { routeName: "snail-codes/codes" }));

module.exports = router;
