#!/usr/bin/env node
/**
 * Admin Authentication Flow Inspector
 *
 * A standalone diagnostic tool that tests the admin authentication
 * flow endpoints and reports on system health.
 *
 * Usage:
 *   npx tsx inspect-auth-flow.ts
 *
 * Configuration:
 *   Set environment variables in .env file (see .env.example)
 *   - ADMIN_API_BASE: Base URL for admin API (default: http://localhost:3080)
 *   - TEST_TIMEOUT: Timeout for each test in ms (default: 5000)
 *
 * This script is NOT imported anywhere and can safely remain
 * unreferenced until you're ready to integrate it.
 */

import * as https from 'https';
import * as http from 'http';

// ============================================================================
// Configuration
// ============================================================================

interface Config {
  adminApiBase: string;
  testTimeout: number;
  enableColors: boolean;
}

function loadConfig(): Config {
  // Load from env or use defaults
  const adminApiBase = process.env.ADMIN_API_BASE || 'http://localhost:3080';
  const testTimeout = parseInt(process.env.TEST_TIMEOUT || '5000', 10);
  const enableColors = process.env.NO_COLOR !== '1';

  return {
    adminApiBase: adminApiBase.replace(/\/$/, ''), // Remove trailing slash
    testTimeout,
    enableColors,
  };
}

// ============================================================================
// Utilities
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function colorize(text: string, color: keyof typeof colors, config: Config): string {
  if (!config.enableColors) return text;
  return `${colors[color]}${text}${colors.reset}`;
}

function printSection(title: string, config: Config) {
  console.log();
  console.log(colorize(`═══ ${title} ═══`, 'cyan', config));
  console.log();
}

function printSuccess(message: string, config: Config) {
  console.log(colorize('✓', 'green', config) + ' ' + message);
}

function printWarning(message: string, config: Config) {
  console.log(colorize('⚠', 'yellow', config) + ' ' + message);
}

function printError(message: string, config: Config) {
  console.log(colorize('✗', 'red', config) + ' ' + message);
}

function printInfo(message: string, config: Config) {
  console.log(colorize('ℹ', 'cyan', config) + ' ' + message);
}

function indent(text: string, spaces: number = 2): string {
  return text.split('\n').map(line => ' '.repeat(spaces) + line).join('\n');
}

// ============================================================================
// HTTP Client
// ============================================================================

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

interface FetchResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  json?: any;
}

function fetch(url: string, options: FetchOptions = {}): Promise<FetchResponse> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'SlimyAdminAuthInspector/1.0',
        ...options.headers,
      },
      timeout: options.timeout || 5000,
    };

    const req = lib.request(parsedUrl, requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const response: FetchResponse = {
          status: res.statusCode || 0,
          statusText: res.statusMessage || '',
          headers: res.headers as Record<string, string>,
          body: data,
        };

        // Try to parse JSON
        if (data && res.headers['content-type']?.includes('application/json')) {
          try {
            response.json = JSON.parse(data);
          } catch (e) {
            // Not valid JSON, leave as string
          }
        }

        resolve(response);
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// ============================================================================
// Test Functions
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
  duration: number;
}

async function runTest(
  name: string,
  testFn: () => Promise<{ passed: boolean; message: string; details?: any }>
): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const result = await testFn();
    return {
      name,
      passed: result.passed,
      message: result.message,
      details: result.details,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      name,
      passed: false,
      message: error.message || 'Test threw an exception',
      details: { error: error.toString() },
      duration: Date.now() - startTime,
    };
  }
}

// ============================================================================
// Diagnostic Tests
// ============================================================================

