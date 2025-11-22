# Admin API Observability

This document describes the observability features implemented in the Admin API service (`apps/admin-api`).

## Overview

The Admin API now includes:
- Centralized error handling with standardized error responses
- Request ID tracking for request tracing
- Structured logging with Pino
- Health and status endpoints for monitoring

## Error Handling

### Error Response Format

All errors from the API follow a standardized JSON format:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "requestId": "uuid-v4-request-id",
    "details": { /* optional additional context */ }
  }
}
```

### Error Codes

Common error codes include:

- **Client Errors (4xx)**:
  - `AUTH_REQUIRED` - Authentication is required (401)
  - `TOKEN_EXPIRED` - Session has expired (401)
  - `FORBIDDEN` - Insufficient permissions (403)
  - `VALIDATION_ERROR` - Request validation failed (400)
  - `BAD_REQUEST` - Malformed request (400)
  - `NOT_FOUND` - Resource or route not found (404)

- **Server Errors (5xx)**:
  - `SERVER_ERROR` - Internal server error (500)
  - `DISCORD_ERROR` - Discord API error (502)
  - `CONFIG_MISSING` - Service not configured (503)

### Error Middleware

The error handler is automatically applied to all routes and:
- Logs errors with request context (method, path, user, requestId)
- Distinguishes between operational errors (4xx) and server errors (5xx)
- In development mode, includes stack traces for non-operational errors
- Ensures all errors return standardized JSON

## Request ID Tracking

### How It Works

Every request is assigned a unique request ID (UUID v4) that:
- Is read from the `X-Request-ID` header if provided by the client
- Is auto-generated if not provided
- Is included in the response as the `X-Request-ID` header
- Is included in all log entries for that request
- Is included in error responses

### Usage

**Client sends request ID:**
```bash
curl -H "X-Request-ID: my-custom-id-123" http://localhost:3080/api/health
```

**Server preserves it in response:**
```http
X-Request-ID: my-custom-id-123
```

**Server generates one if not provided:**
```http
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

## Request Logging

The API uses structured logging with [Pino](https://getpino.io/) for high-performance JSON logging.

### Log Format

Every request is logged with:
- `requestId` - Unique request identifier
- `method` - HTTP method (GET, POST, etc.)
- `path` - Request path
- `statusCode` - Response status code
- `duration` - Request duration in milliseconds
- `ip` - Client IP address
- Service metadata (service name, version, environment, hostname, PID)

### Log Levels

- **INFO**: Normal request/response logging
- **WARN**: Client errors (4xx status codes)
- **ERROR**: Server errors (5xx status codes)

### Development vs Production

- **Development**: Logs are pretty-printed with colors for easier reading
- **Production**: Logs are output as JSON for consumption by monitoring platforms (DataDog, Splunk, etc.)

## Health Endpoints

### GET /api/health

Returns basic service health information. This endpoint is suitable for simple health checks and load balancer probes.

**Response:**
```json
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": "2025-11-22T12:34:56.789Z",
  "version": "1.0.0"
}
```

**Fields:**
- `status`: Service status (always "ok" if responding)
- `uptime`: Service uptime in seconds
- `timestamp`: Current server time in ISO 8601 format
- `version`: Application version from package.json

**Example:**
```bash
curl http://localhost:3080/api/health
```

### GET /api/status

Returns detailed service status including subsystem information. This endpoint provides more context for debugging and monitoring.

**Response:**
```json
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": "2025-11-22T12:34:56.789Z",
  "version": "1.0.0",
  "environment": "production",
  "subsystems": {
    "database": "configured",
    "redis": "unknown"
  }
}
```

**Additional Fields:**
- `environment`: NODE_ENV value (development, production, etc.)
- `subsystems`: Status of key dependencies
  - `database`: "configured" or "not_configured"
  - `redis`: "unknown" (lightweight check, doesn't test connectivity)

**Example:**
```bash
curl http://localhost:3080/api/status
```

## Testing

Run the observability test suite:

```bash
cd apps/admin-api
npm test tests/observability.test.js
```

Or run all tests:

```bash
npm test
```

## Architecture

### Middleware Chain

The middleware is applied in this order:

1. **helmet** - Security headers
2. **requestIdMiddleware** - Assign/read request ID
3. **requestLogger** - Log request start/end
4. **express.json** - Parse JSON bodies
5. **cookieParser** - Parse cookies
6. **cors** - Handle CORS
7. **morgan** - HTTP request logger (optional, can be removed)
8. **readAuth** - Read authentication cookie
9. **routes** - Application routes
10. **notFoundHandler** - Handle 404 for unmatched routes
11. **errorHandler** - Catch and format all errors

### Files

- `src/middleware/request-id.js` - Request ID generation and tracking
- `src/middleware/error-handler.js` - Error handling middleware
- `src/lib/logger.js` - Pino logger configuration and helpers
- `src/lib/errors.js` - Error classes and utilities
- `src/routes/index.js` - Health and status endpoints
- `src/app.js` - Express app with middleware wiring

## Best Practices

### For Developers

1. **Use error classes**: Import and throw specific error classes from `src/lib/errors.js`
   ```javascript
   const { ValidationError, NotFoundError } = require("../lib/errors");

   if (!user) {
     throw new NotFoundError("User not found");
   }
   ```

2. **Include details**: Add context to errors when helpful
   ```javascript
   throw new ValidationError("Invalid input", {
     field: "email",
     reason: "Must be a valid email address"
   });
   ```

3. **Use request logger**: The logger is attached to every request as `req.logger`
   ```javascript
   req.logger.info({ userId: user.id }, "User profile updated");
   ```

4. **Leverage request ID**: Use `req.id` to correlate logs
   ```javascript
   const requestId = req.id;
   // Pass to external services for distributed tracing
   ```

### For Operations

1. **Monitor health endpoint**: Use `/api/health` for load balancer health checks
2. **Use status endpoint**: Query `/api/status` for detailed service information
3. **Correlate logs**: Use `requestId` to trace requests across logs
4. **Alert on patterns**: Set up alerts for specific error codes or high error rates
5. **Track uptime**: Monitor the `uptime` field to detect unexpected restarts

## Future Enhancements

Potential improvements for future iterations:

- Add Redis connectivity check to `/api/status`
- Add database connectivity check (with caching to avoid overhead)
- Add OpenTelemetry for distributed tracing
- Add Prometheus metrics endpoint
- Add request/response time histograms
- Add rate limiting metrics
- Add custom business metrics
