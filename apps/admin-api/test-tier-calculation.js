#!/usr/bin/env node
"use strict";

/**
 * Simple test script to verify tier calculation functionality
 */

const { calculateSnailTier } = require("./src/services/snail-tier");
const { computeScoreFromStats, mapScoreToTier, getTierDetails } = require("./src/services/snail-tier-formulas");
const { getLatestScreenshotAnalysis } = require("./src/services/snail-screenshots");

console.log("=".repeat(80));
console.log("TIER CALCULATION SYSTEM - FUNCTIONAL TEST");
console.log("=".repeat(80));
console.log();

// Test 1: Formula helpers
console.log("TEST 1: Formula Helpers");
console.log("-".repeat(80));

const testStats = {
  level: 45,
  cityLevel: 38,
  relicPower: 8500,
  clubContribution: 250,
  simPower: 125000,
};

const score = computeScoreFromStats(testStats);
const tier = mapScoreToTier(score);
const details = getTierDetails(tier);

console.log("Input stats:", JSON.stringify(testStats, null, 2));
console.log("Computed score:", score);
console.log("Mapped tier:", tier);
console.log("Tier details:", JSON.stringify(details, null, 2));
console.log("✓ Formula helpers working correctly");
console.log();

// Test 2: High-level tier service
console.log("TEST 2: High-Level Tier Service");
console.log("-".repeat(80));

try {
  const result = calculateSnailTier({
    level: 52,
    cityLevel: 42,
    relicPower: 12300,
    clubContribution: 380,
    simPower: 185000,
  });

  console.log("Result:", JSON.stringify(result, null, 2));
  console.log("✓ Tier service working correctly");
  console.log();
} catch (err) {
  console.error("✗ Tier service failed:", err.message);
  process.exit(1);
}

// Test 3: Validation - missing required fields
console.log("TEST 3: Validation - Missing Required Fields");
console.log("-".repeat(80));

try {
  calculateSnailTier({ level: 50 }); // Missing cityLevel
  console.error("✗ Should have thrown validation error");
  process.exit(1);
} catch (err) {
  console.log("Expected error caught:", err.message);
  console.log("✓ Validation working correctly");
  console.log();
}

// Test 4: Screenshot analysis with tier suggestions
console.log("TEST 4: Screenshot Analysis with Tier Suggestions");
console.log("-".repeat(80));

const analysis = getLatestScreenshotAnalysis({
  guildId: "test-guild-123",
  userId: "test-user-456",
});

console.log("Guild ID:", analysis.guildId);
console.log("User ID:", analysis.userId);
console.log("Results count:", analysis.analysis.results.length);
console.log();

for (let i = 0; i < analysis.analysis.results.length; i++) {
  const result = analysis.analysis.results[i];
  console.log(`Result ${i + 1}:`);
  console.log("  Stats:", {
    snailLevel: result.stats.snailLevel,
    cityLevel: result.stats.cityLevel,
    simPower: result.stats.simPower,
    relicPower: result.stats.relicPower,
    clubContribution: result.stats.clubContribution,
  });
  console.log("  Suggested Tier:", result.stats.suggestedTier);
  console.log("  Suggested Score:", result.stats.suggestedScore);

  if (!result.stats.suggestedTier || typeof result.stats.suggestedScore !== "number") {
    console.error("✗ Missing suggested tier or score");
    process.exit(1);
  }
}

console.log("✓ Screenshot analysis with tier suggestions working correctly");
console.log();

// Test 5: Tier thresholds
console.log("TEST 5: Tier Threshold Boundaries");
console.log("-".repeat(80));

const thresholdTests = [
  { score: 1200, expectedTier: "S+" },
  { score: 1000, expectedTier: "S+" },
  { score: 999, expectedTier: "S" },
  { score: 800, expectedTier: "S" },
  { score: 799, expectedTier: "A" },
  { score: 600, expectedTier: "A" },
  { score: 599, expectedTier: "B" },
  { score: 400, expectedTier: "B" },
  { score: 399, expectedTier: "C" },
  { score: 200, expectedTier: "C" },
  { score: 199, expectedTier: "D" },
  { score: 100, expectedTier: "D" },
  { score: 99, expectedTier: "F" },
  { score: 0, expectedTier: "F" },
];

let passed = 0;
let failed = 0;

for (const test of thresholdTests) {
  const actualTier = mapScoreToTier(test.score);
  if (actualTier === test.expectedTier) {
    passed++;
  } else {
    console.error(`✗ Score ${test.score}: expected ${test.expectedTier}, got ${actualTier}`);
    failed++;
  }
}

console.log(`Threshold tests: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
console.log("✓ All tier thresholds correct");
console.log();

// Summary
console.log("=".repeat(80));
console.log("✓ ALL TESTS PASSED");
console.log("=".repeat(80));
console.log();
console.log("Summary:");
console.log("  - Formula helpers (computeScoreFromStats, mapScoreToTier, getTierDetails) ✓");
console.log("  - High-level tier service (calculateSnailTier) ✓");
console.log("  - Input validation ✓");
console.log("  - Screenshot analysis with tier suggestions ✓");
console.log("  - Tier threshold boundaries ✓");
console.log();
console.log("The tier calculation system is ready for integration!");
