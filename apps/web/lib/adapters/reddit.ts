/**
 * Reddit Adapter
 * Fetches codes from r/SuperSnail_US using public JSON API
 */

import { Code, SourceMetadata } from "../types/codes";

const SUBREDDIT = "SuperSnail_US";
const TRUST_WEIGHT = 0.6;

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    created_utc: number;
    permalink: string;
  };
}

/**
 * Extract codes from Reddit post
 */
function extractCodesFromPost(post: RedditPost["data"]): Code[] {
  const codes: Code[] = [];
  const codePattern = /\b[A-Z0-9]{4,}(?:-[A-Z0-9]{3,}){0,3}\b/g;
  
  const text = `${post.title} ${post.selftext}`;
  const matches = text.match(codePattern);
  
  if (!matches) return codes;

  for (const match of matches) {
    // Filter out common false positives
    if (
      match.includes("CODE") ||
      match.includes("SOURCE") ||
      match.includes("QR") ||
      /^[0-9]+$/.test(match) // All numbers
    ) {
      continue;
    }

    codes.push({
      code: match.toUpperCase(),
      title: post.title.substring(0, 100),
      description: post.selftext.substring(0, 200),
      rewards: [],
      region: "global",
      expires_at: null,
      first_seen_at: new Date(post.created_utc * 1000).toISOString(),
      last_seen_at: new Date(post.created_utc * 1000).toISOString(),
      sources: [
        {
          site: "reddit",
          url: `https://reddit.com${post.permalink}`,
          post_id: post.id,
          confidence: TRUST_WEIGHT,
          fetched_at: new Date().toISOString(),
        },
      ],
      verified: false,
      tags: ["reddit"],
    });
  }

  return codes;
}

/**
 * Fetch codes from Reddit
 */
export async function fetchRedditCodes(): Promise<{
  codes: Code[];
  metadata: SourceMetadata;
}> {
  try {
    const searchQuery = encodeURIComponent('code OR "secret code" OR redeem');
    const url = `https://www.reddit.com/r/${SUBREDDIT}/search.json?q=${searchQuery}&restrict_sr=1&sort=new&limit=50&t=month`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Slimy.ai/2.0",
      },
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (response.status === 429) {
      console.warn("Reddit rate limited");
      return {
        codes: [],
        metadata: {
          source: "reddit",
          status: "degraded",
          lastFetch: new Date().toISOString(),
          itemCount: 0,
          error: "Rate limited",
        },
      };
    }

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    const posts: RedditPost[] = data.data?.children || [];

    // Extract codes from all posts
    const allCodes: Code[] = [];
    for (const post of posts) {
      const extracted = extractCodesFromPost(post.data);
      allCodes.push(...extracted);
    }

    // Deduplicate cross-posts (same code within 24 hours)
    const deduped = deduplicateCrossPosts(allCodes);

    return {
      codes: deduped,
      metadata: {
        source: "reddit",
        status: "ok",
        lastFetch: new Date().toISOString(),
        itemCount: deduped.length,
      },
    };
  } catch (error) {
    console.error("Failed to fetch Reddit codes:", error);
    return {
      codes: [],
      metadata: {
        source: "reddit",
        status: "failed",
        lastFetch: new Date().toISOString(),
        itemCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Deduplicate cross-posts within 24 hours
 */
function deduplicateCrossPosts(codes: Code[]): Code[] {
  const seen = new Map<string, Code>();
  
  for (const code of codes) {
    const key = code.code;
    const existing = seen.get(key);
    
    if (!existing) {
      seen.set(key, code);
      continue;
    }
    
    // If within 24 hours, keep the earlier one
    const timeDiff = Math.abs(
      new Date(code.first_seen_at).getTime() - 
      new Date(existing.first_seen_at).getTime()
    );
    
    if (timeDiff < 24 * 60 * 60 * 1000) {
      // Merge sources
      existing.sources.push(...code.sources);
    } else {
      // Keep both as separate entries
      seen.set(`${key}-${code.first_seen_at}`, code);
    }
  }
  
  return Array.from(seen.values());
}
