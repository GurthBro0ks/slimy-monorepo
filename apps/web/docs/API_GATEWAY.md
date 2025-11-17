# API Gateway

The API Gateway is a centralized proxy layer for the Next.js web application that consolidates all communication with the admin-api backend.

## Overview

The gateway provides:
- **Centralized Proxying**: Single point of configuration for admin-api communication
- **Rate Limiting**: Configurable per-IP rate limits on all proxied requests
- **Authentication**: Optional high-level auth checks before forwarding requests
- **Error Handling**: Standardized error response format across all routes
- **Retry Logic**: Automatic retry for 5xx server errors with exponential backoff
- **Request Logging**: Consistent logging for monitoring and debugging

## Architecture

### Components

1. **AdminApiClient** (`lib/api/admin-client.ts`)
   - Core HTTP client for admin-api communication
   - Handles request/response formatting
   - Built-in retry logic for 5xx errors
   - Timeout support
   - Streaming support (SSE)

2. **Rate Limiter** (`lib/rate-limiter.ts`)
   - Generic rate limiting helper
   - File-based storage (can be upgraded to Redis)
   - Configurable limits and windows
   - Per-IP or custom key support

3. **Gateway Route** (`app/api/gateway/[...path]/route.ts`)
   - Catch-all route handler for `/api/gateway/*`
   - Applies rate limiting and auth checks
   - Forwards requests to admin-api
   - Returns standardized responses

## Usage

### Option 1: Use the Gateway Route Directly

The gateway route is available at `/api/gateway/*` and forwards all requests to admin-api.

**Example:**

```typescript
// Client-side code
const response = await fetch('/api/gateway/stats');
const result = await response.json();

if (result.ok) {
  console.log('Data:', result.data);
} else {
  console.error('Error:', result.error);
}
```

**URL Mapping:**
- `/api/gateway/stats` → `admin-api/api/stats`
- `/api/gateway/guilds/123` → `admin-api/api/guilds/123`
- `/api/gateway/users?page=1` → `admin-api/api/users?page=1`

### Option 2: Use AdminApiClient in Your Routes

For routes that need custom logic, use `adminApiClient` directly with the standardized pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { adminApiClient } from '@/lib/api/admin-client';

export async function GET(request: NextRequest) {
  const result = await adminApiClient.get('/api/stats', {
    retryOn5xx: true, // Enable automatic retry
    maxRetries: 2,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: result.code,
          message: result.message,
          status: result.status || 500,
        },
      },
      { status: result.status || 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: result.data,
  });
}
```

## Response Format

All responses follow a standardized format:

### Success Response

```json
{
  "ok": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "status": 500,
    "details": { ... }
  }
}
```

### Common Error Codes

- `RATE_LIMIT_EXCEEDED` - Too many requests (429)
- `UNAUTHORIZED` - Authentication required (401)
- `INVALID_JSON` - Malformed request body (400)
- `UPSTREAM_ERROR` - Error from admin-api (varies)
- `CONFIG_ERROR` - Admin API not configured (500)
- `TIMEOUT_ERROR` - Request timed out (408)
- `NETWORK_ERROR` - Network failure (500)
- `INTERNAL_ERROR` - Unexpected server error (500)

## Configuration

### Environment Variables

Configure the gateway using these environment variables:

```bash
# Admin API Configuration (required)
NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3001

# Rate Limiting (optional)
GATEWAY_RATE_LIMIT_ENABLED=true          # Enable/disable rate limiting (default: true)
GATEWAY_RATE_LIMIT_MAX=100               # Max requests per window (default: 100)
GATEWAY_RATE_LIMIT_WINDOW_MS=60000       # Time window in ms (default: 60000 = 1 minute)

# Authentication (optional)
GATEWAY_AUTH_REQUIRED=false              # Require auth on all gateway requests (default: false)
```

### Default Limits

Without configuration, the gateway uses:
- **Rate Limit**: 100 requests per minute per IP
- **Timeout**: 30 seconds per request
- **Retries**: 2 retries on 5xx errors with exponential backoff (1s, 2s, 4s max 5s)

## Rate Limiting

### How It Works

1. Extracts IP from request headers (`x-forwarded-for`, `x-real-ip`)
2. Maintains per-IP request count in file storage
3. Returns 429 when limit exceeded
4. Includes rate limit headers in all responses

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-15T10:30:00.000Z
```

