"use strict";

/**
 * Snail Tier Calculator Routes
 *
 * Handles tier calculation for Super Snail game stats.
 * Provides a simple scoring algorithm that can be upgraded with real spreadsheet logic.
 */

const express = require("express");
const { calculateSnailTier } = require("../services/snail-tier");
const { apiHandler } = require("../lib/errors");

const router = express.Router();

/**
 * POST /api/snail/tier
 *
 * Calculate snail tier based on stats.
 * Public endpoint - no authentication required.
 *
 * Request body:
 *   - level: number (required) - Snail level
 *   - cityLevel: number (required) - City level
 *   - relicPower: number (required) - Relic power
 *   - clubContribution: number (required) - Club contribution
 *
 * Response:
 *   - tier: string - Calculated tier (S+, S, A, B, C, D, F)
 *   - score: number - Calculated score
 *   - summary: string - Human-readable summary
 *   - details: array - Breakdown of inputs and formula
 *
 * Errors:
 *   - 400: missing_fields - Required fields missing
 *   - 400: invalid_input - Non-numeric values provided
 *   - 500: server_error - Internal server error
 */
router.post(
  "/snail/tier",
  express.json(),
  apiHandler(
    async (req, res) => {
      const { level, cityLevel, relicPower, clubContribution } = req.body;

      // Validate required fields
      if (
        level === undefined ||
        cityLevel === undefined ||
        relicPower === undefined ||
        clubContribution === undefined
      ) {
        const error = new Error("missing_fields");
        error.code = "missing_fields";
        throw error;
      }

      // Validate numeric values
      const numLevel = Number(level);
      const numCity = Number(cityLevel);
      const numRelic = Number(relicPower);
      const numClub = Number(clubContribution);

      if (
        isNaN(numLevel) ||
        isNaN(numCity) ||
        isNaN(numRelic) ||
        isNaN(numClub)
      ) {
        const error = new Error("invalid_input");
        error.code = "invalid_input";
        throw error;
      }

      // Calculate tier
      const result = calculateSnailTier({
        level: numLevel,
        cityLevel: numCity,
        relicPower: numRelic,
        clubContribution: numClub,
      });

      return result;
    },
    {
      routeName: "snail/tier",
      errorMapper: (error, req, res) => {
        if (error.code === "missing_fields") {
          res.status(400).json({
            error: "missing_fields",
            message:
              "Required fields: level, cityLevel, relicPower, clubContribution",
          });
          return false; // Don't continue with default error handling
        }
        if (error.code === "invalid_input") {
          res.status(400).json({
            error: "invalid_input",
            message: "All fields must be valid numbers",
          });
          return false;
        }
        // Let default error handling take over
        return null;
      },
    }
  )
);

module.exports = router;
