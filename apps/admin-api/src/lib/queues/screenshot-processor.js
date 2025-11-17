"use strict";

/**
 * Screenshot Analysis Queue Processor
 *
 * Handles background processing of screenshot analysis jobs using GPT-4 Vision.
 * Processes uploaded screenshots, runs Vision API analysis, and stores results.
 */

const path = require("path");
const fsp = require("fs/promises");
const mime = require("mime-types");
const { analyzeSnailDataUrl } = require("../../../lib/snail-vision");
const { writeJson } = require("../../lib/store");
const { logger } = require("../logger");
const metrics = require("../monitoring/metrics");

/**
 * Process a screenshot analysis job
 * @param {object} data - Job data
 * @param {string} data.guildId - Guild ID
 * @param {string} data.userId - User ID
 * @param {string} data.prompt - Optional user prompt
 * @param {Array} data.files - Array of file information
 * @param {string} data.files[].path - Absolute file path
 * @param {string} data.files[].originalname - Original filename
 * @param {number} data.files[].size - File size in bytes
 * @param {string} data.files[].mimetype - MIME type
 * @param {object} data.uploadedBy - User information
 * @returns {Promise<object>} Processing result
 */
async function processScreenshotAnalysis(data) {
  const startTime = Date.now();
  const { guildId, userId, prompt = "", files = [], uploadedBy } = data;

  logger.info("[screenshot-processor] Processing job", {
    guildId,
    userId,
    fileCount: files.length,
  });

  if (!files || files.length === 0) {
    throw new Error("No files provided for analysis");
  }

  try {
    const analyses = [];

    // Process each file
    for (const file of files) {
      try {
        // Read file and convert to data URL
        const buffer = await fsp.readFile(file.path);
        const mimeType =
          file.mimetype || mime.lookup(file.originalname) || "image/png";
        const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

        // Analyze screenshot using GPT-4 Vision
        const analysis = await analyzeSnailDataUrl(dataUrl, { prompt });

        // Generate public URL for the file
        const publicUrl = `/api/uploads/files/snail/${guildId}/${path.basename(file.path)}`;

        analyses.push({
          file: {
            name: file.originalname,
            storedAs: path.basename(file.path),
            size: file.size,
            mimetype: mimeType,
            url: publicUrl,
          },
          uploadedBy,
          analysis,
        });

        logger.debug("[screenshot-processor] File analyzed", {
          filename: file.originalname,
          duration: analysis.duration,
        });
      } catch (fileError) {
        logger.error("[screenshot-processor] Failed to analyze file", {
          filename: file.originalname,
          error: fileError.message,
        });

        // Add error result for this file
        analyses.push({
          file: {
            name: file.originalname,
            storedAs: path.basename(file.path),
            size: file.size,
            mimetype: file.mimetype,
          },
          uploadedBy,
          error: fileError.message,
          analysis: null,
        });
      }
    }

    // Prepare result payload
    const payload = {
      guildId,
      userId,
      prompt,
      results: analyses,
      uploadedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
    };

    // Save results to storage
    const DATA_ROOT = path.join(process.cwd(), "data", "snail");
    const target = path.join(DATA_ROOT, guildId, userId, "latest.json");
    await writeJson(target, payload);

    // Record metrics
    const successCount = analyses.filter((a) => !a.error).length;
    metrics.recordImages(successCount);

    const duration = Date.now() - startTime;
    logger.info("[screenshot-processor] Job completed", {
      guildId,
      userId,
      fileCount: files.length,
      successCount,
      duration,
    });

    return {
      success: true,
      guildId,
      userId,
      analyzed: successCount,
      total: files.length,
      duration,
      savedAt: payload.uploadedAt,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("[screenshot-processor] Job failed", {
      guildId,
      userId,
      error: error.message,
      duration,
    });

    throw error;
  }
}

module.exports = {
  processScreenshotAnalysis,
};
