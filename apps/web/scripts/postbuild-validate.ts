#!/usr/bin/env tsx

import { existsSync } from "fs";
import { join } from "path";

const errors: string[] = [];
const warnings: string[] = [];

// Check if docs exist
const docsDir = join(process.cwd(), "content/docs");
if (!existsSync(docsDir)) {
  errors.push("content/docs directory does not exist");
} else {
  const hasGettingStarted = existsSync(join(docsDir, "getting-started.mdx"));
  if (!hasGettingStarted) {
    warnings.push("getting-started.mdx not found in docs");
  }
}

// Check if build output exists
const buildDir = join(process.cwd(), ".next");
if (!existsSync(buildDir)) {
  errors.push(".next build directory does not exist");
}

// Report results
console.log("\n📋 Post-build validation:");

if (errors.length > 0) {
  console.log("\n❌ Errors:");
  errors.forEach((err) => console.log(`  - ${err}`));
}

if (warnings.length > 0) {
  console.log("\n⚠️  Warnings:");
  warnings.forEach((warn) => console.log(`  - ${warn}`));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log("✅ All checks passed");
}

// Exit with error code if there are errors
if (errors.length > 0) {
  process.exit(1);
}
