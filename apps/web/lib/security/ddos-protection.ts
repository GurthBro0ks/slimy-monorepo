/**
 * DDoS Protection with Advanced Rate Limiting
 *
 * Provides multi-layered protection against DDoS attacks using
 * IP-based rate limiting, request pattern analysis, and adaptive throttling
 */

import { getCacheHelper } from '../cache/redis-client';
import { RateLimitError } from '../errors';
import { config } from '../config';

/**
 * Rate limit tier configuration
 */
interface RateLimitTier {
  name: string;
  maxRequests: number;
  windowSeconds: number;
  burstMultiplier?: number; // Allow brief bursts
}

/**
 * Rate limit tiers (from least to most strict)
 */
const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  public: {
    name: 'public',
    maxRequests: 100,
    windowSeconds: 60,
    burstMultiplier: 1.5,
  },
  authenticated: {
    name: 'authenticated',
    maxRequests: 500,
    windowSeconds: 60,
    burstMultiplier: 2,
  },
  premium: {
    name: 'premium',
    maxRequests: 2000,
    windowSeconds: 60,
    burstMultiplier: 3,
  },
};

/**
 * Suspicious activity patterns
 */
interface SuspiciousPattern {
  rapidRequests: boolean;
  repeatedFailures: boolean;
  unusualUserAgent: boolean;
  noReferrer: boolean;
}

/**
 * DDoS Protection Manager
 */
export class DDoSProtection {
  private cache: Awaited<ReturnType<typeof getCacheHelper>> | null = null;

  async initialize(): Promise<void> {
    this.cache = await getCacheHelper();
  }

  /**
   * Extract client IP from request
   */
  private getClientIP(request: Request): string {
    // Check various headers for real IP (reverse proxy support)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    // Cloudflare
    const cfIP = request.headers.get('cf-connecting-ip');
    if (cfIP) {
      return cfIP;
    }

    return 'unknown';
  }

  /**
   * Get rate limit tier for request
   */
  private getRateLimitTier(request: Request): RateLimitTier {
    // Check if user is authenticated
    const hasAuth = request.headers.get('authorization') || request.headers.get('cookie');

    // Check for premium indicators (you can customize this)
    const isPremium = request.headers.get('x-premium-user') === 'true';

    if (isPremium) {
      return RATE_LIMIT_TIERS.premium;
    }

    if (hasAuth) {
      return RATE_LIMIT_TIERS.authenticated;
    }

    return RATE_LIMIT_TIERS.public;
  }

  /**
   * Check for suspicious patterns
   */
  private async detectSuspiciousActivity(
    clientIP: string,
    request: Request
  ): Promise<SuspiciousPattern> {
    if (!this.cache) await this.initialize();

    const pattern: SuspiciousPattern = {
      rapidRequests: false,
      repeatedFailures: false,
      unusualUserAgent: false,
      noReferrer: false,
    };

    // Check for rapid requests (more than 10 in 1 second)
    const rapidKey = `ddos:rapid:${clientIP}`;
    const rapidCount = await this.cache!.increment(rapidKey, 1, 1);
    pattern.rapidRequests = rapidCount > 10;

    // Check for repeated failures
    const failureKey = `ddos:failures:${clientIP}`;
    const failureCount = (await this.cache!.getJSON<number>(failureKey)) || 0;
    pattern.repeatedFailures = failureCount > 5;

    // Check user agent
    const userAgent = request.headers.get('user-agent');
    pattern.unusualUserAgent = !userAgent || userAgent.length < 10;

    // Check referrer for non-GET requests
    if (request.method !== 'GET') {
      const referrer = request.headers.get('referer') || request.headers.get('referrer');
      pattern.noReferrer = !referrer;
    }

    return pattern;
  }

