# Health Dashboard CLI

A simple CLI tool for checking the health of Slimy.ai services.

## Quick Start

1. **Copy the example config:**
   ```bash
   cp services.json.example services.json
   ```

2. **Edit the config** to match your environment (local, nuc1, nuc2, or production URLs)

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run the health check:**
   ```bash
   npm run check
   ```

## Usage

### Basic Check
```bash
npm run check
```

### Verbose Output
```bash
npm run check:verbose
```

### JSON Output
```bash
npm run check:json
```

### Custom Config File
```bash
npx tsx check-services.ts --config /path/to/custom-config.json
```

## Configuration

The tool reads from `services.json` (copy from `services.json.example`):

```json
{
  "defaults": {
    "timeout": 5000
  },
  "services": [
    {
      "name": "Web App - Health",
      "url": "http://localhost:3000/api/health",
      "timeout": 3000,
      "critical": true
    }
  ]
}
```

### Service Options

- **name**: Human-readable service name
- **url**: Full URL to the health endpoint
- **timeout**: Request timeout in milliseconds (optional)
- **critical**: If true, CLI exits with code 2 when this service fails

## Exit Codes

- **0**: All services healthy
- **1**: Some non-critical services unhealthy
- **2**: Critical services down

## Environment Variables

- **SERVICES_CONFIG**: Path to config file (overridden by `--config` flag)

## Available Endpoints

### Web App (Port 3000)
- `/api/health` - Main health check
- `/api/codes/health` - Codes aggregator health
- `/api/diag` - Diagnostics (proxies to admin API)

### Admin API (Port 3080)
- `/api/health` - Main health check
- `/api/ping` - Simple ping endpoint
- `/api/diag` - Comprehensive diagnostics

## More Information

See [docs/health-dashboard-cli.md](../../docs/health-dashboard-cli.md) for detailed documentation.
