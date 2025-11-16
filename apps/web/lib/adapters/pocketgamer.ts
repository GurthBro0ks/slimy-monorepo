/**
 * PocketGamer Adapter
 * Scrapes codes from PocketGamer using Firecrawl API
 */

import { Code, SourceMetadata } from "../types/codes";

const POCKETGAMER_URL = "https://www.pocketgamer.com/super-snail/codes/";
const TRUST_WEIGHT = 0.7;

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
  };
  error?: string;
}

/**
 * Extract codes from PocketGamer markdown content
 */
function extractCodesFromMarkdown(markdown: string): Code[] {
  const codes: Code[] = [];
  const codePattern = /\b[A-Z0-9]{4,}(?:-[A-Z0-9]{3,}){0,3}\b/g;
  
  const lines = markdown.split("\n");
  
  for (const line of lines) {
    const matches = line.match(codePattern);
    if (!matches) continue;
    
    for (const match of matches) {
      // Filter out common false positives
      if (
        match.includes("CODE") ||
        match.includes("SOURCE") ||
        match.includes("QR") ||
        match.length < 6
      ) {
        continue;
      }
      
      codes.push({
        code: match.toUpperCase(),
        title: undefined,
        description: line.substring(0, 200),
        rewards: [],
        region: "global",
        expires_at: null,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        sources: [
          {
            site: "pocketgamer",
            url: POCKETGAMER_URL,
            confidence: TRUST_WEIGHT,
            fetched_at: new Date().toISOString(),
          },
        ],
        verified: false,
        tags: ["pocketgamer"],
      });
    }
  }
  
  return codes;
}

/**
 * Fetch codes from PocketGamer using Firecrawl
 */
export async function fetchPocketGamerCodes(): Promise<{
  codes: Code[];
  metadata: SourceMetadata;
}> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    console.warn("Firecrawl API key not configured");
    return {
      codes: [],
      metadata: {
        source: "pocketgamer",
        status: "not_configured",
        lastFetch: new Date().toISOString(),
        itemCount: 0,
        error: "Missing FIRECRAWL_API_KEY",
      },
    };
  }

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: POCKETGAMER_URL,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
      next: { revalidate: 900 }, // Cache for 15 minutes
    });

    if (response.status === 429) {
      console.warn("Firecrawl rate limited");
      return {
        codes: [],
        metadata: {
          source: "pocketgamer",
          status: "degraded",
          lastFetch: new Date().toISOString(),
          itemCount: 0,
          error: "Rate limited",
        },
      };
    }

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    const data: FirecrawlResponse = await response.json();
    
    if (!data.success || !data.data?.markdown) {
      throw new Error("Failed to scrape PocketGamer");
    }

    const codes = extractCodesFromMarkdown(data.data.markdown);

    return {
      codes,
      metadata: {
        source: "pocketgamer",
        status: "ok",
        lastFetch: new Date().toISOString(),
        itemCount: codes.length,
      },
    };
  } catch (error) {
    console.error("Failed to fetch PocketGamer codes:", error);
    return {
      codes: [],
      metadata: {
        source: "pocketgamer",
        status: "failed",
        lastFetch: new Date().toISOString(),
        itemCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
