"use strict";

/**
 * Snail Vision - OpenAI GPT-4 Vision Integration
 *
 * Provides screenshot analysis functionality using OpenAI's Vision API
 * to extract game stats, identify items, and analyze Super Snail screenshots.
 */

const { logger } = require("../src/lib/logger");
const config = require("../src/lib/config");

/**
 * Default system prompt for analyzing Super Snail screenshots
 */
const DEFAULT_SYSTEM_PROMPT = `You are a Super Snail game assistant. Analyze the provided screenshot and extract relevant game information such as:
- Player stats (power, resources, levels)
- Pentagon stats and loadout details
- Active items and equipment
- Visible game state and progress
Be precise with numbers and provide structured data when possible.`;

/**
 * Analyze a screenshot using OpenAI Vision API
 * @param {string} dataUrl - Base64-encoded data URL of the image
 * @param {object} options - Analysis options
 * @param {string} options.prompt - Additional user prompt for context
 * @param {string} options.systemPrompt - System prompt override
 * @param {string} options.model - Model to use (default: gpt-4o-mini)
 * @returns {Promise<object>} Analysis result with content and metadata
 */
async function analyzeSnailDataUrl(dataUrl, options = {}) {
  const startTime = Date.now();

  if (!config.openai.apiKey) {
    logger.error("[snail-vision] OpenAI API key not configured");
    throw new Error("OpenAI API key not configured");
  }

  const {
    prompt = "",
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    model = config.openai.model || "gpt-4o-mini",
  } = options;

  try {
    // Construct messages for Vision API
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: dataUrl,
              detail: "high", // Use high detail for better accuracy
            },
          },
        ],
      },
    ];

    // Add user prompt if provided
    if (prompt) {
      messages.push({
        role: "user",
        content: prompt,
      });
    }

    // Call OpenAI Vision API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.openai.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.2, // Lower temperature for more consistent extraction
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("[snail-vision] OpenAI API error:", {
        status: response.status,
        error: errorText,
      });
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const usage = data.usage || {};

    const duration = Date.now() - startTime;

    logger.info("[snail-vision] Analysis completed", {
      model,
      duration,
      tokens: usage.total_tokens,
    });

    return {
      content,
      model,
      usage,
      duration,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("[snail-vision] Analysis failed", {
      error: error.message,
      duration,
    });
    throw error;
  }
}

/**
 * Analyze multiple screenshots in batch
 * @param {Array<string>} dataUrls - Array of base64-encoded data URLs
 * @param {object} options - Analysis options
 * @returns {Promise<Array<object>>} Array of analysis results
 */
async function analyzeSnailBatch(dataUrls, options = {}) {
  const results = [];

  for (const dataUrl of dataUrls) {
    try {
      const result = await analyzeSnailDataUrl(dataUrl, options);
      results.push({
        success: true,
        result,
      });
    } catch (error) {
      logger.error("[snail-vision] Batch analysis error:", error);
      results.push({
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

module.exports = {
  analyzeSnailDataUrl,
  analyzeSnailBatch,
  DEFAULT_SYSTEM_PROMPT,
};
