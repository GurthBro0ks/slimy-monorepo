/**
 * Wiki Adapter
 * Scrapes codes from supersnail.wiki.gg using Firecrawl API
 */

import { Code, SourceMetadata } from "../types/codes";

const WIKI_URL = "https://supersnail.wiki.gg/wiki/Snail_codes";
const TRUST_WEIGHT = 1.0;

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
  };
  error?: string;
}

/**
 * Extract codes from Wiki markdown content
 */
function extractCodesFromMarkdown(markdown: string): Code[] {
  const codes: Code[] = [];
  
  // Look for table rows with code pattern
  const lines = markdown.split("\n");
  
  for (const line of lines) {
    // Match table rows: | CODE | Reward | Expires | Region |
    const tableMatch = line.match(/\|\s*([A-Z0-9-]{4,})\s*\|/);
    if (!tableMatch) continue;
    
    const code = tableMatch[1].trim();
    
    // Extract other columns
    const parts = line.split("|").map((p) => p.trim()).filter(Boolean);
    
    codes.push({
      code: code.toUpperCase(),
      title: undefined,
      description: parts[1] || undefined, // Reward column
      rewards: parts[1] ? [parts[1]] : [],
      region: parts[3] || "global",
      expires_at: parseExpiry(parts[2]),
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      sources: [
        {
          site: "wiki",
          url: WIKI_URL,
          confidence: TRUST_WEIGHT,
          fetched_at: new Date().toISOString(),
        },
      ],
      verified: true, // Wiki is high-trust
      tags: ["wiki", "official"],
    });
  }
  
  return codes;
}

/**
 * Parse expiry date from string
 */
function parseExpiry(expiryStr?: string): string | null {
  if (!expiryStr || expiryStr === "-" || expiryStr.toLowerCase() === "none") {
    return null;
  }
  
  try {
    const date = new Date(expiryStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Fetch codes from Wiki using Firecrawl
 */
export async function fetchWikiCodes(): Promise<{
  codes: Code[];
  metadata: SourceMetadata;
}> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    console.warn("Firecrawl API key not configured");
    return {
      codes: [],
      metadata: {
        source: "wiki",
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
        url: WIKI_URL,
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
          source: "wiki",
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
      throw new Error("Failed to scrape Wiki");
    }

    const codes = extractCodesFromMarkdown(data.data.markdown);

    return {
      codes,
      metadata: {
        source: "wiki",
        status: "ok",
        lastFetch: new Date().toISOString(),
        itemCount: codes.length,
      },
    };
  } catch (error) {
    console.error("Failed to fetch Wiki codes:", error);
    return {
      codes: [],
      metadata: {
        source: "wiki",
        status: "failed",
        lastFetch: new Date().toISOString(),
        itemCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
