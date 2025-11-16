#!/usr/bin/env tsx

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import matter from "gray-matter";

const GITHUB_API = "https://api.github.com";
const DOCS_SOURCE_REPO = process.env.DOCS_SOURCE_REPO || "";
const DOCS_SOURCE_PATH = process.env.DOCS_SOURCE_PATH || "docs";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const DRY_RUN = process.argv.includes("--dry-run");

interface GitHubTreeItem {
  path: string;
  type: "blob" | "tree";
  sha: string;
  url: string;
}

interface DocMeta {
  title: string;
  order?: number;
}

async function fetchGitHubApi(url: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `token ${GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function getRepoTree(owner: string, repo: string, path: string): Promise<GitHubTreeItem[]> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  return fetchGitHubApi(url);
}

async function downloadFile(url: string): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3.raw",
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `token ${GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  return response.text();
}

function normalizeMarkdown(content: string, filePath: string): string {
  // Parse frontmatter
  const { data, content: body } = matter(content);

  // Rewrite relative links to /docs/...
  let normalized = body.replace(/\[([^\]]+)\]\((?!https?:\/\/)([^)]+)\.md\)/g, (match, text, path) => {
    return `[${text}](/docs/${path})`;
  });

  // Wrap bare images with figure
  normalized = normalized.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    return `<figure>\n  <img src="${src}" alt="${alt}" />\n  ${alt ? `<figcaption>${alt}</figcaption>` : ""}\n</figure>`;
  });

  // Reconstruct with frontmatter
  const frontmatter = Object.keys(data).length > 0 ? `---\n${Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n")}\n---\n\n` : "";

  return frontmatter + normalized;
}

async function importDocs() {
  if (!DOCS_SOURCE_REPO) {
    console.log("⚠️  DOCS_SOURCE_REPO not set, using current repo");
    // In production, this would use the current repo
    // For now, we'll create sample docs
    await createSampleDocs();
    return;
  }

  const [owner, repo] = DOCS_SOURCE_REPO.split("/");
  const paths = DOCS_SOURCE_PATH.split(",").map((p) => p.trim());

  console.log(`📚 Importing docs from ${owner}/${repo}`);
  console.log(`📁 Paths: ${paths.join(", ")}`);

  const allDocs: Array<{ path: string; content: string; meta: DocMeta }> = [];

  for (const path of paths) {
    try {
      const tree = await getRepoTree(owner, repo, path);

      for (const item of tree) {
        if (item.type === "blob" && (item.path.endsWith(".md") || item.path.endsWith(".mdx"))) {
          console.log(`  Downloading ${item.path}...`);
          const content = await downloadFile(item.url);
          const { data } = matter(content);
          const title = data.title || item.path.replace(/\.(md|mdx)$/, "").split("/").pop() || "Untitled";

          allDocs.push({
            path: item.path,
            content: normalizeMarkdown(content, item.path),
            meta: {
              title,
              order: data.order,
            },
          });
        }
      }
    } catch (error) {
      console.error(`❌ Failed to import from ${path}:`, error);
    }
  }

  if (DRY_RUN) {
    console.log(`\n✅ Dry run: would import ${allDocs.length} docs`);
    return;
  }

  // Write docs to content/docs
  const docsDir = join(process.cwd(), "content/docs");
  mkdirSync(docsDir, { recursive: true });

  for (const doc of allDocs) {
    const outputPath = join(docsDir, doc.path.replace(/^.*\//, ""));
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, doc.content);
    console.log(`  ✅ Wrote ${outputPath}`);
  }

  // Generate _meta.ts
  const metaContent = `export const docsMeta = ${JSON.stringify(
    allDocs.map((d) => d.meta),
    null,
    2
  )};\n`;
  writeFileSync(join(docsDir, "_meta.ts"), metaContent);

  console.log(`\n✅ Imported ${allDocs.length} docs`);
}

async function createSampleDocs() {
  console.log("📚 Creating sample docs...");

  const docsDir = join(process.cwd(), "content/docs");
  mkdirSync(docsDir, { recursive: true });

  const sampleDocs = [
    {
      filename: "getting-started.mdx",
      content: `---
title: Getting Started
order: 1
---

# Getting Started with Slimy.ai

Welcome to Slimy.ai, your AI-powered Discord companion for Super Snail and more!

## Quick Start

1. **Invite the bot** to your Discord server
2. **Login** to the web dashboard with Discord
3. **Configure** your preferences and permissions
4. **Start using** commands in Discord

## Available Features

- **Snail Tools**: Screenshot analysis, tier calculator, secret codes
- **Club Analytics**: Track performance and member stats
- **Slime Chat**: AI conversations with personality modes
- **Admin Panel**: Manage guilds and bot settings

## Next Steps

Check out the [Snail Tools](/docs/snail-tools) guide to learn about Super Snail features.
`,
    },
    {
      filename: "snail-tools.mdx",
      content: `---
title: Snail Tools
order: 2
---

# Snail Tools

Comprehensive toolkit for Super Snail players.

## Secret Codes

Access all active codes aggregated from multiple sources:

- Snelp API integration
- Reddit r/SuperSnailGame scraping
- Community submissions

### Usage

Visit the [Codes page](/snail/codes) to view and copy all active codes.

## Screenshot Analysis

Upload Super Snail screenshots for AI-powered analysis using GPT-4 Vision.

## Tier Calculator

Calculate upgrade costs and resource requirements for any tier level.

## Stats Tracking

Track your progress over time with automatic stat logging to Google Sheets.
`,
    },
    {
      filename: "club-analytics.mdx",
      content: `---
title: Club Analytics
order: 3
---

# Club Analytics

Advanced analytics for Super Snail club management.

## Features

### Member Performance Tracking

Monitor individual member contributions and activity levels.

### Screenshot Upload

Upload club screenshots for automated analysis and stat extraction.

### Historical Comparison

Compare performance across different time periods.

### Google Sheets Integration

Automatically export data to Google Sheets for further analysis.

## Getting Started

1. Enable club analytics in your server settings
2. Upload your first club screenshot
3. View analytics in the dashboard

## Requirements

- Club role or admin permissions
- Admin API connection configured
`,
    },
  ];

  for (const doc of sampleDocs) {
    const outputPath = join(docsDir, doc.filename);
    if (DRY_RUN) {
      console.log(`  Would create ${outputPath}`);
    } else {
      writeFileSync(outputPath, doc.content);
      console.log(`  ✅ Created ${outputPath}`);
    }
  }

  // Generate _meta.ts
  const metaContent = `export const docsMeta = [
  { title: "Getting Started", order: 1 },
  { title: "Snail Tools", order: 2 },
  { title: "Club Analytics", order: 3 },
];
`;

  if (!DRY_RUN) {
    writeFileSync(join(docsDir, "_meta.ts"), metaContent);
  }

  console.log(`\n✅ Created ${sampleDocs.length} sample docs`);
}

// Run the script
importDocs().catch((error) => {
  console.error("❌ Import failed:", error);
  process.exit(1);
});
