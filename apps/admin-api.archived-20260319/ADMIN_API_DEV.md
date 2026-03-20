# Admin API - Developer Guide

This guide covers the foundation-ready testing, error handling, and logging infrastructure for the Admin API.

## Table of Contents

- [Quick Start](#quick-start)
- [Running Tests](#running-tests)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [Development Workflow](#development-workflow)

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (workspace manager)

### Install Dependencies

```bash
cd apps/admin-api
pnpm install
```

### Environment Setup

Create `.env.admin` in the monorepo root with:

```env
# Required
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000

# Optional
NODE_ENV=development
LOG_LEVEL=debug
PORT=3080
HOST=127.0.0.1
```

### Start the Server

```bash
pnpm dev
```

Server runs on `http://127.0.0.1:3080`

---

## Running Tests

The Admin API uses **Jest** with **Supertest** for integration testing.

### Test Scripts

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (re-runs on file changes)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

### Test Structure

```
apps/admin-api/
├── tests/
│   ├── integration/          # Integration tests with Supertest
│   │   ├── health.test.js
│   │   ├── error-handling.test.js
│   │   └── auth-flow.test.js
│   ├── auth/                 # Auth middleware unit tests
│   │   └── auth-middleware.test.js
│   └── api/                  # API route tests
│       └── auth-routes.test.js
├── jest.config.js            # Jest configuration
└── jest.setup.js             # Test mocks and setup
```

### Writing Tests

**Example: Testing a Protected Route**

```javascript
const request = require("supertest");

describe("My Route", () => {
  let app;

  beforeAll(() => {
    process.env.CORS_ORIGIN = "http://localhost:3000";
    app = require("../../src/app");
  });

  it("should reject unauthenticated requests", async () => {
    const response = await request(app)
      .get("/api/my-route")
      .expect(401);

    expect(response.body).toMatchObject({
      ok: false,
      code: "UNAUTHORIZED",
    });
  });

  it("should accept authenticated requests", async () => {
    const response = await request(app)
      .get("/api/my-route")
      .set("Cookie", ["slimy_admin=valid-token"])
      .expect(200);

    expect(response.body.ok).toBe(true);
  });
});
```

### Test Mocks

The `jest.setup.js` file provides pre-configured mocks:

- **Database**: Mocked Prisma client with typical responses
- **Sessions**: Mock sessions for `test-user`, `test-admin`, `test-member`
- **JWT**: Mock tokens (`valid-token`, `admin-token`, `member-token`)
- **Logger**: Mocked Pino logger to avoid console spam

---

## Error Handling

The Admin API uses **centralized error handling** with a standardized JSON response format.

### Error Response Format

All errors return this consistent shape:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "requestId": "req-1234567890-abc",
    "details": {
      "optional": "additional context"
    }
  }
}
```

### Example Error Responses

**401 Unauthorized**
```json
{
  "ok": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required",
    "requestId": "req-1732234567-xyz"
  }
}
```

**403 Forbidden**
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions",
    "requestId": "req-1732234567-abc"
  }
}
```

**404 Not Found**
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Route GET /api/missing not found",
    "requestId": "req-1732234567-def"
  }
}
```

**400 Validation Error**
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "requestId": "req-1732234567-ghi",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

**500 Internal Server Error**
```json
{
  "ok": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "Internal server error",
    "requestId": "req-1732234567-jkl"
  }
}
```

**502 External Service Error**
```json
{
  "ok": false,
  "error": {
    "code": "DISCORD_ERROR",
    "message": "Failed to fetch user information from Discord",
    "requestId": "req-1732234567-mno"
  }
}
```

### Using Error Classes in Routes

**Throwing Errors in Routes**

```javascript
const { NotFoundError, ValidationError } = require("../lib/errors");
const { asyncHandler } = require("../middleware/error-handler");

