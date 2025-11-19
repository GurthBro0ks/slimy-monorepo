#!/usr/bin/env node

/**
 * Health Check CLI Tool for Slimy.ai Services
 *
 * Checks the health of various services by hitting their health endpoints
 * and prints a consolidated health report.
 *
 * Usage:
 *   node check-services.ts [--config path/to/config.json] [--verbose] [--json]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ServiceConfig {
  name: string;
  url: string;
  timeout?: number;
  critical?: boolean;
}

interface Config {
  services: ServiceConfig[];
  defaults?: {
    timeout?: number;
  };
}

interface HealthCheckResult {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'timeout' | 'error';
  statusCode?: number;
  responseTime?: number;
  message?: string;
  response?: any;
  critical?: boolean;
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Parse command line arguments
function parseArgs(): { configPath: string; verbose: boolean; json: boolean } {
  const args = process.argv.slice(2);
  let configPath = path.join(__dirname, 'services.json');
  let verbose = false;
  let json = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) {
      configPath = args[i + 1];
      i++;
    } else if (args[i] === '--verbose' || args[i] === '-v') {
      verbose = true;
    } else if (args[i] === '--json') {
      json = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Health Check CLI Tool for Slimy.ai Services

Usage:
  node check-services.ts [options]

Options:
  --config <path>   Path to config file (default: ./services.json)
  --verbose, -v     Show detailed output
  --json            Output results as JSON
  --help, -h        Show this help message

Environment Variables:
  SERVICES_CONFIG   Path to config file (overridden by --config)
      `);
      process.exit(0);
    }
  }

  // Check for environment variable
  if (process.env.SERVICES_CONFIG && args.indexOf('--config') === -1) {
    configPath = process.env.SERVICES_CONFIG;
  }

  return { configPath, verbose, json };
}

// Load configuration
function loadConfig(configPath: string): Config {
  try {
    const absolutePath = path.isAbsolute(configPath)
      ? configPath
      : path.join(process.cwd(), configPath);

    if (!fs.existsSync(absolutePath)) {
      console.error(`${colors.red}Error: Config file not found: ${absolutePath}${colors.reset}`);
      console.error(`\nTip: Copy services.json.example to services.json and configure your endpoints.`);
      process.exit(1);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const config = JSON.parse(content);

    if (!config.services || !Array.isArray(config.services)) {
      console.error(`${colors.red}Error: Invalid config format. Expected 'services' array.${colors.reset}`);
      process.exit(1);
    }

    return config;
  } catch (error) {
    console.error(`${colors.red}Error loading config:${colors.reset}`, error);
    process.exit(1);
  }
}

// Perform HTTP health check
function checkHealth(service: ServiceConfig, defaultTimeout: number = 5000): Promise<HealthCheckResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeout = service.timeout || defaultTimeout;
    const url = new URL(service.url);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      timeout: timeout,
      headers: {
        'User-Agent': 'Slimy-Health-Check-CLI/1.0',
      },
    };

    const req = httpModule.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        let parsedResponse: any = null;

        try {
          parsedResponse = JSON.parse(data);
        } catch (e) {
          // Response is not JSON
          parsedResponse = data;
        }

        const isHealthy = res.statusCode && res.statusCode >= 200 && res.statusCode < 300;

        resolve({
          name: service.name,
          url: service.url,
          status: isHealthy ? 'healthy' : 'unhealthy',
          statusCode: res.statusCode,
          responseTime,
          response: parsedResponse,
          critical: service.critical,
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: service.name,
        url: service.url,
        status: 'timeout',
        responseTime: timeout,
        message: `Request timed out after ${timeout}ms`,
        critical: service.critical,
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        name: service.name,
        url: service.url,
        status: 'error',
        responseTime,
        message: error.message,
        critical: service.critical,
      });
    });

    req.end();
  });
}

// Format response time with color
function formatResponseTime(ms: number): string {
  if (ms < 100) {
    return `${colors.green}${ms}ms${colors.reset}`;
  } else if (ms < 500) {
    return `${colors.yellow}${ms}ms${colors.reset}`;
  } else {
    return `${colors.red}${ms}ms${colors.reset}`;
  }
}

// Print health check results
function printResults(results: HealthCheckResult[], verbose: boolean) {
  console.log(`\n${colors.bright}${colors.cyan}=== Slimy.ai Health Check Report ===${colors.reset}\n`);

  let healthyCount = 0;
  let unhealthyCount = 0;
  let criticalFailures = 0;

  results.forEach((result) => {
    let statusIcon = '';
    let statusColor = colors.reset;
    let statusText = '';

    switch (result.status) {
      case 'healthy':
        statusIcon = '✓';
        statusColor = colors.green;
        statusText = 'HEALTHY';
        healthyCount++;
        break;
      case 'unhealthy':
        statusIcon = '✗';
        statusColor = colors.red;
        statusText = 'UNHEALTHY';
        unhealthyCount++;
        if (result.critical) criticalFailures++;
        break;
      case 'timeout':
        statusIcon = '⏱';
        statusColor = colors.yellow;
        statusText = 'TIMEOUT';
        unhealthyCount++;
        if (result.critical) criticalFailures++;
        break;
      case 'error':
        statusIcon = '✗';
        statusColor = colors.red;
        statusText = 'ERROR';
        unhealthyCount++;
        if (result.critical) criticalFailures++;
        break;
    }

    const criticalBadge = result.critical ? ` ${colors.red}[CRITICAL]${colors.reset}` : '';
    console.log(`${statusColor}${statusIcon} ${result.name}${colors.reset}${criticalBadge}`);
    console.log(`  Status: ${statusColor}${statusText}${colors.reset}`);

    if (result.statusCode) {
      console.log(`  HTTP Status: ${result.statusCode}`);
    }

    if (result.responseTime !== undefined) {
      console.log(`  Response Time: ${formatResponseTime(result.responseTime)}`);
    }

    if (result.message) {
      console.log(`  ${colors.red}Message: ${result.message}${colors.reset}`);
    }

    if (verbose && result.response) {
      console.log(`  Response: ${JSON.stringify(result.response, null, 2).split('\n').join('\n  ')}`);
    }

    console.log();
  });

  // Summary
  console.log(`${colors.bright}${colors.cyan}=== Summary ===${colors.reset}`);
  console.log(`Total Services: ${results.length}`);
  console.log(`${colors.green}Healthy: ${healthyCount}${colors.reset}`);
  console.log(`${colors.red}Unhealthy: ${unhealthyCount}${colors.reset}`);

  if (criticalFailures > 0) {
    console.log(`${colors.red}${colors.bright}Critical Failures: ${criticalFailures}${colors.reset}`);
  }

  console.log();

  // Exit with appropriate code
  if (criticalFailures > 0) {
    console.log(`${colors.red}${colors.bright}Critical services are down!${colors.reset}`);
    process.exit(2);
  } else if (unhealthyCount > 0) {
    console.log(`${colors.yellow}Some services are unhealthy${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bright}All services are healthy!${colors.reset}`);
    process.exit(0);
  }
}

// Main function
async function main() {
  const { configPath, verbose, json } = parseArgs();

  if (!json) {
    console.log(`${colors.cyan}Loading config from: ${configPath}${colors.reset}`);
  }

  const config = loadConfig(configPath);
  const defaultTimeout = config.defaults?.timeout || 5000;

  if (!json) {
    console.log(`${colors.cyan}Checking ${config.services.length} service(s)...${colors.reset}`);
  }

  // Run all health checks in parallel
  const results = await Promise.all(
    config.services.map((service) => checkHealth(service, defaultTimeout))
  );

  if (json) {
    console.log(JSON.stringify(results, null, 2));
    const unhealthy = results.filter((r) => r.status !== 'healthy');
    const critical = unhealthy.filter((r) => r.critical);
    process.exit(critical.length > 0 ? 2 : unhealthy.length > 0 ? 1 : 0);
  } else {
    printResults(results, verbose);
  }
}

// Run the CLI
main().catch((error) => {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
  process.exit(1);
});
