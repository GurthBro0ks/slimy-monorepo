/**
 * Super Snail Wiki source adapter
 * Scrapes codes from https://supersnail.wiki.gg/wiki/Snail_codes
 */
import { Code } from "@/lib/codes-aggregator";
import { CodeSource, SourceConfig, SourceResult, SourceFactory } from "./types";

const DEFAULT_CONFIG: SourceConfig = {
  timeout: 10000,
  retries: 2,
  retryDelay: 1000,
  cacheTtl: 300,
  enabled: true,
};

// Multi-word Super Snail code pattern (relaxed: min 1 char per word)
const MULTI_WORD_CODE = /^[A-Z0-9][A-Z0-9'&.#-]*(?: [A-Z0-9][A-Z0-9'&.#-]*){1,}$/;

function extractCodesFromHtml(html: string): string[] {
  const codes: string[] = [];

  // Codes are in <pre> blocks as newline-separated lines
  const prePattern = /<pre[^>]*>(.*?)<\/pre>/gis;
  let match;
  while ((match = prePattern.exec(html)) !== null) {
    const preContent = match[1];
    // Split by newlines — each line is a potential code
    const lines = preContent.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .replace(/&#\d+;/g, "")
        .replace(/<[^>]+>/g, " ")  // strip HTML tags BEFORE trim
        .replace(/\s+/g, " ")       // normalize whitespace
        .trim()
        .toUpperCase();

      // Must be 4-50 chars
      if (line.length < 4 || line.length > 50) continue;
      // Skip if no letters
      if (!/[A-Z]/.test(line)) continue;

      // Accept multi-word codes: each word 1+ chars (relaxed from bot's 2+)
      if (line.includes(" ") && MULTI_WORD_CODE.test(line)) {
        codes.push(line);
        continue;
      }
      // Also accept single-word codes 4+ chars (all caps alphanumeric + allowed punctuation)
      if (!line.includes(" ") && /^[A-Z0-9][A-Z0-9'&.#-]{2,}$/.test(line)) {
        codes.push(line);
      }
    }
  }

  return [...new Set(codes)];
}

export class WikiSource implements CodeSource {
  public readonly name = "wiki";
  public readonly config: SourceConfig;

  private stats = {
    totalFetches: 0,
    successfulFetches: 0,
    failedFetches: 0,
    lastSuccessfulFetch: null as string | null,
  };

  constructor(config?: Partial<SourceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async fetch(): Promise<SourceResult> {
    const startTime = Date.now();
    this.stats.totalFetches++;

    if (!this.config.enabled) {
      return {
        codes: [],
        success: false,
        error: "Wiki source disabled",
        metadata: {
          source: this.name,
          fetchedAt: new Date().toISOString(),
          count: 0,
          duration: Date.now() - startTime,
          status: "disabled",
        },
      };
    }

    try {
      const codes = await this.fetchWithRetry();
      const duration = Date.now() - startTime;

      this.stats.successfulFetches++;
      this.stats.lastSuccessfulFetch = new Date().toISOString();

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
      this.stats.failedFetches++;

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

  private async fetchWithRetry(): Promise<Code[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        return await this.fetchOnce();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.retries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        }
      }
    }

    throw lastError;
  }

  private async fetchOnce(): Promise<Code[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch("https://supersnail.wiki.gg/wiki/Snail_codes", {
        signal: controller.signal,
        headers: {
          "User-Agent": "Slimy.ai/1.0 (+https://slimyai.xyz)",
          "Accept": "text/html",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Wiki returned ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const rawCodes = extractCodesFromHtml(html);

      return rawCodes.map(code => ({
        code,
        source: this.name,
        ts: new Date().toISOString(),
        tags: ["wiki", "active"],
        expires: null,
        region: "global",
      }));
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Wiki request timeout after ${this.config.timeout}ms`);
      }

      throw error;
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("https://supersnail.wiki.gg/wiki/Snail_codes", {
        method: "HEAD",
        signal: controller.signal,
        headers: { "User-Agent": "Slimy.ai/1.0 (Health Check)" },
      });

      clearTimeout(timeoutId);

      return { healthy: response.ok };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  getMetadata() {
    return {
      name: "supersnail.wiki.gg",
      description: "Super Snail Wiki codes page",
      url: "https://supersnail.wiki.gg/wiki/Snail_codes",
      rateLimit: "10 req/min",
      lastSuccessfulFetch: this.stats.lastSuccessfulFetch ?? undefined,
      totalFetches: this.stats.totalFetches,
      successfulFetches: this.stats.successfulFetches,
      failedFetches: this.stats.failedFetches,
    };
  }
}

export const createWikiSource: SourceFactory<WikiSource> = (config) => {
  return new WikiSource(config);
};
