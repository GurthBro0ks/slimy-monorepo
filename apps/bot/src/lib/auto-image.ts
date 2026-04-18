/**
 * Auto image reply when user asks to generate an image.
 * Ported from /opt/slimy/app/lib/auto-image.js
 */

import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  Message,
} from "discord.js";
import { detectImageIntent } from "./image-intent.js";
import { generateImage } from "./images.js";

const AUTO_IMAGE_SIZE = process.env.AUTO_IMAGE_SIZE || "1024x1024";

async function maybeReplyWithImage({
  interaction,
  message,
  prompt,
  rating = "default",
}: {
  interaction?: ChatInputCommandInteraction;
  message?: Message;
  prompt: string;
  rating?: string;
}): Promise<boolean> {
  const isInteraction = Boolean(interaction);
  if (!prompt || !detectImageIntent(prompt)) return false;
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[auto-image] OPENAI_API_KEY missing - image generation skipped");
    return false;
  }

  const size = AUTO_IMAGE_SIZE;
  let finalPrompt = prompt;

  if (rating === "rated" || rating === "pg13") {
    finalPrompt = `${prompt}\n\nContent guidelines: Keep imagery appropriate for ages 13+; avoid explicit content.`;
  } else if (rating === "unrated") {
    finalPrompt = prompt;
  } else {
    finalPrompt = `${prompt}\n\nContent guidelines: Keep imagery appropriate for a general audience.`;
  }

  let buffer: Buffer;
  try {
    console.log(
      `[auto-image] Generating image: "${prompt.substring(0, 50)}..." (rating: ${rating})`,
    );
    buffer = await generateImage({ prompt: finalPrompt, size });
    console.log("[auto-image] Image generated successfully");
  } catch (err) {
    console.error("[auto-image] Generation failed:", (err as Error).message);
    const msg = err instanceof Error ? err.message : "Image generation failed.";
    const suggestions: Record<string, string> = {
      unrated:
        "Colorful arcade-style frog hero racing atop a turbo snail, bold lighting, comic panel framing.",
      pg13: "Cheerful cartoon frog adventurer riding a giant snail under neon lights, playful indie-game vibe.",
      default:
        "Friendly frog explorer on a giant snail in a bright indie-game scene, whimsical and upbeat.",
    };
    const fallbackPrompt = suggestions[rating] || suggestions["default"];
    const payload = {
      content: `⚠️ Unable to generate that image automatically (safety filter). Try a safer prompt such as:\n\`${fallbackPrompt}\`\n(${msg})`,
    };
    if (isInteraction && interaction) {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
      } else {
        await interaction.reply(payload);
      }
    } else if (message) {
      await message.reply(payload).catch(() => {});
    }
    return true;
  }

  const file = new AttachmentBuilder(buffer, {
    name: `slimy-auto-image-${Date.now()}.png`,
  });

  const safePrompt = prompt.length > 1800 ? `${prompt.slice(0, 1797)}…` : prompt;
  const responsePayload = {
    content: `🖼️ Prompt: ${safePrompt}`,
    files: [file],
  };

  if (isInteraction && interaction) {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(responsePayload);
    } else {
      await interaction.reply(responsePayload);
    }
  } else if (message) {
    await message.reply(responsePayload);
  }

  return true;
}

export { maybeReplyWithImage };