async function testApiReachable(config: Config): Promise<TestResult> {
  return runTest('API Reachability', async () => {
    try {
      const response = await fetch(`${config.adminApiBase}/api/diag`, {
        timeout: config.testTimeout,
      });

      if (response.status === 401) {
        return {
          passed: true,
          message: `API is reachable (requires auth)`,
          details: { status: 401, note: 'Endpoint exists but requires authentication' },
        };
      }

      if (response.status >= 200 && response.status < 300) {
        return {
          passed: true,
          message: `API is reachable and responding`,
          details: { status: response.status },
        };
      }

      return {
        passed: false,
        message: `API returned unexpected status: ${response.status}`,
        details: { status: response.status, body: response.body },
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Cannot reach API: ${error.message}`,
        details: { error: error.toString() },
      };
    }
  });
}

async function testLoginEndpoint(config: Config): Promise<TestResult> {
  return runTest('Login Endpoint', async () => {
    try {
      const response = await fetch(`${config.adminApiBase}/api/auth/login`, {
        timeout: config.testTimeout,
      });

      // Login should redirect to Discord
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers['location'] || '';
        if (location.includes('discord.com/oauth2/authorize')) {
          return {
            passed: true,
            message: 'Login endpoint redirects to Discord OAuth',
            details: {
              status: response.status,
              redirectTo: location.substring(0, 100) + '...',
              hasClientId: location.includes('client_id='),
              hasRedirectUri: location.includes('redirect_uri='),
              hasScope: location.includes('scope='),
              hasState: location.includes('state='),
            },
          };
        }

        return {
          passed: false,
          message: `Login redirects but not to Discord: ${location}`,
          details: { location },
        };
      }

      return {
        passed: false,
        message: `Login endpoint returned ${response.status} instead of redirect`,
        details: { status: response.status, body: response.body.substring(0, 200) },
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Login endpoint error: ${error.message}`,
        details: { error: error.toString() },
      };
    }
  });
}

async function testAuthMeEndpoint(config: Config): Promise<TestResult> {
  return runTest('Auth Me Endpoint', async () => {
    try {
      const response = await fetch(`${config.adminApiBase}/api/auth/me`, {
        timeout: config.testTimeout,
      });

      if (response.status === 401) {
        return {
          passed: true,
          message: 'Auth endpoint requires authentication (as expected)',
          details: {
            status: 401,
            note: 'This is correct behavior - endpoint is protected',
          },
        };
      }

      if (response.status === 200 && response.json) {
        return {
          passed: true,
          message: 'Auth endpoint accessible (with valid session)',
          details: {
            status: 200,
            hasUser: !!response.json.id,
            role: response.json.role,
            guildCount: response.json.guilds?.length || 0,
          },
        };
      }

      return {
        passed: false,
        message: `Unexpected response from /auth/me: ${response.status}`,
        details: { status: response.status, body: response.body },
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Auth me endpoint error: ${error.message}`,
        details: { error: error.toString() },
      };
    }
  });
}

async function testDiagEndpoint(config: Config): Promise<TestResult> {
  return runTest('Diagnostics Endpoint', async () => {
    try {
      const response = await fetch(`${config.adminApiBase}/api/diag`, {
        timeout: config.testTimeout,
      });

      if (response.status === 401) {
        return {
          passed: true,
          message: 'Diag endpoint requires authentication',
          details: {
            status: 401,
            note: 'Endpoint is protected - login required to view diagnostics',
          },
        };
      }

      if (response.status === 200 && response.json) {
        const diag = response.json;
        return {
          passed: true,
          message: 'Diagnostics endpoint accessible',
          details: {
            status: 200,
            uptimeSec: diag.admin?.uptimeSec,
            memory: diag.admin?.memory,
            nodeVersion: diag.admin?.node,
            uploadsTotal: diag.uploads?.total,
          },
        };
      }

      return {
        passed: false,
        message: `Unexpected response from /diag: ${response.status}`,
        details: { status: response.status, body: response.body },
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Diag endpoint error: ${error.message}`,
        details: { error: error.toString() },
      };
    }
  });
}

async function testCorsHeaders(config: Config): Promise<TestResult> {
  return runTest('CORS Headers', async () => {
    try {
      const response = await fetch(`${config.adminApiBase}/api/auth/me`, {
        timeout: config.testTimeout,
        headers: {
          'Origin': 'http://test-origin.example.com',
        },
      });

      const corsHeader = response.headers['access-control-allow-origin'];
      const credentialsHeader = response.headers['access-control-allow-credentials'];

      if (!corsHeader) {
        return {
          passed: false,
          message: 'CORS headers not present',
          details: {
            warning: 'This may cause issues with frontend requests',
            headers: response.headers,
          },
        };
      }

      return {
        passed: true,
        message: `CORS configured: ${corsHeader}`,
        details: {
          allowOrigin: corsHeader,
          allowCredentials: credentialsHeader,
          note: corsHeader === '*'
            ? 'Warning: Wildcard CORS is insecure for production'
            : 'Specific origin configured (good)',
        },
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `CORS test error: ${error.message}`,
        details: { error: error.toString() },
      };
    }
  });
}

