# Health Dashboard CLI

## Overview

The Health Dashboard CLI is a simple command-line tool that monitors the health of Slimy.ai services by hitting their health check endpoints and displaying a consolidated status report.

## Features

- **Configurable**: Easy JSON-based configuration for multiple services
- **Parallel Checks**: All health checks run concurrently for fast results
- **Flexible Output**: Human-readable or JSON output formats
- **Timeout Handling**: Graceful handling of slow or unresponsive services
- **Exit Codes**: Different exit codes for healthy, degraded, and critical failures
- **Color-Coded Output**: Visual status indicators for quick assessment
- **Critical Service Tracking**: Mark essential services to get appropriate alerts

## Installation

### From Laptop (Local Development)

1. Navigate to the tool directory:
   ```bash
   cd tools/health-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy and configure the services file:
   ```bash
   cp services.json.example services.json
   ```

4. Edit `services.json` to use local URLs:
   ```json
   {
     "services": [
       {
         "name": "Web App - Health",
         "url": "http://localhost:3000/api/health",
         "critical": true
       },
       {
         "name": "Admin API - Health",
         "url": "http://localhost:3080/api/health",
         "critical": true
       }
     ]
   }
   ```

### From Server (nuc1/nuc2)

1. SSH into the server:
   ```bash
   ssh user@nuc1.local
   # or
   ssh user@nuc2.local
   ```

2. Navigate to the monorepo and tool directory:
   ```bash
   cd /path/to/slimy-monorepo/tools/health-dashboard
   ```

3. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

4. Copy and configure the services file:
   ```bash
   cp services.json.example services.json
   ```

5. Edit `services.json` with production or server-specific URLs:
   ```json
   {
     "services": [
       {
         "name": "Web App - Health",
         "url": "http://localhost:3000/api/health",
         "critical": true
       },
       {
         "name": "Admin API - Health",
         "url": "http://localhost:3080/api/health",
         "critical": true
       }
     ]
   }
   ```

   Or use external URLs if checking from a different server:
   ```json
   {
     "services": [
       {
         "name": "NUC1 Web App",
         "url": "http://nuc1.local:3000/api/health",
         "critical": true
       },
       {
         "name": "NUC2 Web App",
         "url": "http://nuc2.local:3000/api/health",
         "critical": false
       }
     ]
   }
   ```

## Usage

### Basic Commands

#### Run Health Check
```bash
npm run check
```

Output:
```
Loading config from: /path/to/services.json
Checking 6 service(s)...

=== Slimy.ai Health Check Report ===

✓ Web App - Health
  Status: HEALTHY
  HTTP Status: 200
  Response Time: 45ms

✓ Admin API - Health
  Status: HEALTHY
  HTTP Status: 200
  Response Time: 32ms

=== Summary ===
Total Services: 6
Healthy: 6
Unhealthy: 0

All services are healthy!
```

#### Verbose Output (Show Full Responses)
```bash
npm run check:verbose
```

#### JSON Output (For Scripting/Automation)
```bash
npm run check:json
```

Output:
```json
[
  {
    "name": "Web App - Health",
    "url": "http://localhost:3000/api/health",
    "status": "healthy",
    "statusCode": 200,
    "responseTime": 45,
    "response": {
      "ok": true,
      "ts": "2024-11-19T10:30:15.123Z",
      "env": "production"
    },
    "critical": true
  }
]
```

#### Custom Config File
```bash
npx tsx check-services.ts --config /path/to/custom-config.json
```

#### Using Environment Variable
```bash
SERVICES_CONFIG=/path/to/config.json npm run check
```

### Advanced Usage

#### Check Specific Environment
```bash
# Local development
npx tsx check-services.ts --config configs/local.json

# Production
npx tsx check-services.ts --config configs/production.json

# NUC1
npx tsx check-services.ts --config configs/nuc1.json
```

#### Continuous Monitoring (Shell Loop)
```bash
# Check every 30 seconds
while true; do
  npm run check
  sleep 30