### Custom Rate Limit Keys

For routes with custom logic, you can specify a rate limit key:

```typescript
import { rateLimit } from '@/lib/rate-limiter';

const result = rateLimit(request, {
  key: `user:${userId}`,  // Custom key instead of IP
  limit: 1000,
  windowMs: 3600000,      // 1 hour
});

if (!result.allowed) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

## Authentication

### Optional Gateway Auth

Enable authentication for all gateway requests:

```bash
GATEWAY_AUTH_REQUIRED=true
```

This checks for valid auth headers (`x-user-id`) on every gateway request.

### Per-Route Auth

Individual routes can implement their own auth logic:

```typescript
import { requireAuth } from '@/lib/auth/server';
import { AuthenticationError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    // ... proceed with authenticated request
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } },
        { status: 401 }
      );
    }
  }
}
```

## Retry Logic

The admin client automatically retries 5xx errors:

### Configuration

```typescript
const result = await adminApiClient.get('/api/stats', {
  retryOn5xx: true,  // Enable retry (default: false)
  maxRetries: 2,     // Max retry attempts (default: 2)
});
```

### Retry Behavior

- **Trigger**: Only 5xx status codes (500-599)
- **Backoff**: Exponential with jitter (1s, 2s, 4s, max 5s)
- **Max Retries**: Configurable (default: 2)
- **No Retry**: Network errors, timeouts, 4xx errors

## Migration Guide

### Migrating Existing Routes

**Before (scattered proxy logic):**

```typescript
export async function GET(request: NextRequest) {
  const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE;
  const response = await fetch(`${adminApiUrl}/api/stats`);

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
```

**After (using AdminApiClient):**

```typescript
import { adminApiClient } from '@/lib/api/admin-client';

export async function GET(request: NextRequest) {
  const result = await adminApiClient.get('/api/stats', {
    retryOn5xx: true,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: { code: result.code, message: result.message } },
      { status: result.status || 500 }
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
```

**Or use the gateway directly:**

Delete the route file and use `/api/gateway/stats` instead!

## Example Routes

See these files for reference implementations:

1. **Gateway Route**: `app/api/gateway/[...path]/route.ts`
   - Full-featured gateway with rate limiting and auth

2. **Refactored Route**: `app/api/stats/route.ts`
   - Example of using AdminApiClient directly with standardized patterns

3. **Admin Client**: `lib/api/admin-client.ts`
   - Core client implementation

## Monitoring

The gateway logs all requests:

```
[Gateway] GET https://example.com/api/gateway/stats -> /api/stats
[Gateway] Success: GET /api/stats (150ms)
```

Errors are logged with details:

```
[Gateway] Error: UPSTREAM_ERROR - Admin API returned 503 (200ms)
```

All responses include processing time:

```
X-Processing-Time: 150ms
```

## Best Practices

1. **Use the gateway for new routes** - Prefer `/api/gateway/*` over creating new proxy routes
2. **Enable retry for idempotent operations** - Use `retryOn5xx: true` for GET requests
3. **Standardize error responses** - Always use the `{ ok, data/error }` format
4. **Add custom rate limits for expensive operations** - Don't rely solely on global limits
5. **Log request/response for debugging** - Use consistent logging patterns

## Troubleshooting

### Gateway returns 500

Check that `NEXT_PUBLIC_ADMIN_API_BASE` is configured:

```bash
echo $NEXT_PUBLIC_ADMIN_API_BASE
```

### Rate limiting too aggressive

Adjust the limits:

```bash
GATEWAY_RATE_LIMIT_MAX=1000
GATEWAY_RATE_LIMIT_WINDOW_MS=300000  # 5 minutes
```

### Requests timing out

Increase timeout:

```typescript
const result = await adminApiClient.get('/api/slow-endpoint', {
  timeout: 60000, // 60 seconds
});
```

## Future Improvements

- [ ] Redis-backed rate limiting for distributed deployments
- [ ] Request/response caching layer
- [ ] Circuit breaker pattern for failing services
- [ ] Metrics collection (request counts, latencies, error rates)
- [ ] Request tracing and correlation IDs
- [ ] WebSocket proxying support

## Related Documentation

- [Admin API Client](../lib/api/admin-client.ts)
- [Rate Limiter](../lib/rate-limiter.ts)
- [Auth Server](../lib/auth/server.ts)
