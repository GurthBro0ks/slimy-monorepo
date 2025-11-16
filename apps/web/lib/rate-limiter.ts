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
