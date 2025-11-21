/**
 * Test file to validate tier calculator logic
 */

import { calculateTier, type TierInputs } from "./snail-tier-calculator";

// Example test cases
const testCases: Array<{ name: string; inputs: TierInputs }> = [
  {
    name: "Beginner player",
    inputs: {
      snailLevel: 50,
      cityLevel: 15,
      relicPower: 5000,
      clubContribution: 100,
    },
  },
  {
    name: "Mid-game player",
    inputs: {
      snailLevel: 100,
      cityLevel: 30,
      relicPower: 20000,
      clubContribution: 500,
    },
  },
  {
    name: "Advanced player",
    inputs: {
      snailLevel: 150,
      cityLevel: 40,
      relicPower: 50000,
      clubContribution: 2000,
    },
  },
  {
    name: "Elite player",
    inputs: {
      snailLevel: 200,
      cityLevel: 50,
      relicPower: 100000,
      clubContribution: 5000,
    },
  },
  {
    name: "Top-tier player",
    inputs: {
      snailLevel: 250,
      cityLevel: 50,
      relicPower: 200000,
      clubContribution: 10000,
    },
  },
];

console.log("=".repeat(80));
console.log("TIER CALCULATOR TEST RESULTS");
console.log("=".repeat(80));
console.log();

testCases.forEach((testCase) => {
  const result = calculateTier(testCase.inputs);

  console.log(`Test Case: ${testCase.name}`);
  console.log("-".repeat(80));
  console.log(`Inputs:`);
  console.log(`  Snail Level: ${testCase.inputs.snailLevel}`);
  console.log(`  City Level: ${testCase.inputs.cityLevel}`);
  console.log(`  Relic Power: ${testCase.inputs.relicPower.toLocaleString()}`);
  console.log(`  Club Contribution: ${testCase.inputs.clubContribution.toLocaleString()}`);
  console.log();
  console.log(`Result:`);
  console.log(`  Tier: ${result.tier}`);
  console.log(`  Score: ${result.score}`);
  console.log(`  Reasons:`);
  result.reasons.forEach((r) => console.log(`    - ${r}`));
  console.log(`  Suggestions:`);
  result.suggestions.forEach((s) => console.log(`    - ${s}`));
  console.log();
  console.log();
});

console.log("=".repeat(80));
console.log("All tests completed successfully!");
console.log("=".repeat(80));
