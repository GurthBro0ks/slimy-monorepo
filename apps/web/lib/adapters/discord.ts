/**
 * Discord Adapter
 * Fetches codes from the official Super Snail Discord channel
 */

import { Code, SourceMetadata } from "../types/codes";

const CHANNEL_ID = "1118010099974287370";
const TRUST_WEIGHT = 0.9;

interface DiscordMessage {
  id: string;
  content: string;
  timestamp: string;
  pinned?: boolean;
}

/**
 * Extract codes from Discord message content
 */
function extractCodesFromMessage(message: DiscordMessage): Code[] {
  const codes: Code[] = [];
  const codePattern = /\b[A-Z0-9]{4,}(?:-[A-Z0-9]{3,}){0,3}\b/g;
  
  const matches = message.content.match(codePattern);
  if (!matches) return codes;

  for (const match of matches) {
    // Filter out common false positives
    if (
      match.includes("CODE") ||
      match.includes("SOURCE") ||
      match.includes("QR")
    ) {
      continue;
    }

    codes.push({
      code: match.toUpperCase(),
      title: undefined,
      description: message.content.substring(0, 200),
      rewards: [],
      region: "global",
      expires_at: null,
      first_seen_at: message.timestamp,
      last_seen_at: message.timestamp,
      sources: [
        {
          site: "discord",
          url: `https://discord.com/channels/@me/${CHANNEL_ID}/${message.id}`,
          post_id: message.id,
          confidence: TRUST_WEIGHT,
          fetched_at: new Date().toISOString(),
        },
      ],
      verified: false,
      tags: message.pinned ? ["pinned"] : [],
    });
  }

  return codes;
}

/**
 * Fetch codes from Discord channel
 */
export async function fetchDiscordCodes(): Promise<{
  codes: Code[];
  metadata: SourceMetadata;
}> {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.warn("Discord credentials not configured");
    return {
      codes: [],
      metadata: {
        source: "discord",
        status: "not_configured",
        lastFetch: new Date().toISOString(),
        itemCount: 0,
        error: "Missing DISCORD_TOKEN or DISCORD_CLIENT_ID",
      },
    };
  }

  try {
    // Fetch recent messages from the channel
    const response = await fetch(
      `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages?limit=100`,
      {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 600 }, // Cache for 10 minutes
      }
    );

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      console.warn(`Discord rate limited. Retry after: ${retryAfter}s`);
      return {
        codes: [],
        metadata: {
          source: "discord",
          status: "degraded",
          lastFetch: new Date().toISOString(),
          itemCount: 0,
          error: `Rate limited. Retry after ${retryAfter}s`,
        },
      };
    }

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    const messages: DiscordMessage[] = await response.json();
    
    // Extract codes from all messages
    const allCodes: Code[] = [];
    for (const message of messages) {
      const extracted = extractCodesFromMessage(message);
      allCodes.push(...extracted);
    }

    return {
      codes: allCodes,
      metadata: {
        source: "discord",
        status: "ok",
        lastFetch: new Date().toISOString(),
        itemCount: allCodes.length,
      },
    };
  } catch (error) {
    console.error("Failed to fetch Discord codes:", error);
    return {
      codes: [],
      metadata: {
        source: "discord",
        status: "failed",
        lastFetch: new Date().toISOString(),
        itemCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
