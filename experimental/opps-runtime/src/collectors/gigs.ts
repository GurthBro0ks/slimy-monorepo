/**
 * Collectors for time-for-money task opportunities:
 * - Gig tasks: small coding jobs
 * - Micro-services: reusable service implementations
 */

import { Opportunity } from "../../../opps-core/src/types";

/**
 * Collect synthetic gig task opportunities
 * These represent small coding gigs from freelance boards, OSS bounties, etc.
 */
export async function collectGigTaskOpportunitiesNow(): Promise<Opportunity[]> {
  const now = new Date();

  return [
    {
      id: "gig-001",
      title: "Fix TypeScript config in small open-source repo",
      description:
        "A small React library needs its TypeScript configuration updated to support strict mode and fix type errors. About 10-15 type issues to resolve.",
      type: "other",
      domain: "misc",
      riskLevel: "low",
      freshnessTier: "fast_batch",
      expectedRewardEstimate: 75,
      timeCostMinutesEstimate: 90,
      collectedAt: now,
      metadata: {
        category: "gig_task",
        skillTags: ["typescript", "react", "configuration"],
        platformHint: "oss_bounty",
        difficulty: "easy",
        hourlyRateApprox: 50,
      },
    },
    {
      id: "gig-002",
      title: "Write script to sync screenshots to cloud storage",
      description:
        "Create a Node.js script that watches a directory for new screenshots, uploads them to S3, and labels them with timestamp and optional tags. Needs basic CLI interface.",
      type: "other",
      domain: "misc",
      riskLevel: "low",
      freshnessTier: "fast_batch",
      expectedRewardEstimate: 120,
      timeCostMinutesEstimate: 120,
      collectedAt: now,
      metadata: {
        category: "gig_task",
        skillTags: ["node", "aws", "automation", "cli"],
        platformHint: "freelance_board",
        difficulty: "medium",
        hourlyRateApprox: 60,
      },
    },
    {
      id: "gig-003",
      title: "Add simple logging + dashboard to small Node API",
      description:
        "Existing Express API needs structured logging (Winston or Pino) and a basic dashboard to view logs. Should include request/response logging and error tracking.",
      type: "other",
      domain: "misc",
      riskLevel: "medium",
      freshnessTier: "fast_batch",
      expectedRewardEstimate: 200,
      timeCostMinutesEstimate: 180,
      collectedAt: now,
      metadata: {
        category: "gig_task",
        skillTags: ["node", "express", "logging", "monitoring"],
        platformHint: "direct_client",
        difficulty: "medium",
        hourlyRateApprox: 65,
      },
    },
    {
      id: "gig-004",
      title: "Migrate Jest tests to Vitest in small project",
      description:
        "Convert 20-25 Jest unit tests to Vitest. Update configuration, mock syntax, and ensure all tests pass. Project uses TypeScript and React Testing Library.",
      type: "other",
      domain: "misc",
      riskLevel: "low",
      freshnessTier: "fast_batch",
      expectedRewardEstimate: 100,
      timeCostMinutesEstimate: 120,
      collectedAt: now,
      metadata: {
        category: "gig_task",
        skillTags: ["typescript", "testing", "vitest", "jest"],
        platformHint: "oss_bounty",
        difficulty: "easy",
        hourlyRateApprox: 50,
      },
    },
    {
      id: "gig-005",
      title: "Build CSV export feature for analytics dashboard",
      description:
        "Add CSV export functionality to an existing Next.js analytics dashboard. Should support filtering, date ranges, and include proper formatting for Excel compatibility.",
      type: "other",
      domain: "misc",
      riskLevel: "medium",
      freshnessTier: "fast_batch",
      expectedRewardEstimate: 150,
      timeCostMinutesEstimate: 150,
      collectedAt: now,
      metadata: {
        category: "gig_task",
        skillTags: ["nextjs", "react", "csv", "data-export"],
        platformHint: "freelance_board",
        difficulty: "medium",
        hourlyRateApprox: 60,
      },
    },
    {
      id: "gig-006",
      title: "Implement rate limiting for REST API endpoints",
      description:
        "Add rate limiting middleware to Express API using redis. Configure different limits for authenticated vs anonymous users. Include proper error responses and headers.",
      type: "other",
      domain: "misc",
      riskLevel: "medium",
      freshnessTier: "fast_batch",
      expectedRewardEstimate: 180,
      timeCostMinutesEstimate: 240,
      collectedAt: now,
      metadata: {
        category: "gig_task",
        skillTags: ["node", "express", "redis", "security"],
        platformHint: "direct_client",
        difficulty: "hard",
        hourlyRateApprox: 45,
      },
    },
  ];
}

