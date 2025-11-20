/**
 * Snelp Adapter
 * Scrapes codes from Snelp.com using Firecrawl API
 */

import { Code, SourceMetadata } from "../types/codes";
import { Result } from "../types/common";

const SNELP_URL = "https://snelp.com/codes";
const TRUST_WEIGHT = 0.65;

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
  };
  error?: string;
}

/**
 * Extract codes from Snelp markdown content
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
            site: "snelp",
            url: SNELP_URL,
            confidence: TRUST_WEIGHT,
            fetched_at: new Date().toISOString(),
          },
        ],
        verified: false,
        tags: ["snelp"],
      });
    }
  }
  
  return codes;
}

/**
 * Fetch codes from Snelp using Firecrawl
 * @returns Result containing codes and metadata, or an error
 */
export async function fetchSnelpCodes(): Promise<Result<{
  codes: Code[];
  metadata: SourceMetadata;
}>> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      error: new Error("Missing FIRECRAWL_API_KEY"),
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
        url: SNELP_URL,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
      next: { revalidate: 900 }, // Cache for 15 minutes
    });

    if (response.status === 429) {
      return {
        ok: false,
        error: new Error("Rate limited by Firecrawl API"),
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: new Error(`Firecrawl API error: ${response.status}`),
      };
    }

    const data: FirecrawlResponse = await response.json();

    if (!data.success || !data.data?.markdown) {
      return {
        ok: false,
        error: new Error("Failed to scrape Snelp - invalid response"),
      };
    }

    const codes = extractCodesFromMarkdown(data.data.markdown);

    return {
      ok: true,
      data: {
        codes,
        metadata: {
          source: "snelp",
          status: "ok",
          lastFetch: new Date().toISOString(),
          itemCount: codes.length,
        },
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error : new Error("Unknown error fetching Snelp codes"),
    };
  }
}
