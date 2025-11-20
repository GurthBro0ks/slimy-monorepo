/**
 * Skills collector - generates skill investment opportunities.
 *
 * These opportunities represent long-term learning and practice tasks that
 * improve future earning potential rather than providing immediate cash.
 */

import type { Opportunity, SkillInvestmentMetadata } from "@slimy/opps-core";

/**
 * Generate a unique ID for a skill opportunity.
 */
function generateSkillId(title: string): string {
  return `skill-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/**
 * Collect skill investment opportunities.
 *
 * These are synthetic opportunities representing learning/practice tasks
 * that compound over time to improve your future expected value.
 *
 * @returns Array of skill investment Opportunity objects.
 */
export async function collectSkillInvestmentOpportunitiesNow(): Promise<Opportunity[]> {
  const now = new Date();

  const opportunities: Opportunity[] = [
    // Quant / Analytics
    {
      id: generateSkillId("Deep dive: quant basics for personal radar scoring"),
      title: "Deep dive: quant basics for personal radar scoring",
      description:
        "Learn fundamental quantitative concepts to improve opportunity scoring algorithms. " +
        "Covers expected value calculations, Bayesian updating, and basic statistics.",
      type: "other",
      domain: "misc",
      riskLevel: "low",
      freshnessTier: "slow_batch",
      expectedRewardEstimate: 500,
      timeCostMinutesEstimate: 360,
      collectedAt: now,
      metadata: {
        category: "skill_investment",
        area: "quant",
        suggestedResources: [
          "Introduction to Probability and Statistics textbook",
          "Expected Value and Decision Theory tutorials",
          "Bayesian Methods for Hackers online book",
        ],
        recommendedSessionLengthMinutes: 60,
      } satisfies SkillInvestmentMetadata,
    },

    // Automation / CLI
    {
      id: generateSkillId("Learn/practice: building small internal APIs & CLIs"),
      title: "Learn/practice: building small internal APIs & CLIs",
      description:
        "Practice creating lightweight APIs and command-line tools for internal automation. " +
        "Build confidence in Node.js/TypeScript for rapid prototyping.",
      type: "other",
      domain: "misc",
      riskLevel: "low",
      freshnessTier: "slow_batch",
      expectedRewardEstimate: 800,
      timeCostMinutesEstimate: 480,
      collectedAt: now,
      metadata: {
        category: "skill_investment",
        area: "automation",
        suggestedResources: [
          "Node.js CLI best practices documentation",
          "Express.js or Fastify API tutorials",
          "Commander.js for CLI argument parsing",
          "Example internal tool projects on GitHub",
        ],
        recommendedSessionLengthMinutes: 90,
      } satisfies SkillInvestmentMetadata,
    },

    // AI Tooling
    {
      id: generateSkillId("Study: one new AI model provider and their tooling"),
      title: "Study: one new AI model provider and their tooling",
      description:
        "Research a new AI model provider (e.g., Anthropic, OpenAI, Cohere, Mistral) and understand their API, " +
        "pricing, strengths, and tooling ecosystem. Experiment with their SDKs.",
      type: "other",
      domain: "misc",
      riskLevel: "medium",
      freshnessTier: "slow_batch",
      expectedRewardEstimate: 600,
      timeCostMinutesEstimate: 240,
      collectedAt: now,
      metadata: {
        category: "skill_investment",
        area: "ai_tooling",
        suggestedResources: [
          "Provider API documentation",
          "Comparison articles on AI model providers",
          "Example integration projects",
          "Pricing and rate limit documentation",
        ],
        recommendedSessionLengthMinutes: 60,
      } satisfies SkillInvestmentMetadata,
    },

    // Frontend
    {
      id: generateSkillId("Practice: designing and documenting one 'opps' module end-to-end"),
      title: "Practice: designing and documenting one 'opps' module end-to-end",
      description:
        "Take ownership of designing, implementing, and documenting a complete module within the opps system. " +
        "Practice architectural thinking, clean code, and communication.",
      type: "other",
      domain: "misc",
      riskLevel: "low",
      freshnessTier: "slow_batch",
      expectedRewardEstimate: 1000,
      timeCostMinutesEstimate: 600,
      collectedAt: now,
      metadata: {
        category: "skill_investment",
        area: "frontend",
        suggestedResources: [
          "Existing opps modules as examples",
          "Software architecture patterns documentation",
          "Technical writing guides",
          "Code review best practices",
        ],
        recommendedSessionLengthMinutes: 120,
      } satisfies SkillInvestmentMetadata,
    },

    // Infra / DevOps
    {
      id: generateSkillId("Learn: Docker multi-stage builds and deployment patterns"),
      title: "Learn: Docker multi-stage builds and deployment patterns",
      description:
        "Master Docker multi-stage builds for efficient container images. " +
        "Learn deployment patterns for different environments (dev, staging, prod).",
      type: "other",
      domain: "misc",
      riskLevel: "medium",
      freshnessTier: "slow_batch",
      expectedRewardEstimate: 700,
      timeCostMinutesEstimate: 300,
      collectedAt: now,
      metadata: {
        category: "skill_investment",
        area: "infra",
        suggestedResources: [
          "Docker documentation on multi-stage builds",
          "Best practices for Node.js Docker images",
          "Docker Compose for local development",
          "CI/CD pipeline integration examples",
        ],
        recommendedSessionLengthMinutes: 60,
      } satisfies SkillInvestmentMetadata,
    },

    // Additional automation opportunity
    {
      id: generateSkillId("Practice: write and publish a small NPM utility package"),
      title: "Practice: write and publish a small NPM utility package",
      description:
        "Create a small, focused utility library and publish it to NPM. " +
        "Learn about package.json configuration, semantic versioning, and publishing workflows.",
      type: "other",
      domain: "misc",
      riskLevel: "low",
      freshnessTier: "slow_batch",
      expectedRewardEstimate: 400,
      timeCostMinutesEstimate: 180,
      collectedAt: now,
      metadata: {
        category: "skill_investment",
        area: "automation",
        suggestedResources: [
          "NPM publishing documentation",
          "Semantic versioning guide",
          "TypeScript library starter templates",
          "Examples of small utility packages",
        ],
        recommendedSessionLengthMinutes: 45,
      } satisfies SkillInvestmentMetadata,
    },
  ];

  return opportunities;
}
