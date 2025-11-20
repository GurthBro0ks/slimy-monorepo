# opps-api

HTTP API service that exposes radar snapshots over HTTP.

## Purpose

This service provides a simple HTTP interface to the radar snapshot functionality from the opps-runtime and opps-core experimental packages.

## Dependencies

- `experimental/opps-core` - Core types and interfaces (imported via relative path)
- `experimental/opps-runtime` - Runtime logic including `buildRadarSnapshot` (imported via relative path)

## Status

This service is **standalone** and **NOT** wired into:
- Monorepo tooling
- Caddy gateway configuration
- Docker compose setup

It's meant to run independently for development and testing.

## How to Run

### Prerequisites

Ensure `experimental/opps-core` and `experimental/opps-runtime` exist and are properly set up.

### Installation and Build

```bash
cd experimental/opps-api
pnpm install
pnpm build
```

### Start Server

```bash
pnpm start
```

Or run directly:

```bash
node dist/server.js
```

### Configuration

The service can be configured via environment variables:

- `PORT` - HTTP port to listen on (default: 4010)

Example:

```bash
PORT=8080 pnpm start
```

## API Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "service": "opps-api"
}
```

### GET /radar

Retrieve a radar snapshot.

**Query Parameters:**
- `mode` (optional) - Either "quick" or "daily" (mostly cosmetic for now)
- `maxPerDomain` (optional) - Maximum opportunities per domain (default: 5)
- `userId` (optional) - User identifier (default: "anonymous")

**Example Request:**

```bash
curl "http://localhost:4010/radar?mode=quick&maxPerDomain=3&userId=test-user"
```

**Example Response:**

```json
{
  "ok": true,
  "mode": "quick",
  "profile": {
    "id": "test-user",
    "maxRiskLevel": "medium",
    "maxCapitalPerOpportunity": null,
    "maxTimePerOpportunityMinutes": 60
  },
  "snapshot": {
    "opportunities": [...],
    "metadata": {...}
  }
}
```

**Error Response:**

```json
{
  "ok": false,
  "error": "Error message here"
}
```

## Architecture

- `src/server.ts` - Express server setup and bootstrap
- `src/config.ts` - Configuration management
- `src/routes/radar.ts` - Radar endpoint handler
- Uses Express for HTTP routing
- Imports from sibling experimental packages via relative paths

## Future Enhancements

- Add more sophisticated user profile preferences
- Support additional query modes
- Add authentication/authorization
- Wire into monorepo infrastructure when ready
- Add to Docker compose setup
- Configure Caddy routing