// Example route
router.get("/api/guilds/:id", asyncHandler(async (req, res) => {
  const guild = await db.findGuild(req.params.id);

  if (!guild) {
    throw new NotFoundError("Guild not found");
  }

  res.json({ ok: true, data: guild });
}));
```

**Available Error Classes**

| Error Class | Status | Use Case |
|------------|--------|----------|
| `AuthenticationError` | 401 | Missing or invalid auth |
| `TokenExpiredError` | 401 | Expired session token |
| `AuthorizationError` | 403 | Insufficient permissions |
| `ValidationError` | 400 | Invalid request data |
| `BadRequestError` | 400 | Malformed request |
| `NotFoundError` | 404 | Resource not found |
| `ExternalServiceError` | 502 | Upstream service failure |
| `ConfigurationError` | 503 | Service misconfiguration |
| `InternalServerError` | 500 | Unexpected errors |

### Error Middleware Flow

1. **Route Handler** throws or passes error to `next(err)`
2. **Error Handler** (`src/middleware/error-handler.js`) catches it
3. **Logger** logs with context (requestId, user, path)
4. **Response** formatted and sent to client

---

## Logging

The Admin API uses **Pino** for high-performance structured logging.

### Log Levels

Set via `LOG_LEVEL` env variable:

- `debug` - Verbose logging (default in development)
- `info` - General information (default in production)
- `warn` - Warnings
- `error` - Errors only

### Request Logging

Every request automatically gets:

- **Request ID**: Unique identifier for tracing
- **Logger Instance**: Attached to `req.logger`
- **Automatic Logging**: Request start and completion

**Incoming Request Log**
```json
{
  "level": "INFO",
  "time": "2025-11-22T12:34:56.789Z",
  "service": "slimy-admin-api",
  "requestId": "req-1732234567-abc",
  "method": "GET",
  "path": "/api/guilds",
  "query": {},
  "ip": "127.0.0.1",
  "msg": "Incoming request"
}
```

**Completed Request Log**
```json
{
  "level": "INFO",
  "time": "2025-11-22T12:34:56.890Z",
  "service": "slimy-admin-api",
  "requestId": "req-1732234567-abc",
  "method": "GET",
  "path": "/api/guilds",
  "statusCode": 200,
  "duration": 101,
  "msg": "Request completed"
}
```

### Using the Logger in Routes

```javascript
router.get("/api/example", async (req, res) => {
  // Logger is automatically attached to req
  req.logger.info("Processing example request");

  try {
    const data = await fetchData();
    req.logger.info({ count: data.length }, "Fetched data successfully");
    res.json({ ok: true, data });
  } catch (err) {
    req.logger.error({ error: err }, "Failed to fetch data");
    throw err; // Will be caught by error handler
  }
});
```

### Request ID Tracking

**Client-Provided Request ID**

Clients can provide a request ID via header:

```bash
curl -H "x-request-id: my-custom-id-123" http://localhost:3080/api/health
```

**Auto-Generated Request ID**

If not provided, the server generates one: `req-{timestamp}-{random}`

### Error Logging

Errors are automatically logged with context:

```json
{
  "level": "ERROR",
  "time": "2025-11-22T12:34:56.999Z",
  "service": "slimy-admin-api",
  "requestId": "req-1732234567-abc",
  "method": "GET",
  "path": "/api/guilds/123",
  "user": "user-456",
  "error": {
    "name": "NotFoundError",
    "message": "Guild not found",
    "code": "NOT_FOUND",
    "statusCode": 404,
    "stack": "NotFoundError: Guild not found\n    at ..."
  },
  "msg": "Server error"
}
```

---

## Development Workflow

### Adding a New Route

1. **Create Route File** in `src/routes/my-route.js`
2. **Use Error Classes** for consistent error handling
3. **Use Logger** for observability
4. **Write Tests** in `tests/integration/my-route.test.js`

**Example Route:**

```javascript
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/error-handler");
const { NotFoundError } = require("../lib/errors");

router.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  req.logger.info({ id: req.params.id }, "Fetching resource");

  const resource = await db.findById(req.params.id);

  if (!resource) {
    throw new NotFoundError("Resource not found");
  }

  res.json({ ok: true, data: resource });
}));

module.exports = router;
```

### Testing Your Route

```javascript
const request = require("supertest");

describe("My Route", () => {
  let app;

  beforeAll(() => {
    process.env.CORS_ORIGIN = "http://localhost:3000";
    app = require("../../src/app");
  });

  it("should return resource for authenticated user", async () => {
    const response = await request(app)
      .get("/api/my-route/123")
      .set("Cookie", ["slimy_admin=valid-token"])
      .expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.data).toBeDefined();
  });

  it("should return 404 for non-existent resource", async () => {
    const response = await request(app)
      .get("/api/my-route/999")
      .set("Cookie", ["slimy_admin=valid-token"])
      .expect(404);

    expect(response.body).toMatchObject({
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "Resource not found",
        requestId: expect.any(String),
      },
    });
  });
});
```

### Debugging

**Enable Debug Logs**

```bash
LOG_LEVEL=debug pnpm dev
```

**Check Request IDs**

Use `x-request-id` header to trace requests through logs:

```bash
curl -H "x-request-id: debug-123" http://localhost:3080/api/health
```

Then search logs for `"requestId": "debug-123"`

---

## Additional Resources

- **Error Classes**: `src/lib/errors.js`
- **Error Middleware**: `src/middleware/error-handler.js`
- **Logger**: `src/lib/logger.js`
- **Auth Middleware**: `src/middleware/auth.js`
- **Test Setup**: `jest.setup.js`

---

## TODOs / Follow-ups

- [ ] Expand test coverage to >80% for critical routes
- [ ] Add end-to-end tests with real database (optional)
- [ ] Set up CI/CD test automation
- [ ] Consider adding OpenAPI/Swagger docs
- [ ] Add performance benchmarks for critical endpoints
