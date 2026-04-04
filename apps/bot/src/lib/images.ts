/**
 * AI image generation (DALL-E / GLM-Image).
 * Ported from /opt/slimy/app/lib/images.js
 */

import { database } from "./database.js";

function isGLMImageModel(model?: string): boolean {
  return (model || "").toLowerCase().includes("glm-image");
}

async function generateImage({
  prompt,
  size = "1024x1024",
  quality = "standard",
}: {
  prompt: string;
  size?: string;
  quality?: string;
}): Promise<Buffer> {
  const model = process.env.IMAGE_MODEL || "dall-e-3";
  const isGLM = isGLMImageModel(model);

  // For image generation, we use a direct API approach
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const imageUrl = `https://api.openai.com/v1/images/generations`;

  const response = await fetch(imageUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "dall-e-3",
      prompt,
      size,
      response_format: isGLM ? "url" : "b64_json",
      ...(isGLM ? {} : { quality }),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Image API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>;
  };

  if (isGLM) {
    const url = data.data?.[0]?.url;
    if (!url) throw new Error("GLM-Image returned no URL");
    const imgResponse = await globalThis.fetch(url);
    if (!imgResponse.ok)
      throw new Error(`Failed to fetch GLM-Image: ${imgResponse.status}`);
    const buffer = await imgResponse.arrayBuffer();
    return Buffer.from(buffer);
  } else {
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image API returned no content");
    return Buffer.from(b64, "base64");
  }
}

async function logImageGeneration({
  userId,
  guildId,
  channelId,
  prompt,
  enhancedPrompt,
  style,
  rating,
  quality,
  model,
  success,
  errorMessage,
  imageUrl,
}: {
  userId?: string;
  guildId?: string | null;
  channelId?: string | null;
  prompt?: string;
  enhancedPrompt?: string;
  style?: string;
  rating?: string;
  quality?: string;
  model?: string;
  success: boolean;
  errorMessage?: string | null;
  imageUrl?: string | null;
}): Promise<void> {
  if (!database.isConfigured()) return;
  try {
    const pool = database.getPool();
    await pool.query(
      `INSERT INTO image_generation_log
        (user_id, guild_id, channel_id, prompt, enhanced_prompt, style, rating, quality, model, success, error_message, image_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId || null,
        guildId || null,
        channelId || null,
        prompt || null,
        enhancedPrompt || null,
        style || null,
        rating || null,
        quality || null,
        model || null,
        success ? 1 : 0,
        errorMessage || null,
        imageUrl || null,
      ],
    );
  } catch (err) {
    console.error("[images] Failed to log generation:", (err as Error).message);
  }
}

async function generateImageWithSafety({
  prompt,
  originalPrompt,
  styleName: _styleName,
  styleKey,
  dalleStyle: _dalleStyle,
  rating = "default",
  quality = "standard",
  userId,
  guildId = null,
  channelId = null,
}: {
  prompt: string;
  originalPrompt: string;
  styleName?: string;
  styleKey?: string;
  dalleStyle?: string;
  rating?: string;
  quality?: string;
  userId?: string;
  guildId?: string | null;
  channelId?: string | null;
}): Promise<{ success: boolean; buffer?: Buffer; message?: string }> {
  const model = process.env.IMAGE_MODEL || "dall-e-3";

  let finalPrompt = prompt;
  if (rating === "pg13") {
    finalPrompt = `${prompt}\n\nContent guidelines: Keep imagery appropriate for ages 13+; avoid explicit content.`;
  } else if (rating === "unrated") {
    finalPrompt = prompt;
  } else {
    finalPrompt = `${prompt}\n\nContent guidelines: Keep imagery appropriate for a general audience.`;
  }

  try {
    const buffer = await generateImage({
      prompt: finalPrompt,
      size: "1024x1024",
      quality,
    });

    await logImageGeneration({
      userId,
      guildId,
      channelId,
      prompt: originalPrompt,
      enhancedPrompt: prompt,
      style: styleKey,
      rating,
      quality,
      model,
      success: true,
      errorMessage: null,
      imageUrl: null,
    });

    return { success: true, buffer };
  } catch (err) {
    await logImageGeneration({
      userId,
      guildId,
      channelId,
      prompt: originalPrompt,
      enhancedPrompt: prompt,
      style: styleKey,
      rating,
      quality,
      model,
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
      imageUrl: null,
    });

    return {
      success: false,
      message: `❌ Image generation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export { generateImage, generateImageWithSafety };
