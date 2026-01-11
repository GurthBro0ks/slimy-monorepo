#!/usr/bin/env tsx
/**
 * Trader Invite Code Generator
 *
 * Creates invite codes for the isolated trader authentication system.
 * Codes are hashed before storage - the plaintext is shown ONCE.
 *
 * Usage:
 *   npx tsx scripts/trader_invite_create.ts [options]
 *   pnpm tsx scripts/trader_invite_create.ts [options]
 *
 * Options:
 *   --expires-days <N>   Expire after N days (default: no expiry)
 *   --max-uses <N>       Maximum uses (default: 1)
 *   --note <string>      Admin note (e.g., "for john")
 *
 * Examples:
 *   npx tsx scripts/trader_invite_create.ts
 *   npx tsx scripts/trader_invite_create.ts --expires-days 7 --note "for beta tester"
 *   npx tsx scripts/trader_invite_create.ts --max-uses 5 --note "team invite"
 *
 * Environment:
 *   DATABASE_URL must be set (e.g., via .env file in apps/web)
 */

import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "crypto";
import * as path from "path";
import * as fs from "fs";

// Load .env from apps/web if it exists
const envPath = path.join(__dirname, "../apps/web/.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && !process.env[key.trim()]) {
      const value = valueParts.join("=").trim();
      // Remove surrounding quotes if present
      process.env[key.trim()] = value.replace(/^["']|["']$/g, "");
    }
  });
}

const prisma = new PrismaClient();

/**
 * Generate an invite code (human-readable, 16 chars)
 * Format: XXXX-XXXX-XXXX-XXXX
 * Uses characters that are easy to read (no O/0, I/l/1)
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(16);
  let code = "";
  for (let i = 0; i < 16; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12, 16)}`;
}

/**
 * Hash a token using SHA-256 (for storage)
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

interface CliOptions {
  expiresDays?: number;
  maxUses: number;
  note?: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  let expiresDays: number | undefined;
  let maxUses = 1;
  let note: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--expires-days" && args[i + 1]) {
      expiresDays = parseInt(args[i + 1], 10);
      if (isNaN(expiresDays) || expiresDays < 1) {
        console.error("Error: --expires-days must be a positive integer");
        process.exit(1);
      }
      i++;
    } else if (args[i] === "--max-uses" && args[i + 1]) {
      maxUses = parseInt(args[i + 1], 10);
      if (isNaN(maxUses) || maxUses < 1) {
        console.error("Error: --max-uses must be a positive integer");
        process.exit(1);
      }
      i++;
    } else if (args[i] === "--note" && args[i + 1]) {
      note = args[i + 1];
      i++;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Trader Invite Code Generator

Usage:
  npx tsx scripts/trader_invite_create.ts [options]

Options:
  --expires-days <N>   Expire after N days (default: no expiry)
  --max-uses <N>       Maximum uses (default: 1)
  --note <string>      Admin note (e.g., "for john")
  --help, -h           Show this help message

Examples:
  npx tsx scripts/trader_invite_create.ts
  npx tsx scripts/trader_invite_create.ts --expires-days 7 --note "for beta"
  npx tsx scripts/trader_invite_create.ts --max-uses 5 --note "team invite"
`);
      process.exit(0);
    }
  }

  return { expiresDays, maxUses, note };
}

async function main() {
  const options = parseArgs();

  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL environment variable is not set");
    console.error("Make sure apps/web/.env exists with DATABASE_URL defined");
    process.exit(1);
  }

  console.log("\nGenerating trader invite code...\n");

  const code = generateInviteCode();
  // Hash without dashes for consistent storage
  const codeHash = hashToken(code.replace(/-/g, ""));

  const expiresAt = options.expiresDays
    ? new Date(Date.now() + options.expiresDays * 24 * 60 * 60 * 1000)
    : null;

  try {
    const invite = await prisma.traderInvite.create({
      data: {
        codeHash,
        expiresAt,
        maxUses: options.maxUses,
        note: options.note,
      },
    });

    console.log("=".repeat(50));
    console.log("TRADER INVITE CODE CREATED");
    console.log("=".repeat(50));
    console.log("");
    console.log(`  Code:      ${code}`);
    console.log(`  ID:        ${invite.id}`);
    console.log(`  Max Uses:  ${options.maxUses}`);
    console.log(
      `  Expires:   ${expiresAt ? expiresAt.toISOString() : "Never"}`
    );
    if (options.note) {
      console.log(`  Note:      ${options.note}`);
    }
    console.log("");
    console.log("=".repeat(50));
    console.log("IMPORTANT: This code will NEVER be shown again!");
    console.log("=".repeat(50));
    console.log("");
  } catch (error) {
    console.error("Error creating invite:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