/**
 * Collect synthetic micro-service opportunities
 * These represent reusable service implementations that can be sold/reused
 */
export async function collectMicroServiceOpportunitiesNow(): Promise<
  Opportunity[]
> {
  const now = new Date();

  return [
    {
      id: "micro-001",
      title: "Turn recurring spreadsheet cleanup into Python automation",
      description:
        "Client has a weekly manual process of cleaning up sales data in Excel: removing duplicates, standardizing formats, calculating totals. Build a Python script + simple GUI to automate this.",
      type: "other",
      domain: "misc",
      riskLevel: "medium",
      freshnessTier: "fast_batch",
      expectedRewardEstimate: 400,
      timeCostMinutesEstimate: 300,
      collectedAt: now,
      metadata: {
        category: "micro_service",
        reusable: true,
        idealClientProfile: "Small business owners, sales teams",
        technicalStackHint: ["python", "pandas", "tkinter"],
        difficulty: "medium",
        potentialForResale: true,
      },
    },
    {
      id: "micro-002",
      title: "Wrap CLI tool in tiny web UI for non-technical users",
      description:
        "Popular command-line tool needs a simple web interface so non-developers can use it. Build a lightweight Next.js frontend that wraps the CLI and provides a user-friendly interface.",
      type: "other",
      domain: "misc",
      riskLevel: "medium",
      freshnessTier: "fast_batch",
      expectedRewardEstimate: 500,
      timeCostMinutesEstimate: 360,
      collectedAt: now,
      metadata: {
        category: "micro_service",
        reusable: true,
        idealClientProfile: "Dev tool creators, technical product managers",
        technicalStackHint: ["nextjs", "react", "node"],
        difficulty: "medium",
        potentialForResale: true,
      },
    },
    {
      id: "micro-003",
      title: "Build Discord bot to summarize server logs",
      description:
        "Gaming server operators need automated log summaries. Create a Discord bot that monitors specific channels, aggregates events, and posts daily/weekly summaries with key metrics.",
      type: "other",
      domain: "misc",
      riskLevel: "low",
      freshnessTier: "fast_batch",
      expectedRewardEstimate: 350,
      timeCostMinutesEstimate: 240,
      collectedAt: now,
      metadata: {
        category: "micro_service",
        reusable: true,
        idealClientProfile: "Gaming communities, Discord server admins",
        technicalStackHint: ["node", "discord-bot", "discord.js"],
        difficulty: "easy",
        potentialForResale: true,
      },
    },
    {
      id: "micro-004",
      title: "Create email digest service for RSS feeds",
      description:
        "Build a service that aggregates multiple RSS feeds and sends a formatted daily/weekly email digest. Should support custom filtering, scheduling, and template customization.",
      type: "other",
      domain: "misc",
      riskLevel: "medium",
      freshnessTier: "fast_batch",
      expectedRewardEstimate: 600,
      timeCostMinutesEstimate: 480,
      collectedAt: now,
      metadata: {
        category: "micro_service",
        reusable: true,
        idealClientProfile: "Content consumers, newsletter creators, researchers",
        technicalStackHint: ["node", "email-api", "rss-parser", "cron"],
        difficulty: "medium",
        potentialForResale: true,
        monthlyRevenuePotential: true,
      },
    },
    {
      id: "micro-005",
      title: "Build screenshot annotation tool as web service",
      description:
        "Create a simple web app where users can upload screenshots, add arrows/text/highlights, and export annotated images. Think lightweight Snagit alternative.",
      type: "other",
      domain: "misc",
      riskLevel: "medium",
      freshnessTier: "fast_batch",
      expectedRewardEstimate: 800,
      timeCostMinutesEstimate: 600,
      collectedAt: now,
      metadata: {
        category: "micro_service",
        reusable: true,
        idealClientProfile:
          "Documentation writers, support teams, educators",
        technicalStackHint: ["nextjs", "canvas-api", "image-processing"],
        difficulty: "hard",
        potentialForResale: true,
        monthlyRevenuePotential: true,
      },
    },
  ];
}
