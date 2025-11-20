/**
 * Simple File-Backed Rate Limiter
 * Uses a file to store timestamps for rate limiting.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const RATE_LIMIT_DIR = join(process.cwd(), "data/rate-limits");

interface RateLimitEntry {
  count: number;
  resetTime: number; // Unix timestamp
}

/**
 * Checks if a user/key is rate limited.
 * @param key The unique key to rate limit (e.g., userId or IP address).
 * @param limit The maximum number of requests allowed.
 * @param windowMs The time window in milliseconds.
 * @returns true if rate limited, false otherwise.
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const filePath = join(RATE_LIMIT_DIR, `${key}.json`);

  if (!existsSync(RATE_LIMIT_DIR)) {
    try {
      require("fs").mkdirSync(RATE_LIMIT_DIR, { recursive: true });
    } catch (e) {
      console.error("Failed to create rate limit directory:", e);
      // Fail open if directory cannot be created
      return false;
    }
  }

  let entry: RateLimitEntry = { count: 0, resetTime: now + windowMs };

  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath, "utf-8");
      entry = JSON.parse(content);
    } catch (e) {
      console.warn(`Failed to parse rate limit file for ${key}. Resetting.`, e);
    }
  }

  // Check if the window has reset
  if (entry.resetTime <= now) {
    entry = { count: 0, resetTime: now + windowMs };
  }

  // Check if limit is reached
  if (entry.count >= limit) {
    return true;
  }

  // Increment count and save
  entry.count += 1;
  try {
    writeFileSync(filePath, JSON.stringify(entry));
  } catch (e) {
    console.error(`Failed to write rate limit file for ${key}.`, e);
    // Fail open if file cannot be written
  }

  return false;
}

/**
 * Gets the remaining time until reset for a key.
 */
export function getRateLimitResetTime(key: string, windowMs: number): number {
  const now = Date.now();
  const filePath = join(RATE_LIMIT_DIR, `${key}.json`);

  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const entry: RateLimitEntry = JSON.parse(content);
      if (entry.resetTime > now) {
        return entry.resetTime;
      }
    } catch (e) {
      // Ignore
    }
  }
  return now + windowMs;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  key?: string; // Optional custom key (defaults to IP)
  limit: number; // Number of requests allowed
  windowMs: number; // Time window in milliseconds
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Extract IP address from request headers
 */
function getIpAddress(request: Request): string {
  const headers = request.headers;

  // Try various headers for IP address
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default value (not ideal but prevents errors)
  return 'unknown';
}

/**
 * Generic rate limiter for Next.js API routes
 *
 * Usage:
 * ```ts
 * const result = rateLimit(request, { limit: 100, windowMs: 60000 });
 * if (!result.allowed) {
 *   return new Response('Rate limit exceeded', { status: 429 });
 * }
 * ```
 */
export function rateLimit(
  request: Request,
  config: RateLimitConfig
): RateLimitResult {
  const { key, limit, windowMs } = config;

  // Use custom key or fallback to IP address
  const rateLimitKey = key || `ip:${getIpAddress(request)}`;

  // Check if rate limited
  const limited = isRateLimited(rateLimitKey, limit, windowMs);
  const resetTime = getRateLimitResetTime(rateLimitKey, windowMs);

  // Calculate remaining requests
  const now = Date.now();
  const filePath = join(RATE_LIMIT_DIR, `${rateLimitKey}.json`);
  let remaining = limit;

  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const entry: RateLimitEntry = JSON.parse(content);
      if (entry.resetTime > now) {
        remaining = Math.max(0, limit - entry.count);
      }
    } catch (e) {
      // Ignore
    }
  }

  return {
    allowed: !limited,
    limit,
    remaining,
    resetTime,
  };
}
