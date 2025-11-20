# opps-api

HTTP API service that exposes opportunity radar snapshots over HTTP.

## Purpose

This service provides a simple REST API for retrieving opportunity radar snapshots. It uses the core domain logic from `opps-core` and the snapshot builder from `opps-runtime` to generate personalized opportunity recommendations.

## Dependencies

This service depends on:
- `experimental/opps-core` - Core domain types and models
- `experimental/opps-runtime` - Radar snapshot builder logic

Both dependencies are imported via relative paths and must be built before running this service.

## Important Notes

- **This is a standalone service** - It is NOT wired into the monorepo tooling, Caddy gateway, or Docker infrastructure yet.
- **Experimental status** - This service is in the experimental directory and should not be considered production-ready.
- **No infrastructure integration** - You must run this service manually; it won't be automatically started by any existing deployment scripts.

## Installation

From the `experimental/opps-api` directory:

```bash
cd experimental/opps-api
pnpm install
```

## Building

Compile TypeScript to JavaScript:

```bash
pnpm build
```

This will generate compiled JavaScript in the `dist/` directory.

## Running

Start the server:

```bash
pnpm start
```

Or run directly with Node.js:

```bash
node dist/server.js
```

The server will start on port 4010 by default (configurable via `PORT` environment variable).

## API Endpoints

### Health Check

**GET /health**

Returns service health status.

**Response:**
```json
{
  "ok": true,
  "service": "opps-api"
}
```

**Example:**
```bash
curl http://localhost:4010/health
```

### Radar Snapshot

**GET /radar**

Generates and returns an opportunity radar snapshot for a user profile.

**Query Parameters:**
- `mode` (optional): "quick" | "daily" - Operating mode (currently cosmetic)
- `maxPerDomain` (optional, default: 5): Maximum opportunities per domain
- `userId` (optional, default: "anonymous"): User identifier

**Response (success):**
```json
{
  "ok": true,
  "mode": "quick",
  "profile": {
    "id": "test-user",
    "maxRiskLevel": "medium",
    "maxCapitalPerOpportunity": null,
    "maxTimePerOpportunityMinutes": 60,
    "preferredDomains": [],
    "excludedDomains": [],
    "preferredTags": [],
    "excludedTags": []
  },
  "snapshot": {
    // ... radar snapshot data
  }
}
```

**Response (error):**
```json
{
  "ok": false,
  "error": "Error message"
}
```

**Examples:**
```bash
# Basic request
curl http://localhost:4010/radar

# With user ID
curl "http://localhost:4010/radar?userId=test-user"

# Full configuration
curl "http://localhost:4010/radar?mode=quick&maxPerDomain=3&userId=test-user"

# Daily mode with more opportunities
curl "http://localhost:4010/radar?mode=daily&maxPerDomain=10&userId=john-doe"
```

## Configuration

Configuration is managed via environment variables:

- `PORT` (default: 4010) - HTTP port to listen on

**Example:**
```bash
PORT=8080 pnpm start
```

## Development

For rapid development iteration:

```bash
# Clean build artifacts
pnpm clean

# Rebuild and start
pnpm dev
```

## Architecture

```
experimental/opps-api/
├── src/
│   ├── config.ts          # Configuration management
│   ├── server.ts          # Express server setup
│   └── routes/
│       └── radar.ts       # Radar endpoint handler
├── package.json
├── tsconfig.json
└── README.md
```

The service uses:
- **Express** - Minimal, flexible HTTP framework
- **TypeScript** - Type-safe development
- **ES Modules** - Modern JavaScript module system

## Next Steps

To integrate this service into the broader infrastructure:

1. Add to monorepo pnpm workspace configuration
2. Create Docker container configuration
3. Add Caddy reverse proxy rules
4. Set up proper environment variable management
5. Add logging and monitoring
6. Implement authentication/authorization
7. Add rate limiting and request validation

## Troubleshooting

**Module not found errors:**
- Ensure `experimental/opps-core` and `experimental/opps-runtime` are built
- Run `pnpm build` in those directories first

**Port already in use:**
- Change the port: `PORT=4011 pnpm start`
- Check for other processes: `lsof -i :4010`

**TypeScript compilation errors:**
- Verify dependency modules are available
- Check that relative import paths are correct
- Ensure TypeScript versions are compatible
