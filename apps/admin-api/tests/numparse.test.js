/**
 * numparse.test.js - Tests for OCR-aware number parsing
 */

"use strict";

const { parsePower } = require('../lib/numparse');

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

async function run() {
  console.log("\n=== Numparse Tests ===\n");

  // Test 1: Parse simple numbers
  console.log("Test 1: Parse simple numbers");
  assertEqual(parsePower('1234'), 1234, 'parsePower("1234")');
  assertEqual(parsePower('999'), 999, 'parsePower("999")');
  console.log("✓ Passed\n");

  // Test 2: Parse K suffix
  console.log("Test 2: Parse K suffix");
  assertEqual(parsePower('10K'), 10000, 'parsePower("10K")');
  assertEqual(parsePower('5.5k'), 5500, 'parsePower("5.5k")');
  assertEqual(parsePower('100K'), 100000, 'parsePower("100K")');
  console.log("✓ Passed\n");

  // Test 3: Parse M suffix
  console.log("Test 3: Parse M suffix");
  assertEqual(parsePower('1M'), 1000000, 'parsePower("1M")');
  assertEqual(parsePower('2.5m'), 2500000, 'parsePower("2.5m")');
  assertEqual(parsePower('50M'), 50000000, 'parsePower("50M")');
  console.log("✓ Passed\n");

  // Test 4: Parse B suffix
  console.log("Test 4: Parse B suffix");
  assertEqual(parsePower('1B'), 1000000000, 'parsePower("1B")');
  assertEqual(parsePower('2.5b'), 2500000000, 'parsePower("2.5b")');
  console.log("✓ Passed\n");

  // Test 5: Handle bad grouping
  console.log("Test 5: Handle bad grouping (commas, spaces)");
  assertEqual(parsePower('1,234'), 1234, 'parsePower("1,234")');
  assertEqual(parsePower('10 000'), 10000, 'parsePower("10 000")');
  assertEqual(parsePower('1,000,000'), 1000000, 'parsePower("1,000,000")');
  assertEqual(parsePower('5 500K'), 5500000, 'parsePower("5 500K")');
  console.log("✓ Passed\n");

  // Test 6: Handle OCR artifacts
  console.log("Test 6: Handle OCR artifacts");
  assertEqual(parsePower('10_000'), 10000, 'parsePower("10_000")');
  assertEqual(parsePower('  5K  '), 5000, 'parsePower("  5K  ")');
  console.log("✓ Passed\n");

  // Test 7: Return null for invalid input
  console.log("Test 7: Return null for invalid input");
  assertEqual(parsePower(''), null, 'parsePower("")');
  assertEqual(parsePower(null), null, 'parsePower(null)');
  assertEqual(parsePower(undefined), null, 'parsePower(undefined)');
  assertEqual(parsePower('abc'), null, 'parsePower("abc")');
  assertEqual(parsePower('-100'), null, 'parsePower("-100")');
  console.log("✓ Passed\n");

  // Test 8: Validate against median hint
  console.log("Test 8: Validate against median hint");
  assertEqual(parsePower('100K', { medianHint: 150000 }), 100000, 'parsePower("100K", { medianHint: 150000 })');
  assertEqual(parsePower('10M', { medianHint: 100000 }), null, 'parsePower("10M", { medianHint: 100000 })');
  assertEqual(parsePower('1K', { medianHint: 100000 }), null, 'parsePower("1K", { medianHint: 100000 })');
  console.log("✓ Passed\n");

  // Test 9: Handle decimals
  console.log("Test 9: Handle decimals");
  assertEqual(parsePower('1.5K'), 1500, 'parsePower("1.5K")');
  assertEqual(parsePower('2.75M'), 2750000, 'parsePower("2.75M")');
  console.log("✓ Passed\n");

  console.log("=== All numparse tests passed! ===\n");
}

if (require.main === module) {
  run()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("\n❌ Test failed:", err.message);
      console.error(err.stack);
      process.exit(1);
    });
}

module.exports = { run };
