#!/usr/bin/env node

import { runRadarCommand } from './commands/radar.js';
import type { RadarCommandOptions } from './types.js';

/**
 * Parse command-line arguments
 */
function parseArgs(args: string[]): { command: string; options: RadarCommandOptions } {
  const command = args[0] || '';
  const options: RadarCommandOptions = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--mode':
      case '-m':
        const mode = args[++i];
        if (mode === 'quick' || mode === 'daily') {
          options.mode = mode;
        } else {
          console.error(`Invalid mode: ${mode}. Use 'quick' or 'daily'.`);
          process.exit(1);
        }
        break;

      case '--per-domain':
      case '--max-per-domain':
      case '-p':
        const maxPerDomain = parseInt(args[++i], 10);
        if (isNaN(maxPerDomain) || maxPerDomain < 0) {
          console.error(`Invalid max-per-domain: ${args[i]}. Must be a positive number.`);
          process.exit(1);
        }
        options.maxPerDomain = maxPerDomain;
        break;

      case '--user':
      case '--user-id':
      case '-u':
        options.userId = args[++i];
        break;

      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;

      default:
        console.error(`Unknown option: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return { command, options };
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
opps-cli - Local CLI tool for querying opps-api radar snapshots

USAGE:
  opps-cli <command> [options]

COMMANDS:
  radar       Fetch and display radar snapshot

OPTIONS:
  --mode, -m <mode>           Set radar mode: 'quick' or 'daily' (default: quick)
  --per-domain, -p <number>   Max opportunities per domain (default: varies by mode)
  --user, -u <userId>         User ID for personalized results
  --help, -h                  Show this help message

ENVIRONMENT VARIABLES:
  OPPS_API_BASE_URL          Base URL for opps-api (default: http://localhost:4010)

EXAMPLES:
  opps-cli radar
  opps-cli radar --mode daily
  opps-cli radar --mode quick --per-domain 3
  opps-cli radar --user gurth --mode daily
  OPPS_API_BASE_URL=http://localhost:8080 opps-cli radar
`);
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printHelp();
    process.exit(1);
  }

  const { command, options } = parseArgs(args);

  switch (command) {
    case 'radar':
      const exitCode = await runRadarCommand(options);
      process.exit(exitCode);
      break;

    case 'help':
      printHelp();
      process.exit(0);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