async function testSecurityHeaders(config: Config): Promise<TestResult> {
  return runTest('Security Headers', async () => {
    try {
      const response = await fetch(`${config.adminApiBase}/api/auth/me`, {
        timeout: config.testTimeout,
      });

      const headers = response.headers;
      const securityHeaders = {
        'x-frame-options': headers['x-frame-options'],
        'x-content-type-options': headers['x-content-type-options'],
        'x-xss-protection': headers['x-xss-protection'],
        'strict-transport-security': headers['strict-transport-security'],
      };

      const presentCount = Object.values(securityHeaders).filter(Boolean).length;

      if (presentCount === 0) {
        return {
          passed: false,
          message: 'No security headers detected',
          details: {
            warning: 'Consider adding Helmet.js middleware',
            checked: Object.keys(securityHeaders),
          },
        };
      }

      return {
        passed: true,
        message: `${presentCount}/4 security headers present`,
        details: securityHeaders,
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Security headers test error: ${error.message}`,
        details: { error: error.toString() },
      };
    }
  });
}

async function testHealthEndpoint(config: Config): Promise<TestResult> {
  return runTest('Health/Uptime Check', async () => {
    try {
      // Try common health check endpoints
      const endpoints = ['/health', '/api/health', '/ping', '/api/ping'];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${config.adminApiBase}${endpoint}`, {
            timeout: 2000,
          });

          if (response.status === 200) {
            return {
              passed: true,
              message: `Health endpoint found at ${endpoint}`,
              details: {
                endpoint,
                status: response.status,
                body: response.body,
              },
            };
          }
        } catch (e) {
          // Try next endpoint
        }
      }

      return {
        passed: false,
        message: 'No standard health endpoint found',
        details: {
          note: 'Tried: /health, /api/health, /ping, /api/ping',
          suggestion: 'Use /api/diag endpoint instead',
        },
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Health check error: ${error.message}`,
        details: { error: error.toString() },
      };
    }
  });
}

// ============================================================================
// Environment Check
// ============================================================================

function checkEnvironmentVariables(config: Config): {
  required: Array<{ name: string; set: boolean; value?: string }>;
  optional: Array<{ name: string; set: boolean; value?: string }>;
} {
  const requiredVars = [
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'DISCORD_REDIRECT_URI',
    'SESSION_SECRET',
    'DATABASE_URL',
  ];

  const optionalVars = [
    'DISCORD_BOT_TOKEN',
    'JWT_SECRET',
    'ROLE_ADMIN_IDS',
    'ROLE_CLUB_IDS',
    'COOKIE_DOMAIN',
    'CORS_ORIGIN',
  ];

  const maskSecret = (value: string | undefined): string => {
    if (!value) return '';
    if (value.length <= 8) return '***';
    return value.substring(0, 4) + '***' + value.substring(value.length - 4);
  };

  return {
    required: requiredVars.map(name => ({
      name,
      set: !!process.env[name],
      value: name.includes('SECRET') || name.includes('TOKEN')
        ? maskSecret(process.env[name])
        : process.env[name],
    })),
    optional: optionalVars.map(name => ({
      name,
      set: !!process.env[name],
      value: name.includes('SECRET') || name.includes('TOKEN')
        ? maskSecret(process.env[name])
        : process.env[name],
    })),
  };
}

// ============================================================================
// Main Report
// ============================================================================

async function main() {
  const config = loadConfig();

  console.log();
  console.log(colorize('╔════════════════════════════════════════════════════════════╗', 'bold', config));
  console.log(colorize('║  Slimy Admin Authentication Flow Inspector                ║', 'bold', config));
  console.log(colorize('╚════════════════════════════════════════════════════════════╝', 'bold', config));
  console.log();

  printInfo(`Target API: ${colorize(config.adminApiBase, 'bold', config)}`, config);
  printInfo(`Timeout: ${config.testTimeout}ms`, config);
  console.log();

  // Environment Variables Check
  printSection('Environment Variables', config);

  const envCheck = checkEnvironmentVariables(config);

  console.log(colorize('Required Variables:', 'bold', config));
  for (const envVar of envCheck.required) {
    if (envVar.set) {
      printSuccess(`${envVar.name}: ${envVar.value || '(set)'}`, config);
    } else {
      printError(`${envVar.name}: NOT SET`, config);
    }
  }

  console.log();
  console.log(colorize('Optional Variables:', 'bold', config));
  for (const envVar of envCheck.optional) {
    if (envVar.set) {
      printInfo(`${envVar.name}: ${envVar.value || '(set)'}`, config);
    } else {
      console.log(colorize(`  ${envVar.name}: not set`, 'dim', config));
    }
  }

  const missingRequired = envCheck.required.filter(v => !v.set).length;
  if (missingRequired > 0) {
    console.log();
    printWarning(`${missingRequired} required variable(s) missing - auth may not work`, config);
  }

  // Run Tests
  printSection('Endpoint Tests', config);

  const tests = [
    testApiReachable(config),
    testLoginEndpoint(config),
    testAuthMeEndpoint(config),
    testDiagEndpoint(config),
    testHealthEndpoint(config),
    testCorsHeaders(config),
    testSecurityHeaders(config),
  ];

  const results = await Promise.all(tests);

  for (const result of results) {
    if (result.passed) {
      printSuccess(`${result.name}: ${result.message}`, config);
    } else {
      printError(`${result.name}: ${result.message}`, config);
    }

    if (result.details && Object.keys(result.details).length > 0) {
      const detailsStr = JSON.stringify(result.details, null, 2);
      console.log(colorize(indent(detailsStr), 'dim', config));
    }

    console.log(colorize(`  (${result.duration}ms)`, 'gray', config));
    console.log();
  }

  // Summary
  printSection('Summary', config);

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;

  if (passedTests === totalTests) {
    printSuccess(`All tests passed (${passedTests}/${totalTests})`, config);
    console.log();
    printInfo('Authentication flow appears healthy', config);
  } else {
    printWarning(`${passedTests}/${totalTests} tests passed`, config);
    console.log();
    printInfo('Review failures above for troubleshooting', config);
  }

  // Recommendations
  printSection('Recommendations', config);

  const recommendations: string[] = [];

  // Check for missing env vars
  if (missingRequired > 0) {
    recommendations.push('⚠ Set missing required environment variables');
  }

  // Check for DISCORD_BOT_TOKEN
  if (!envCheck.optional.find(v => v.name === 'DISCORD_BOT_TOKEN')?.set) {
    recommendations.push('💡 Set DISCORD_BOT_TOKEN for accurate role resolution');
  }

  // Check for CORS
  const corsResult = results.find(r => r.name === 'CORS Headers');
  if (corsResult?.details?.allowOrigin === '*') {
    recommendations.push('🔒 Configure specific CORS_ORIGIN instead of wildcard');
  }

  // Check for security headers
  const securityResult = results.find(r => r.name === 'Security Headers');
  if (securityResult && !securityResult.passed) {
    recommendations.push('🔒 Add Helmet.js middleware for security headers');
  }

  if (recommendations.length === 0) {
    printSuccess('No recommendations - system looks good!', config);
  } else {
    for (const rec of recommendations) {
      console.log('  ' + rec);
    }
  }

  console.log();
  printSection('Next Steps', config);
  console.log('  1. Review docs/admin-auth-flow.md for complete flow documentation');
  console.log('  2. Check apps/admin-api logs for detailed error messages');
  console.log('  3. Test OAuth flow manually: visit /api/auth/login');
  console.log('  4. See docs/admin-auth-diagnostics.md for integration options');
  console.log();
}

// ============================================================================
// Entry Point
// ============================================================================

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main, runTest, loadConfig };
