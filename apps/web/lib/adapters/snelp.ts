/**
 * Snelp Adapter
 * Scrapes codes from Snelp.com using Firecrawl API
 */

import { Code, SourceMetadata } from "../types/codes";

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
 */
export async function fetchSnelpCodes(): Promise<{
  codes: Code[];
  metadata: SourceMetadata;
}> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    console.warn("Firecrawl API key not configured");
    return {
      codes: [],
      metadata: {
        source: "snelp",
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
        url: SNELP_URL,
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
          source: "snelp",
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
      throw new Error("Failed to scrape Snelp");
    }

    const codes = extractCodesFromMarkdown(data.data.markdown);

    return {
      codes,
      metadata: {
        source: "snelp",
        status: "ok",
        lastFetch: new Date().toISOString(),
        itemCount: codes.length,
      },
    };
  } catch (error) {
    console.error("Failed to fetch Snelp codes:", error);
    return {
      codes: [],
      metadata: {
        source: "snelp",
        status: "failed",
        lastFetch: new Date().toISOString(),
        itemCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
