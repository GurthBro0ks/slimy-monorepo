# opps-cli

Local CLI tool for querying opps-api radar snapshots. This is an **experimental** tool for local development and is **not** integrated into the root monorepo scripts.

## Overview

`opps-cli` provides a command-line interface to interact with the opps-api service, allowing you to:
- Fetch radar snapshots with various filtering options
- Display opportunities grouped by domain
- Get personalized results based on user profiles
- Pretty-print results to the terminal

## Prerequisites

- Node.js 18+ (for native fetch support)
- A running instance of `opps-api` (default: http://localhost:4010)
- TypeScript (dev dependency, automatically installed)

## Installation & Setup

### 1. Install dependencies

From the `experimental/opps-cli` directory:

```bash
pnpm install
```

### 2. Build the project

```bash
pnpm build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 3. (Optional) Link for global usage

To use `opps-cli` as a global command:

```bash
pnpm link --global
```

Or run directly with Node:

```bash
node dist/index.js <command> [options]
```

## Usage

### Basic Command

```bash
opps-cli radar
```

Fetches a quick radar snapshot from the default API endpoint.

### With Options

```bash
# Daily mode with max 3 opportunities per domain
opps-cli radar --mode daily --per-domain 3

# Quick mode for a specific user
opps-cli radar --mode quick --user gurth

# Combine options
opps-cli radar --mode daily --per-domain 5 --user alice
```

### Custom API Endpoint

Set the `OPPS_API_BASE_URL` environment variable:

```bash
OPPS_API_BASE_URL=http://localhost:8080 opps-cli radar
```

Or add to your shell profile:

```bash
export OPPS_API_BASE_URL=http://192.168.1.100:4010
opps-cli radar
```

## Commands

### `radar`

Fetch and display radar snapshot from opps-api.

**Options:**
- `--mode, -m <mode>` - Radar mode: `quick` or `daily` (default: quick)
- `--per-domain, -p <number>` - Maximum opportunities per domain
- `--user, -u <userId>` - User ID for personalized results
- `--help, -h` - Display help message

**Examples:**

```bash
# Quick scan (default)
opps-cli radar

# Daily comprehensive scan
opps-cli radar --mode daily

# Limit results per domain
opps-cli radar --per-domain 2

# User-specific radar
opps-cli radar --user bob --mode daily
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPPS_API_BASE_URL` | Base URL for opps-api | `http://localhost:4010` |

## Development

### Watch Mode

Rebuild automatically on file changes:

```bash
pnpm dev
```

### Running Tests

```bash
pnpm test
```

### Clean Build Artifacts

```bash
pnpm clean
```

## Output Format

The CLI pretty-prints radar snapshots with:
- Domain grouping
- Opportunity titles and URLs
- Short summaries
- Risk levels with color-coded emoji indicators:
  - 🟢 Low risk
  - 🟡 Medium risk
  - 🔴 High risk
- Estimated rewards and time commitments
- Last checked timestamps

**Example Output:**

```
🔍 Fetching radar snapshot from: http://localhost:4010/radar?mode=quick

═══════════════════════════════════════════════════════════════
                    📡 RADAR SNAPSHOT
═══════════════════════════════════════════════════════════════

Mode: quick

Found 2 domain(s) with opportunities:

───────────────────────────────────────────────────────────────
🌐 Domain: github.com
   Opportunities: 2
───────────────────────────────────────────────────────────────

  1. Fix TypeScript compilation error
     🔗 https://github.com/org/repo/issues/123
     📝 Type mismatch in authentication module
     🟢 Risk: low
     💰 100 | ⏱️  2h

  2. Add dark mode support
     🔗 https://github.com/org/repo/issues/456
     📝 Implement theme switching functionality
     🟡 Risk: medium
     💰 250 | ⏱️  8h
```

## Architecture

```
experimental/opps-cli/
├── src/
│   ├── index.ts              # CLI entrypoint & argument parser
│   ├── types.ts              # TypeScript type definitions
│   └── commands/
│       └── radar.ts          # Radar command implementation
├── dist/                     # Compiled JavaScript (git-ignored)
├── package.json
├── tsconfig.json
└── README.md
```

## Notes

- This tool is **experimental** and not part of the main monorepo workflow
- It expects a running instance of `opps-api` to be available
- By default, connects to `http://localhost:4010`
- No authentication is currently implemented (assumes local development)
- The tool uses Node's native `fetch` API (requires Node 18+)

## Troubleshooting

### Connection Refused

If you see connection errors:
1. Ensure `opps-api` is running on the expected port
2. Check the `OPPS_API_BASE_URL` environment variable
3. Verify network connectivity to the API endpoint

### TypeScript Errors

If you encounter TypeScript errors during build:
1. Ensure Node.js types are installed: `pnpm install`
2. Check TypeScript version: `pnpm list typescript`
3. Clean and rebuild: `pnpm clean && pnpm build`

### Runtime Errors

If the CLI fails at runtime:
1. Verify the build succeeded: check `dist/` directory exists
2. Ensure proper file permissions: `chmod +x dist/index.js`
3. Check Node.js version: `node --version` (should be 18+)

## Future Enhancements

Potential improvements for this experimental tool:
- Add authentication support (API keys, tokens)
- Implement caching for offline viewing
- Add JSON output mode for scripting
- Support filtering by risk level or domain
- Add interactive mode with prompt selection
- Export results to CSV or markdown files