done
```

#### Integration with Cron
```bash
# Add to crontab for periodic checks
# Check every 5 minutes and log results
*/5 * * * * cd /path/to/slimy-monorepo/tools/health-dashboard && npm run check >> /var/log/health-check.log 2>&1
```

## Configuration Reference

### Config File Structure

```json
{
  "defaults": {
    "timeout": 5000
  },
  "services": [
    {
      "name": "Service Name",
      "url": "http://example.com/api/health",
      "timeout": 3000,
      "critical": true
    }
  ]
}
```

### Configuration Options

#### Global Defaults
- **timeout**: Default timeout in milliseconds for all services (default: 5000)

#### Service Configuration
- **name** (required): Human-readable service name for display
- **url** (required): Full URL to the health check endpoint
- **timeout** (optional): Override default timeout for this service in milliseconds
- **critical** (optional): Boolean flag indicating if this is a critical service
  - If `true`, the CLI will exit with code 2 when this service fails
  - If `false` or omitted, failures only cause exit code 1

### Example Configurations

#### Local Development
```json
{
  "defaults": {
    "timeout": 3000
  },
  "services": [
    {
      "name": "Web App - Health",
      "url": "http://localhost:3000/api/health",
      "critical": true
    },
    {
      "name": "Web App - Codes Health",
      "url": "http://localhost:3000/api/codes/health",
      "critical": false
    },
    {
      "name": "Admin API - Health",
      "url": "http://localhost:3080/api/health",
      "critical": true
    },
    {
      "name": "Admin API - Ping",
      "url": "http://localhost:3080/api/ping",
      "critical": false
    }
  ]
}
```

#### Production/Server Deployment
```json
{
  "defaults": {
    "timeout": 5000
  },
  "services": [
    {
      "name": "Production Web - Health",
      "url": "https://slimy.ai/api/health",
      "timeout": 3000,
      "critical": true
    },
    {
      "name": "Production Web - Codes",
      "url": "https://slimy.ai/api/codes/health",
      "critical": false
    },
    {
      "name": "Admin API - Health",
      "url": "https://admin.slimy.ai/api/health",
      "timeout": 3000,
      "critical": true
    }
  ]
}
```

#### Multi-Server Monitoring
```json
{
  "services": [
    {
      "name": "NUC1 Web App",
      "url": "http://nuc1.local:3000/api/health",
      "critical": true
    },
    {
      "name": "NUC1 Admin API",
      "url": "http://nuc1.local:3080/api/health",
      "critical": true
    },
    {
      "name": "NUC2 Web App",
      "url": "http://nuc2.local:3000/api/health",
      "critical": false
    },
    {
      "name": "NUC2 Admin API",
      "url": "http://nuc2.local:3080/api/health",
      "critical": false
    }
  ]
}
```

## Available Health Endpoints

### Web App (Default Port: 3000)

#### `/api/health`
- **Purpose**: Main application health check
- **Response**:
  ```json
  {
    "ok": true,
    "ts": "2024-11-19T10:30:15.123Z",
    "env": "production"
  }
  ```
- **Caching**: 60 second cache with 120 second stale-while-revalidate
- **Critical**: Yes

#### `/api/codes/health`
- **Purpose**: Codes aggregator service health
- **Response** (Success):
  ```json
  {
    "status": "healthy",
    "service": "codes",
    "timestamp": "2024-11-19T10:30:15.123Z"
  }
  ```
- **Response** (Failure):
  ```json
  {
    "status": "unhealthy",
    "service": "codes",
    "error": "Health check failed",
    "timestamp": "2024-11-19T10:30:15.123Z"
  }
  ```
- **Critical**: No (depends on use case)

#### `/api/diag`
- **Purpose**: Diagnostics endpoint (proxies to admin API)
- **Response**: See Admin API `/api/diag`
- **Caching**: 60 second TTL
- **Critical**: No

### Admin API (Default Port: 3080)

#### `/api/health`
- **Purpose**: Main admin API health check
- **Response**:
  ```json
  {
    "ok": true,
    "service": "admin-api",
    "env": "development",
    "timestamp": "2024-11-19T10:30:15.123Z"
  }
  ```
- **Authentication**: None (public)
- **Critical**: Yes

#### `/api/ping`
- **Purpose**: Simple connectivity check
- **Response**:
  ```json
  {
    "ok": true,
    "now": "2024-11-19T10:30:15.123Z"
  }
  ```
- **Authentication**: None (public)
- **Critical**: No

#### `/api/diag`
- **Purpose**: Comprehensive diagnostics
- **Response**:
  ```json
  {
    "ok": true,
    "admin": {
      "uptimeSec": 86400,
      "memory": {
        "rssMb": 256.5,
        "heapUsedMb": 145.2
      },
      "node": "v18.17.0",
      "pid": 12345,
      "hostname": "admin-api-1"
    },
    "uploads": {
      "total": 1234,
      "today": 42,
      "byGuild": { "123456789": 5 }
    }
  }
  ```
- **Authentication**: Required
- **Critical**: No

## Exit Codes

The CLI uses exit codes to indicate the overall health status:

- **0**: All services are healthy
- **1**: Some non-critical services are unhealthy
- **2**: One or more critical services are down

### Example Usage in Scripts

```bash
#!/bin/bash

