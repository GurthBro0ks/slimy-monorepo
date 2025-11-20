# Resilience and Retry Strategy

**Version:** 1.0
**Date:** 2025-11-19
**Status:** Draft

## Table of Contents

1. [Overview](#overview)
2. [Current State](#current-state)
3. [Design Principles](#design-principles)
4. [Service-Specific Strategy](#service-specific-strategy)
5. [Operation-Specific Guidance](#operation-specific-guidance)
6. [Implementation Patterns](#implementation-patterns)
7. [Default Configuration Summary](#default-configuration-summary)
8. [Migration Plan](#migration-plan)

---

## Overview

This document defines a unified retry, timeout, and fallback strategy for all Slimy services. The goal is to provide a consistent, predictable user experience while maximizing system resilience against transient failures.

### Goals

- **Reliability**: Automatically recover from transient failures
- **Performance**: Fail fast on permanent errors to avoid resource waste
- **User Experience**: Provide clear feedback when operations cannot be completed
- **Observability**: Log retry behavior for debugging and monitoring
- **Cost Control**: Avoid excessive retry costs with external APIs (OpenAI, Discord, etc.)

### Scope

This strategy covers:
- **Web** (`apps/web`): Next.js application serving the public UI
- **Admin API** (`apps/admin-api`): Express.js backend for administration
- **Bot** (`apps/bot`): Discord bot service (future implementation)
- **Infrastructure**: Deployment scripts and health checks

---

## Current State

### What Works Well ✅

1. **Web API Client** (`apps/web/lib/api-client.ts`):
   - Exponential backoff with jitter
   - Comprehensive retry logic (3 retries, 10s timeout)
   - Retries on network errors and 5xx/429/408 status codes

2. **Admin API Redis Cache** (`apps/admin-api/lib/cache/redis.js`):
   - 3 retry attempts with 1s delay
   - Stale-while-revalidate pattern
   - 5s connection timeout

3. **Docker Health Checks**:
   - MySQL: 30 retries, 10s interval
   - Services: 3 retries, 30s interval, 10s timeout

### Critical Gaps ❌

1. **OpenAI API** (web + admin-api):
   - No retry logic on rate limits (429)
   - No timeout configuration
   - No exponential backoff
   - Risk: Wasted cost on transient failures

2. **Discord API** (web + admin-api):
   - Rate limit detection but no retry
   - No respect for `Retry-After` header
   - OAuth flow has no retry logic

3. **Prisma Database Connections**:
   - No connection timeout
   - No query timeout
   - No retry on connection failures

4. **External Code Scrapers** (Reddit, Firecrawl, Discord):
   - Rate limit detection but no retry
   - No coordinated backoff across sources

---

## Design Principles

### 1. Fail Fast vs. Retry Guidelines

**Always Retry (Transient Errors):**
- Network errors (ECONNRESET, ETIMEDOUT, ENOTFOUND)
- Rate limits (429) with backoff
- Service unavailable (503)
- Gateway errors (502, 504)
- Database connection failures (connection pool exhausted)

**Never Retry (Permanent Errors):**
- Authentication failures (401, 403)
- Not found (404)
- Bad request (400)
- Unprocessable entity (422)
- Database constraint violations
- Invalid API keys

**Conditional Retry:**
- 500 Internal Server Error: Retry up to 2 times (may be transient)
- Timeout errors: Retry with longer timeout on second attempt

### 2. Backoff Strategy

**Exponential Backoff with Jitter:**
```
delay = min(maxDelay, baseDelay * (2 ^ attempt)) + random(0, jitter)
```

**Standard Parameters:**
- `baseDelay`: 1000ms
- `maxDelay`: 30000ms (30s)
- `jitter`: 0-500ms
- `maxRetries`: 3

**Cost-Sensitive APIs (OpenAI, external paid APIs):**
- `maxRetries`: 2
- `baseDelay`: 2000ms
- Include circuit breaker (after 5 consecutive failures, pause 60s)

### 3. Timeout Hierarchy

```
Request Timeout < Operation Timeout < Job Timeout < User-Facing Timeout
```

Example:
- Single DB query: 5s
- Complex operation (multiple queries): 15s
- Background job: 60s
- User-facing API endpoint: 30s

### 4. Graceful Degradation

When retries are exhausted:

1. **Return cached data** (if available and acceptable)
2. **Return partial results** (e.g., subset of code sources)
3. **Return error with retry guidance** (user-facing)
4. **Log error with context** (for alerting)

---

## Service-Specific Strategy

### Web Service (`apps/web`)

**User-Facing Pages:**
- Timeout: 30s total (including all retries)
- Retry: 2 attempts max (to stay within 30s)
- Fallback: Show cached data or error message

**API Routes:**
- Timeout: 15s per request
- Retry: 3 attempts with exponential backoff
- Fallback: Return 503 with `Retry-After` header

**Background Jobs (Code Scraping):**
- Timeout: 60s per source
- Retry: 3 attempts per source
- Fallback: Skip failed sources, continue with successful ones

**OpenAI Chat:**
- Timeout: 25s (OpenAI can be slow on vision tasks)
- Retry: 2 attempts
- Circuit breaker: After 5 consecutive failures, pause 60s
- Fallback: Return error message to user

### Admin API (`apps/admin-api`)

**Authentication Endpoints:**
- Timeout: 10s (Discord OAuth)
- Retry: 2 attempts (Discord can be slow)
- Fallback: Return clear error to user

**Chat Bot:**
- Timeout: 20s (OpenAI completion)
- Retry: 2 attempts
- Circuit breaker: After 5 consecutive failures, pause 60s
- Fallback: Return error message

**Analytics/Stats:**
- Timeout: 30s (complex queries)
- Retry: 1 attempt (these are often user-initiated, not time-sensitive)
- Fallback: Return cached stats if available

**Background Jobs (Google Sheets sync):**
- Timeout: 45s
- Retry: 3 attempts with 5s delay between
- Fallback: Log error, retry on next scheduled run

### Bot Service (`apps/bot`)

**Discord Command Handling:**
- Timeout: 3s (Discord requires response within 3s)
- Retry: 0 (must respond quickly or defer)
- Fallback: Send "Processing..." and handle async

**Discord API Calls:**
- Timeout: 5s per call
- Retry: 3 attempts respecting rate limits
- Fallback: Queue for later retry

**Database Operations:**
- Timeout: 5s per query
- Retry: 3 attempts
- Fallback: Return error to user via Discord

### Infrastructure Scripts

**Docker Health Checks:**
- Interval: 30s
- Timeout: 10s
- Retries: 3
- Start period: 40s (allow for slow startups)

**Database Migrations:**
- Timeout: 300s (5 minutes)
- Retry: 0 (manual intervention required on failure)
- Fallback: Rollback transaction, exit with error

**Deployment Scripts:**
- Connection timeout: 10s
- Retry: 3 attempts with 5s delay
- Fallback: Exit with clear error message

---

## Operation-Specific Guidance

### Discord API

**Rate Limits:**
- Discord uses bucket-based rate limiting
- Respect `X-RateLimit-Reset` and `Retry-After` headers
- Global rate limit: 50 requests/second across all endpoints

**Strategy:**

| Operation | Timeout | Retries | Notes |
|-----------|---------|---------|-------|
| OAuth token exchange | 10s | 2 | Retry on 5xx, network errors |
| Fetch user profile | 5s | 3 | Retry on 429 with `Retry-After` |
| Fetch guilds | 5s | 3 | Retry on 429 with `Retry-After` |
| Send message | 5s | 2 | Retry on 429, 502, 503, 504 |
| Fetch channel messages | 8s | 3 | Retry on 429 with `Retry-After` |

**Rate Limit Handling:**
```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
  await sleep(delayMs);
  // Retry request
}
```

**Circuit Breaker:**
- After 10 consecutive 429s, pause all Discord API calls for 60s
- Log warning for monitoring

### Database Operations

**PostgreSQL (Prisma):**

| Operation | Timeout | Retries | Notes |
|-----------|---------|---------|-------|
| Simple query | 5s | 3 | Retry on connection errors |
| Complex query | 15s | 2 | Retry on connection errors |
| Transaction | 10s | 1 | Only retry on connection errors |
| Connection pool acquisition | 10s | 3 | Retry immediately |
| Migration | 300s | 0 | Manual intervention required |

**Connection Configuration:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pooling params to DATABASE_URL:
  // ?connection_limit=20&pool_timeout=10&connect_timeout=5
}
```

**Retry Strategy:**
- Retry on: `P2024` (connection timeout), `P2028` (transaction error)
- Don't retry on: Constraint violations, syntax errors
- Exponential backoff: 100ms, 200ms, 400ms

**Redis:**

| Operation | Timeout | Retries | Notes |
|-----------|---------|---------|-------|
| Connect | 5s | 3 | Retry with 1s delay |
| GET | 1s | 2 | Fast fail, use fallback |
| SET | 2s | 2 | Log error, continue without cache |
| DEL | 2s | 1 | Fire and forget |

**Fallback Behavior:**
- If Redis unavailable: Use in-memory cache (existing behavior in web)
- If cache miss: Fetch from source and continue
- Log Redis errors but don't fail requests

### External APIs

**OpenAI API:**

| Operation | Timeout | Retries | Notes |
|-----------|---------|---------|-------|
| Chat completion (text) | 20s | 2 | Retry on 429, 500, 503 |
| Chat completion (vision) | 30s | 2 | Vision is slower |
| Embeddings | 15s | 2 | Retry on 429, 500, 503 |

**Retry Strategy:**
```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 20000,
  maxRetries: 2,
  httpAgent: new https.Agent({ timeout: 25000 })
});
```

**Rate Limit Handling:**
- OpenAI returns `Retry-After` header on 429
- Implement exponential backoff: 5s, 10s
- Circuit breaker: After 5 consecutive failures, pause 60s
- Log token usage for cost monitoring

**Cost Control:**
- Cache responses where possible (e.g., analysis results)
- Use shorter timeouts for non-critical features
- Implement request throttling (max 10 concurrent requests)

**Reddit API:**

| Operation | Timeout | Retries | Notes |
|-----------|---------|---------|-------|
| Fetch posts | 10s | 3 | Retry on 429, 500, 503 |
| Search | 12s | 3 | Retry on 429, 500, 503 |

**Rate Limits:**
- Reddit: 60 requests/minute
- Respect `X-Ratelimit-Reset` header
- Cache results for 10 minutes (existing behavior)

**Firecrawl API:**

| Operation | Timeout | Retries | Notes |
|-----------|---------|---------|-------|
| Scrape page | 20s | 2 | Web scraping can be slow |
| Batch scrape | 45s | 1 | Multiple pages |

**Rate Limits:**
- Respect plan-specific limits
- Retry on 429 with exponential backoff (5s, 15s)
- Cache results for 15 minutes (existing behavior)

**Google Sheets API (Admin API):**

| Operation | Timeout | Retries | Notes |
|-----------|---------|---------|-------|
| Read values | 10s | 3 | Retry on 429, 500, 503 |
| Update values | 15s | 2 | Retry on 429, 500, 503 |
| Batch update | 30s | 2 | Retry on 429, 500, 503 |

**Rate Limits:**
- 60 requests/minute per user
- 100 requests/100 seconds per project
- Implement request queuing to stay within limits

---

## Implementation Patterns

### 1. Unified Retry Utility

Create a shared retry utility in `packages/shared/src/retry.ts`:

```typescript
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const startTime = Date.now();
  let lastError: any;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      // Check overall timeout
      const elapsed = Date.now() - startTime;
      if (elapsed >= options.timeout) {
        throw new Error(`Operation timeout after ${elapsed}ms`);
      }

      // Execute with timeout
      const result = await Promise.race([
        fn(),
        sleep(options.timeout - elapsed).then(() => {
          throw new Error('Request timeout');
        })
      ]);

      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === options.maxRetries) {
        throw error;
      }

      if (options.shouldRetry && !options.shouldRetry(error)) {
        throw error;
      }

      // Calculate backoff delay
      const delay = Math.min(
        options.maxDelay,
        options.baseDelay * Math.pow(2, attempt) + Math.random() * 500
      );

      options.onRetry?.(attempt + 1, error);
      await sleep(delay);
    }
  }

  throw lastError;
}
```

### 2. Circuit Breaker

Create a circuit breaker for expensive APIs:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}
```

### 3. Rate Limiter

Implement token bucket rate limiter for Discord/external APIs:

```typescript
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    // Wait for next token
    const waitTime = 1000 / this.refillRate;
    await sleep(waitTime);
    this.tokens--;
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}
```

### 4. Graceful Degradation Wrapper

```typescript
async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T> | T,
  options: { cache?: boolean } = {}
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    console.error('Primary operation failed, using fallback:', error);
    return await fallback();
  }
}

// Usage example
const codes = await withFallback(
  () => fetchCodesFromAllSources(), // Try all sources
  () => fetchCodesFromCache(),      // Fall back to cache
);
```

---

## Default Configuration Summary

| Service | Operation | Timeout | Retries | Backoff | Fallback Behavior |
|---------|-----------|---------|---------|---------|-------------------|
| **Web** | User page load | 30s | 2 | Exponential (1s, 2s) | Show cached data or error |
| | API route | 15s | 3 | Exponential (1s, 2s, 4s) | Return 503 with Retry-After |
| | OpenAI chat | 25s | 2 | Exponential (5s, 10s) | Return error message |
| | Code scraping (per source) | 60s | 3 | Exponential (2s, 4s, 8s) | Skip source, use others |
| | Discord API | 8s | 3 | Respect Retry-After | Use cached data |
| | Reddit API | 10s | 3 | Exponential (2s, 4s, 8s) | Use cached data |
| | Firecrawl API | 20s | 2 | Exponential (5s, 15s) | Use cached data |
| | DB query (simple) | 5s | 3 | Exponential (100ms, 200ms, 400ms) | Return error |
| | DB query (complex) | 15s | 2 | Exponential (100ms, 200ms) | Return error |
| | Redis GET | 1s | 2 | Immediate | Use in-memory cache |
| | Redis SET | 2s | 2 | Immediate | Continue without cache |
| **Admin API** | OAuth (Discord) | 10s | 2 | Exponential (2s, 4s) | Return auth error |
| | Chat bot | 20s | 2 | Exponential (5s, 10s) | Return error message |
| | Analytics query | 30s | 1 | N/A | Return cached stats |
| | Google Sheets sync | 45s | 3 | Exponential (5s, 10s, 20s) | Retry on next schedule |
| | DB query (simple) | 5s | 3 | Exponential (100ms, 200ms, 400ms) | Return error |
| | Redis connect | 5s | 3 | Fixed (1s) | Disable cache |
| **Bot** | Discord command | 3s | 0 | N/A | Defer to async handler |
| | Discord API call | 5s | 3 | Respect Retry-After | Queue for retry |
| | DB query | 5s | 3 | Exponential (100ms, 200ms, 400ms) | Return error via Discord |
| **Infrastructure** | Health check | 10s | 3 | Fixed (30s interval) | Container restart |
| | DB migration | 300s | 0 | N/A | Rollback + exit |
| | Deployment script | 10s | 3 | Fixed (5s) | Exit with error |

### Circuit Breaker Thresholds

| Service/API | Failure Threshold | Cooldown Period |
|-------------|-------------------|-----------------|
| OpenAI API | 5 failures | 60s |
| Discord API | 10 failures (429s) | 60s |
| Reddit API | 5 failures | 30s |
| Firecrawl API | 3 failures | 60s |
| Google Sheets API | 5 failures | 120s |

### Rate Limits

| Service/API | Rate Limit | Implementation |
|-------------|------------|----------------|
| Discord API | 50 req/s global | Token bucket |
| Reddit API | 60 req/min | Token bucket |
| OpenAI API | 10 concurrent | Semaphore |
| Google Sheets | 60 req/min | Token bucket |

---

## Migration Plan

### Phase 1: Foundation (Week 1)

**Goal:** Establish shared utilities and patterns

1. Create `packages/shared/src/resilience/`:
   - `retry.ts` - Retry utility
   - `circuit-breaker.ts` - Circuit breaker
   - `rate-limiter.ts` - Rate limiter
   - `timeout.ts` - Timeout helpers
   - `index.ts` - Exports

2. Add unit tests for all utilities

3. Update TypeScript configs to include shared package

4. Document usage examples in `docs/examples/resilience.md`

### Phase 2: Critical Paths (Week 2)

**Goal:** Fix high-impact, high-risk operations

1. **OpenAI Integration:**
   - Add retry logic to `apps/web/lib/openai-client.ts`
   - Add circuit breaker
   - Update timeout to 25s
   - Add request queuing (max 10 concurrent)

2. **Admin API OpenAI:**
   - Add retry logic to `apps/admin-api/src/services/chat-bot.js`
   - Add circuit breaker
   - Update timeout to 20s

3. **Prisma Connections:**
   - Add connection timeout to `DATABASE_URL` (5s)
   - Add pool timeout (10s)
   - Configure connection limits (20)
   - Add retry middleware for transient errors

### Phase 3: External APIs (Week 3)

**Goal:** Improve resilience for code scraping and external integrations

1. **Discord API (Web):**
   - Add `Retry-After` header handling
   - Implement retry logic (3 attempts)
   - Add rate limiter (50 req/s)

2. **Discord OAuth (Admin API):**
   - Add retry logic to `/src/services/oauth.js`
   - Update timeout to 10s

3. **Reddit API:**
   - Add retry logic to `apps/web/lib/adapters/reddit.ts`
   - Add rate limiter (60 req/min)

4. **Firecrawl API:**
   - Add retry logic to `apps/web/lib/adapters/snelp.ts`
   - Update timeout to 20s
   - Add circuit breaker

5. **Google Sheets (Admin API):**
   - Add retry logic to stats sync
   - Add rate limiter
   - Implement request queuing

### Phase 4: Monitoring & Observability (Week 4)

**Goal:** Add visibility into retry behavior

1. Add structured logging:
   ```typescript
   logger.info('retry_attempt', {
     operation: 'openai_chat',
     attempt: 2,
     error: error.message,
     delay: 5000
   });
   ```

2. Add metrics (if Sentry/monitoring is configured):
   - Retry counts per operation
   - Circuit breaker state changes
   - Timeout occurrences
   - Fallback usage

3. Create dashboard for:
   - Retry rates by service/operation
   - Circuit breaker trips
   - Timeout trends
   - External API success rates

### Phase 5: Testing & Validation (Week 5)

**Goal:** Ensure retry behavior works as expected

1. Add integration tests:
   - Simulate network failures
   - Simulate rate limits (429)
   - Simulate timeouts
   - Verify fallback behavior

2. Load testing:
   - Test circuit breaker under load
   - Verify rate limiters prevent overload
   - Check timeout behavior under stress

3. Chaos engineering:
   - Random network failures (Chaos Monkey)
   - DB connection drops
   - External API outages

### Phase 6: Documentation & Training (Week 6)

**Goal:** Ensure team understands new patterns

1. Update README files with retry examples
2. Create runbook for common failure scenarios
3. Document how to add retry logic to new features
4. Team training session on resilience patterns

---

## Success Metrics

Track these metrics before and after implementation:

1. **Error Rates:**
   - 5xx errors from external APIs
   - Database connection failures
   - User-facing error pages

2. **Performance:**
   - P50, P95, P99 latency for key endpoints
   - Retry overhead (additional latency)
   - Time to recovery from failures

3. **Cost:**
   - OpenAI API usage (should not increase from retries)
   - External API costs
   - Infrastructure costs (connection pooling)

4. **User Experience:**
   - Failed request rate
   - Cache hit rate
   - Successful recovery via retry

**Target Improvements:**
- 50% reduction in user-facing errors
- 95% success rate on transient failures
- <5% increase in average latency
- Zero cost increase from retries (via circuit breakers)

---

## Related Documents

- [API Client Implementation](../apps/web/lib/api-client.ts) - Current retry logic reference
- [Redis Cache Strategy](../apps/admin-api/lib/cache/redis.js) - Stale-while-revalidate pattern
- [Docker Health Checks](../infra/docker/) - Infrastructure resilience

---

## Appendix: Error Classification

### HTTP Status Codes

**Retryable:**
- 408 Request Timeout
- 429 Too Many Requests (with backoff)
- 500 Internal Server Error (up to 2 retries)
- 502 Bad Gateway
- 503 Service Unavailable
- 504 Gateway Timeout

**Non-Retryable:**
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 405 Method Not Allowed
- 409 Conflict
- 422 Unprocessable Entity

### Network Errors

**Retryable:**
- ECONNRESET (Connection reset)
- ETIMEDOUT (Connection timeout)
- ENOTFOUND (DNS lookup failed, may be transient)
- ECONNREFUSED (Server not accepting connections)
- EHOSTUNREACH (Host unreachable)

**Non-Retryable:**
- EACCES (Permission denied)
- EADDRINUSE (Address in use)
- Invalid URL/format errors

### Database Errors (Prisma)

**Retryable:**
- P2024 (Connection timeout)
- P2028 (Transaction API error)
- P1001 (Can't reach database server)
- P1002 (Database server timeout)
- P1008 (Operations timed out)

**Non-Retryable:**
- P2002 (Unique constraint violation)
- P2003 (Foreign key constraint violation)
- P2025 (Record not found)
- P2005 (Invalid value)
- Syntax errors

---

## Approval & Sign-off

- [ ] Engineering Lead
- [ ] DevOps/SRE
- [ ] Product Owner
- [ ] Security Review (if applicable)

**Questions or feedback?** Contact the infrastructure team or open a discussion in #engineering.
