# Monitoring and Health Checks

This document describes the health monitoring and observability features added to the admin-api.

## Overview

The monitoring system provides:
- **Health Status Endpoint**: Comprehensive system status reporting
- **Request Metrics**: In-memory tracking of requests, errors, and response times
- **Error Tracking**: Sentry integration for error monitoring and performance tracking
- **Per-Route Metrics**: Detailed metrics for each API endpoint

## Components

### 1. Health Status Endpoint

**Location**: `src/routes/status.ts`

**Endpoint**: `GET /api/status`

Returns comprehensive system information including:
- Service version and environment
- System uptime (seconds and human-readable format)
- Database connectivity status and response time
- Request metrics (total requests, errors, error rate)
- System resources (memory usage, Node.js version, platform)

**Example Response**:
```json
{
  "ok": true,
  "service": "admin-api",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2025-11-17T10:30:00.000Z",
  "uptime": {
    "seconds": 3600,
    "human": "1h"
  },
  "startedAt": "2025-11-17T09:30:00.000Z",
  "database": {
    "connected": true,
    "responseTime": 5,
    "poolStatus": {
      "totalConnections": 10,
      "activeConnections": 2,
      "idleConnections": 8
    }
  },
  "metrics": {
    "totalRequests": 1250,
    "totalErrors": 3,
    "errorRate": "0.24%"
  },
  "system": {
    "nodeVersion": "v20.11.0",
    "platform": "linux",
    "memory": {
      "used": 85,
      "total": 128,
      "unit": "MB"
    }
  }
}
```

### 2. Monitoring Library

**Location**: `lib/monitoring.ts`

Provides core monitoring functionality:

#### Sentry Setup
```typescript
import { setupSentry } from './lib/monitoring';

// Initialize Sentry (called automatically in server.js if SENTRY_DSN is set)
setupSentry(process.env.SENTRY_DSN);
```

#### Metrics Collection
```typescript
import { collectMetrics, incrementRequests, incrementErrors } from './lib/monitoring';

// Increment counters
incrementRequests();
incrementErrors();

// Get current metrics
const metrics = collectMetrics();
// Returns: { requests: number, errors: number, uptime: number, errorRate: number }
```

### 3. Metrics Middleware

**Location**: `src/middleware/metrics.ts`

Automatically tracks:
- Request count per route
- Response times per route
- Error counts per route (5xx status codes)
- Slow requests (>1s)

The middleware is automatically applied to all routes via `app.js`.

#### Features

**Per-Route Metrics**:
```typescript
import { getRouteMetrics, getAverageResponseTime } from './middleware/metrics';

// Get all route metrics
const allMetrics = getRouteMetrics();

// Get specific route metrics
const routeMetrics = getRouteMetrics('/api/guilds/:id');

// Get average response time for a route
const avgTime = getAverageResponseTime('/api/guilds/:id');
```

**Error Logging with Sentry**:
- Automatically logs errors via logger
- Sends errors to Sentry with context (route, method, IP, user agent)
- Includes request body, query params, and user information

## Configuration

### Environment Variables

Add to your `.env.admin` or `.env` file:

```bash
# Sentry DSN for error tracking (optional)
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id

# Sentry traces sample rate (0.0 to 1.0, default: 0.1)
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Sentry Setup

1. Create a project at [sentry.io](https://sentry.io)
2. Copy your project's DSN
3. Add `SENTRY_DSN` to your environment variables
4. Restart the server

## Usage Examples

### Check System Health

```bash
curl http://localhost:3080/api/status
```

### Monitor Specific Routes

The metrics middleware automatically tracks all routes. Metrics are normalized:
- `/api/guilds/123456` → `/api/guilds/:id`
- UUIDs are replaced with `:uuid`
- Numeric IDs are replaced with `:id`

### Error Tracking

Errors are automatically:
1. Logged via the logger
2. Tracked in metrics (error counter)
3. Sent to Sentry (if configured)

To manually log an error:

```typescript
import { Sentry } from '../lib/monitoring';

try {
  // Your code
} catch (error) {
  logger.error('Operation failed:', error);
  Sentry.captureException(error);
}
```

## Integration

The monitoring system is integrated into the application:

1. **server.js**: Initializes Sentry on startup
2. **app.js**: Applies metrics middleware to all routes
3. **routes/index.js**: Registers the status endpoint

All integration is automatic - no additional setup required beyond configuration.

## Performance Considerations

- Metrics are stored in-memory (reset on server restart)
- Response time tracking uses a sliding window (last 1000 requests)
- Minimal overhead: ~1-2ms per request for metrics tracking

## Future Enhancements

Potential improvements:
- Persistent metrics storage (Redis, TimescaleDB)
- Prometheus metrics export
- Custom dashboards (Grafana integration)
- Alert rules based on error rates/response times
- Database query performance tracking
