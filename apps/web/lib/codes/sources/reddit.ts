import { Code } from "@/lib/codes-aggregator";
import { CodeSource, SourceConfig, SourceResult, SourceFactory } from "./types";

/**
 * Default configuration for Reddit source
 */
const DEFAULT_CONFIG: SourceConfig = {
  timeout: 15000, // 15 seconds (Reddit can be slow)
  retries: 2, // Fewer retries for Reddit
  retryDelay: 2000, // 2 seconds
  cacheTtl: 600, // 10 minutes
  enabled: true,
};

/**
 * Reddit API source adapter for r/SuperSnailGame
 */
export class RedditSource implements CodeSource {
  public readonly name = "reddit";
  public readonly config: SourceConfig;

  private fetchStats = {
    totalFetches: 0,
    successfulFetches: 0,
    failedFetches: 0,
    lastSuccessfulFetch: null as string | null,
  };

  constructor(config?: Partial<SourceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Fetch codes from Reddit with retry logic and error handling
   */
  async fetch(): Promise<SourceResult> {
    const startTime = Date.now();
    this.fetchStats.totalFetches++;

    try {
      const codes = await this.fetchWithRetry();
      const duration = Date.now() - startTime;

      this.fetchStats.successfulFetches++;
      this.fetchStats.lastSuccessfulFetch = new Date().toISOString();

      return {
        codes,
        success: true,
        metadata: {
          source: this.name,
          fetchedAt: new Date().toISOString(),
          count: codes.length,
          duration,
          status: "success",
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.fetchStats.failedFetches++;

      console.error(`Reddit source fetch failed:`, error);

      return {
        codes: [],
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          source: this.name,
          fetchedAt: new Date().toISOString(),
          count: 0,
          duration,
          status: "failed",
        },
      };
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(): Promise<Code[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const codes = await this.fetchOnce();

        if (attempt > 1) {
          console.info(`Reddit fetch succeeded on attempt ${attempt}`);
        }

        return codes;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.retries) {
          console.warn(
            `Reddit fetch attempt ${attempt} failed, retrying in ${this.config.retryDelay}ms:`,
            lastError.message
          );
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }

  /**
   * Single fetch attempt from Reddit API
   */
  private async fetchOnce(): Promise<Code[]> {
    const url = "https://www.reddit.com/r/SuperSnailGame/search.json?q=code&restrict_sr=1&sort=new&limit=50";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Slimy.ai/1.0",
          "Accept": "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Reddit API responded with status ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data || !data.data || !Array.isArray(data.data.children)) {
        throw new Error("Invalid response format from Reddit API");
      }

      return this.extractCodesFromPosts(data.data.children);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Extract potential codes from Reddit posts
   */
  private extractCodesFromPosts(posts: any[]): Code[] {
    const codes: Code[] = [];
    const codePattern = /\b[A-Z0-9]{6,12}\b/g;

    for (const post of posts) {
      if (!post.data) continue;

      const title = post.data.title || "";
      const selftext = post.data.selftext || "";
      const text = `${title} ${selftext}`;

      // Extract potential codes
      const matches = text.match(codePattern);
      if (matches) {
        for (const match of matches) {
          const code = this.validateAndCreateCode(match, post.data);
          if (code) {
            codes.push(code);
          }
        }
      }
    }

    return codes;
  }

  /**
   * Validate and create a code from extracted text
   */
  private validateAndCreateCode(match: string, postData: any): Code | null {
    // Filter out common false positives
    if (match.length < 6 || match.length > 12) {
      return null;
    }

    // Must contain both letters and numbers
    if (!/[A-Z]/.test(match) || !/[0-9]/.test(match)) {
      return null;
    }

    // Filter out obvious non-codes
    const upperMatch = match.toUpperCase();
    if (this.isLikelyFalsePositive(upperMatch)) {
      return null;
    }

    return {
      code: upperMatch,
      source: "reddit" as const,
      ts: new Date(postData.created_utc * 1000).toISOString(),
      tags: ["reddit", "community"],
      expires: null, // Reddit codes don't have expiry info
      region: "global",
      description: this.createDescription(postData),
    };
  }

  /**
   * Check if a match is likely a false positive
   */
  private isLikelyFalsePositive(code: string): boolean {
    // Common false positives
    const falsePositives = [
      /^HTTPS?$/, // HTTP/HTTPS
      /^API\d*$/, // API123 etc
      /^TEST\d*$/, // TEST123
      /^DEMO\d*$/, // DEMO123
      /^NULL\d*$/, // NULL123
      /^TRUE\d*$/, // TRUE123
      /^FALSE\d*$/, // FALSE123
      /^[A-Z]{2,3}\d{1,2}[A-Z]*$/, // Country codes like US123, UK456
    ];

    return falsePositives.some(pattern => pattern.test(code));
  }

  /**
   * Create a description from post data
   */
  private createDescription(postData: any): string {
    let description = postData.title || "";

    // Truncate if too long
    if (description.length > 100) {
      description = description.substring(0, 97) + "...";
    }

    // Add subreddit context
    if (postData.subreddit) {
      description = `[r/${postData.subreddit}] ${description}`;
    }

    return description;
  }

  /**
   * Health check for Reddit API
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("https://www.reddit.com/r/SuperSnailGame.json?limit=1", {
        signal: controller.signal,
        headers: { "User-Agent": "Slimy.ai/1.0 (Health Check)" },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { healthy: true };
      } else {
        return {
          healthy: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Get source metadata
   */
  getMetadata() {
    return {
      name: "Reddit r/SuperSnailGame",
      description: "Community-submitted codes from Reddit r/SuperSnailGame",
      url: "https://www.reddit.com/r/SuperSnailGame/search.json?q=code",
      rateLimit: "Reddit API rate limits apply",
      lastSuccessfulFetch: this.fetchStats.lastSuccessfulFetch ?? undefined,
      totalFetches: this.fetchStats.totalFetches,
      successfulFetches: this.fetchStats.successfulFetches,
      failedFetches: this.fetchStats.failedFetches,
    };
  }
}

/**
 * Factory function for Reddit source
 */
export const createRedditSource: SourceFactory<RedditSource> = (config) => {
  return new RedditSource(config);
};