cd /path/to/slimy-monorepo/tools/health-dashboard

npm run check:json > /tmp/health-status.json
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "All systems operational"
elif [ $EXIT_CODE -eq 1 ]; then
  echo "Warning: Some services degraded"
  # Send warning notification
elif [ $EXIT_CODE -eq 2 ]; then
  echo "CRITICAL: Essential services down!"
  # Send critical alert
fi

exit $EXIT_CODE
```

## Troubleshooting

### Config File Not Found
```
Error: Config file not found: /path/to/services.json
Tip: Copy services.json.example to services.json and configure your endpoints.
```

**Solution**: Copy the example config and edit it:
```bash
cp services.json.example services.json
nano services.json
```

### Connection Refused
```
✗ Web App - Health
  Status: ERROR
  Message: connect ECONNREFUSED 127.0.0.1:3000
```

**Possible Causes**:
- Service is not running
- Wrong URL or port in config
- Firewall blocking connection

**Solutions**:
- Check if service is running: `docker ps` or `pm2 list`
- Verify URL and port in `services.json`
- Check firewall rules

### Request Timeout
```
⏱ Admin API - Health
  Status: TIMEOUT
  Message: Request timed out after 5000ms
```

**Possible Causes**:
- Service is overloaded or slow
- Network latency
- Timeout value too low

**Solutions**:
- Increase timeout in config
- Check service performance
- Check network connectivity

### Invalid JSON Response
If a health endpoint returns non-JSON data, the CLI will still work but won't parse the response. Use `--verbose` to see raw responses.

## Integration Examples

### Docker Healthcheck
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD cd /app/tools/health-dashboard && npm run check:json || exit 1
```

### Kubernetes Liveness Probe
```yaml
livenessProbe:
  exec:
    command:
      - /bin/sh
      - -c
      - cd /app/tools/health-dashboard && npm run check:json
  initialDelaySeconds: 30
  periodSeconds: 30
  timeoutSeconds: 5
```

### GitHub Actions / CI/CD
```yaml
- name: Health Check
  run: |
    cd tools/health-dashboard
    cp services.json.example services.json
    # Update config with production URLs
    sed -i 's/localhost:3000/production.slimy.ai/g' services.json
    npm install
    npm run check
```

### Monitoring Dashboard Integration
```bash
# Export to monitoring system
npm run check:json | curl -X POST https://monitoring.example.com/api/metrics \
  -H "Content-Type: application/json" \
  -d @-
```

## Best Practices

1. **Mark Critical Services**: Always set `critical: true` for essential services
2. **Appropriate Timeouts**: Set lower timeouts for fast endpoints, higher for diagnostic endpoints
3. **Regular Monitoring**: Run checks periodically (every 1-5 minutes)
4. **Multiple Configs**: Maintain separate configs for different environments
5. **Version Control**: Commit `services.json.example` but not `services.json` (add to .gitignore if needed)
6. **Logging**: Redirect output to logs for historical tracking
7. **Alerting**: Integrate with alerting systems for critical failures

## Future Enhancements

Potential improvements for future versions:

- [ ] Support for authenticated endpoints (API keys, bearer tokens)
- [ ] Webhook notifications on failures
- [ ] Historical data storage and trending
- [ ] Web-based dashboard view
- [ ] Custom response validators (beyond HTTP status)
- [ ] Retry logic for transient failures
- [ ] Prometheus metrics export
- [ ] Slack/Discord integration

## Contributing

To add new features or fix bugs:

1. Make changes to `check-services.ts`
2. Test thoroughly with different scenarios
3. Update this documentation
4. Submit a pull request

## License

This tool is part of the Slimy.ai monorepo. Internal use only.
