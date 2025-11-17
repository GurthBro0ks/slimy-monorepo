"use strict";

const fs = require("fs").promises;
const { getAbsolutePath } = require("./fileStorage");

/**
 * Check if vision analysis is enabled in environment
 * @returns {boolean} True if vision analysis is configured and enabled
 */
function isVisionEnabled() {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  const isEnabled = process.env.VISION_ENABLED === "true";
  return hasApiKey && isEnabled;
}

/**
 * Analyze a screenshot using GPT-4 Vision (or stub if not configured)
 * @param {string} storagePath - Path to the screenshot file
 * @param {object} opts - Options including guildId
 * @param {string} opts.guildId - The guild/server ID
 * @returns {Promise<{summary: string, rawResponse: any}>} Analysis result
 */
async function analyzeScreenshot(storagePath, opts = {}) {
  const { guildId } = opts;

  if (!isVisionEnabled()) {
    // Return stubbed response when vision is not configured
    return {
      summary: "Vision analysis disabled (stubbed).",
      rawResponse: {
        disabled: true,
        message: "OpenAI Vision API is not configured. Set OPENAI_API_KEY and VISION_ENABLED=true to enable.",
      },
    };
  }

  // TODO: Implement actual GPT-4 Vision integration
  // When implementing, follow these steps:
  //
  // 1. Read the image file from storagePath
  //    const absolutePath = getAbsolutePath(storagePath);
  //    const imageBuffer = await fs.readFile(absolutePath);
  //    const base64Image = imageBuffer.toString('base64');
  //
  // 2. Prepare the API request
  //    const apiKey = process.env.OPENAI_API_KEY;
  //    const model = process.env.VISION_MODEL || 'gpt-4-vision-preview';
  //
  // 3. Call OpenAI Vision API
  //    const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //      method: 'POST',
  //      headers: {
  //        'Content-Type': 'application/json',
  //        'Authorization': `Bearer ${apiKey}`,
  //      },
  //      body: JSON.stringify({
  //        model,
  //        messages: [{
  //          role: 'user',
  //          content: [
  //            {
  //              type: 'text',
  //              text: 'Analyze this club/game screenshot and provide insights about metrics, stats, or activity shown.',
  //            },
  //            {
  //              type: 'image_url',
  //              image_url: {
  //                url: `data:image/jpeg;base64,${base64Image}`,
  //              },
  //            },
  //          ],
  //        }],
  //        max_tokens: 500,
  //      }),
  //    });
  //
  // 4. Parse and return the response
  //    const data = await response.json();
  //    const summary = data.choices?.[0]?.message?.content || 'No summary generated';
  //
  //    return {
  //      summary,
  //      rawResponse: data,
  //    };

  // For now, return a mock response when enabled but not yet implemented
  return {
    summary: `Vision analysis enabled but not yet implemented. Guild: ${guildId}, File: ${storagePath}`,
    rawResponse: {
      stub: true,
      message: "Vision API integration pending. See TODO comments in visionAnalysis.js",
      guildId,
      storagePath,
    },
  };
}

/**
 * Validate image file format
 * @param {string} filename - The filename to validate
 * @returns {boolean} True if valid image format
 */
function isValidImageFormat(filename) {
  const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  return validExtensions.includes(ext);
}

module.exports = {
  isVisionEnabled,
  analyzeScreenshot,
  isValidImageFormat,
};