  /**
   * Calculate suspicion score (0-100)
   */
  private calculateSuspicionScore(pattern: SuspiciousPattern): number {
    let score = 0;

    if (pattern.rapidRequests) score += 40;
    if (pattern.repeatedFailures) score += 30;
    if (pattern.unusualUserAgent) score += 15;
    if (pattern.noReferrer) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Check if IP is blacklisted
   */
  private async isBlacklisted(clientIP: string): Promise<boolean> {
    if (!this.cache) await this.initialize();

    const blacklistKey = `ddos:blacklist:${clientIP}`;
    return await this.cache!.exists(blacklistKey);
  }

  /**
   * Blacklist an IP temporarily
   */
  private async blacklistIP(clientIP: string, durationSeconds: number = 3600): Promise<void> {
    if (!this.cache) await this.initialize();

    const blacklistKey = `ddos:blacklist:${clientIP}`;
    await this.cache!.setJSON(blacklistKey, { blacklistedAt: Date.now() }, durationSeconds);

    console.warn(`🚫 IP blacklisted for ${durationSeconds}s:`, clientIP);
  }

  /**
   * Record a failed request
   */
  async recordFailure(clientIP: string): Promise<void> {
    if (!this.cache) await this.initialize();

    const failureKey = `ddos:failures:${clientIP}`;
    const count = await this.cache!.increment(failureKey, 1, 300); // 5 min window

    // Auto-blacklist after 10 failures
    if (count >= 10) {
      await this.blacklistIP(clientIP, 3600); // 1 hour
    }
  }

  /**
   * Main rate limiting check
   */
  async checkRateLimit(request: Request): Promise<void> {
    if (!this.cache) await this.initialize();

    const clientIP = this.getClientIP(request);

    // Check blacklist first
    if (await this.isBlacklisted(clientIP)) {
      throw new RateLimitError('IP is temporarily blacklisted', 3600);
    }

    // Detect suspicious activity
    const pattern = await this.detectSuspiciousActivity(clientIP, request);
    const suspicionScore = this.calculateSuspicionScore(pattern);

    // If suspicion score is high, apply stricter limits
    const tier = this.getRateLimitTier(request);
    let maxRequests = tier.maxRequests;

    if (suspicionScore > 50) {
      maxRequests = Math.floor(maxRequests * 0.5); // Halve the limit
      console.warn(`⚠️  High suspicion score (${suspicionScore}) for IP:`, clientIP);
    }

    if (suspicionScore > 75) {
      maxRequests = Math.floor(maxRequests * 0.25); // Quarter the limit
      console.warn(`🚨 Very high suspicion score (${suspicionScore}) for IP:`, clientIP);
    }

    // Check rate limit
    const rateLimitKey = `ddos:ratelimit:${tier.name}:${clientIP}`;
    const count = await this.cache!.increment(rateLimitKey, 1, tier.windowSeconds);

    // Allow burst if configured
    const burstLimit = tier.burstMultiplier
      ? Math.floor(maxRequests * tier.burstMultiplier)
      : maxRequests;

    if (count > burstLimit) {
      // Auto-blacklist if significantly over limit
      if (count > burstLimit * 2) {
        await this.blacklistIP(clientIP, 1800); // 30 min
      }

      const resetTime = Math.ceil(tier.windowSeconds);
      throw new RateLimitError(
        `Rate limit exceeded for ${tier.name} tier`,
        resetTime,
        {
          limit: maxRequests,
          current: count,
          resetIn: resetTime,
          tier: tier.name,
          suspicionScore,
        }
      );
    }

    // Log if approaching limit
    if (count > maxRequests * 0.8) {
      console.warn(
        `⚠️  IP ${clientIP} approaching rate limit: ${count}/${maxRequests} (${tier.name})`
      );
    }
  }

  /**
   * Middleware for automatic DDoS protection
   */
  middleware() {
    return async (request: Request) => {
      await this.checkRateLimit(request);
    };
  }

  /**
   * Get rate limit status for client
   */
  async getRateLimitStatus(request: Request): Promise<{
    limit: number;
    remaining: number;
    reset: number;
    tier: string;
  }> {
    if (!this.cache) await this.initialize();

    const clientIP = this.getClientIP(request);
    const tier = this.getRateLimitTier(request);
    const rateLimitKey = `ddos:ratelimit:${tier.name}:${clientIP}`;

    const count = (await this.cache!.getJSON<number>(rateLimitKey)) || 0;
    return {
      limit: tier.maxRequests,
      remaining: Math.max(0, tier.maxRequests - count),
      reset: Date.now() + tier.windowSeconds * 1000,
      tier: tier.name,
    };
  }
}

// Singleton instance
let ddosProtectionInstance: DDoSProtection | null = null;

/**
 * Get DDoS protection instance
 */
export async function getDDoSProtection(): Promise<DDoSProtection> {
  if (!ddosProtectionInstance) {
    ddosProtectionInstance = new DDoSProtection();
    await ddosProtectionInstance.initialize();
  }
  return ddosProtectionInstance;
}

/**
 * Middleware wrapper for Next.js API routes
 */
export function withDDoSProtection<T extends (request: Request, ...args: unknown[]) => Promise<Response>>(
  handler: T
): T {
  return (async (request: Request, ...args: unknown[]) => {
    const protection = await getDDoSProtection();

    try {
      await protection.checkRateLimit(request);
      return await handler(request, ...args);
    } catch (error) {
      if (error instanceof RateLimitError) {
        // Record failure for this IP
        const clientIP = protection['getClientIP'](request);
        await protection.recordFailure(clientIP);
      }
      throw error;
    }
  }) as T;
}
