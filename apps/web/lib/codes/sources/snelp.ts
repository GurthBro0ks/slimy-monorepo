import { Code } from "@/lib/codes-aggregator";
import { CodeSource, SourceConfig, SourceResult, SourceFactory } from "./types";

/**
 * Default configuration for Snelp source
 */
const DEFAULT_CONFIG: SourceConfig = {
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  cacheTtl: 300, // 5 minutes
  enabled: true,
};

/**
 * Snelp API source adapter
 */
export class SnelpSource implements CodeSource {
  public readonly name = "snelp";
  public readonly config: SourceConfig;

  private static missingEnvLogged = false;
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
   * Fetch codes from Snelp API with retry logic and error handling
   */
  async fetch(): Promise<SourceResult> {
    const startTime = Date.now();
    this.fetchStats.totalFetches++;

    const snelpUrl = process.env.NEXT_PUBLIC_SNELP_CODES_URL;
    if (!snelpUrl) {
      if (!SnelpSource.missingEnvLogged) {
        console.warn("Snelp source disabled: NEXT_PUBLIC_SNELP_CODES_URL not configured");
        SnelpSource.missingEnvLogged = true;
      }

      return {
        codes: [],
        success: true,
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
      const codes = await this.fetchWithRetry(snelpUrl);
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

      console.error(`Snelp source fetch failed:`, error);

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
  private async fetchWithRetry(url: string): Promise<Code[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const codes = await this.fetchOnce(url);

        if (attempt > 1) {
          console.info(`Snelp fetch succeeded on attempt ${attempt}`);
        }

        return codes;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.retries) {
          console.warn(
            `Snelp fetch attempt ${attempt} failed, retrying in ${this.config.retryDelay}ms:`,
            lastError.message
          );
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }

  /**
   * Single fetch attempt
   */
  private async fetchOnce(url: string): Promise<Code[]> {
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
          `Snelp API responded with status ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.codes)) {
        throw new Error("Invalid response format from Snelp API");
      }

      return this.transformCodes(data.codes);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Transform Snelp API response to our Code format
   */
  private transformCodes(apiCodes: any[]): Code[] {
    return apiCodes
      .filter(code => code && (code.code || code.text))
      .map(code => ({
        code: (code.code || code.text).toString().toUpperCase(),
        source: "snelp" as const,
        ts: code.timestamp || code.createdAt || code.updatedAt || new Date().toISOString(),
        tags: code.active ? ["active"] : [],
        expires: code.expiresAt || code.expiry || null,
        region: code.region || "global",
        description: code.description || code.notes || undefined,
      }))
      .filter(code => {
        // Basic validation
        if (code.code.length < 4 || code.code.length > 20) {
          console.warn(`Filtering out invalid code: ${code.code} (length: ${code.code.length})`);
          return false;
        }

        // Check if it's a reasonable code format (alphanumeric, some letters)
        if (!/[A-Z]/.test(code.code) || !/[0-9]/.test(code.code)) {
          console.warn(`Filtering out non-alphanumeric code: ${code.code}`);
          return false;
        }

        return true;
      });
  }

  /**
   * Health check for Snelp API
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const url = process.env.NEXT_PUBLIC_SNELP_CODES_URL;
      if (!url) {
        return { healthy: false, error: "NEXT_PUBLIC_SNELP_CODES_URL not configured" };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check

      const response = await fetch(url, {
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
      name: "Snelp",
      description: "Official Super Snail codes from Snelp API",
      url: process.env.NEXT_PUBLIC_SNELP_CODES_URL,
      rateLimit: "Unknown",
      lastSuccessfulFetch: this.fetchStats.lastSuccessfulFetch ?? undefined,
      totalFetches: this.fetchStats.totalFetches,
      successfulFetches: this.fetchStats.successfulFetches,
      failedFetches: this.fetchStats.failedFetches,
    };
  }
}

/**
 * Factory function for Snelp source
 */
export const createSnelpSource: SourceFactory<SnelpSource> = (config) => {
  return new SnelpSource(config);
};
