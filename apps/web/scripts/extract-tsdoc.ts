#!/usr/bin/env tsx

/**
 * TSDoc Extraction Script
 *
 * Scans TypeScript files for TSDoc/JSDoc comments and generates documentation.
 *
 * Usage:
 *   pnpm docs:extract              # Extract and save to JSON
 *   pnpm docs:extract --format md  # Extract and save to Markdown
 *   pnpm docs:extract --dry-run    # Preview without saving
 *
 * Output:
 *   - JSON: content/docs/api-reference.json
 *   - Markdown: content/docs/api-reference-generated.mdx
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

interface TSDocComment {
  file: string;
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'const';
  description: string;
  params?: Array<{ name: string; type?: string; description?: string }>;
  returns?: { type?: string; description?: string };
  example?: string;
  tags: Record<string, string>;
  line: number;
}

const SCAN_DIRS = [
  'lib',
  'components',
  'app/api',
];

const EXCLUDE_PATTERNS = [
  /\.test\./,
  /\.spec\./,
  /node_modules/,
  /\.next/,
  /dist/,
];

/**
 * Extract TSDoc comments from a TypeScript file
 */
function extractFromFile(filePath: string, baseDir: string): TSDocComment[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const comments: TSDocComment[] = [];

  let currentComment: string | null = null;
  let commentStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Start of JSDoc comment
    if (line.trim().startsWith('/**')) {
      currentComment = '';
      commentStartLine = i + 1;
    }

    // Middle of comment
    if (currentComment !== null && line.includes('*') && !line.includes('*/')) {
      const commentLine = line.replace(/^\s*\*\s?/, '');
      currentComment += commentLine + '\n';
    }

    // End of comment
    if (currentComment !== null && line.includes('*/')) {
      const commentLine = line.replace(/^\s*\*\s?/, '').replace('*/', '');
      currentComment += commentLine;

      // Parse next line to find what this comment documents
      let nextLine = i + 1;
      while (nextLine < lines.length && lines[nextLine].trim() === '') {
        nextLine++;
      }

      if (nextLine < lines.length) {
        const declaration = lines[nextLine];
        const parsed = parseComment(currentComment, declaration, filePath, baseDir, commentStartLine);
        if (parsed) {
          comments.push(parsed);
        }
      }

      currentComment = null;
    }
  }

  return comments;
}

/**
 * Parse a TSDoc comment into structured data
 */
function parseComment(
  comment: string,
  declaration: string,
  filePath: string,
  baseDir: string,
  line: number
): TSDocComment | null {
  const lines = comment.split('\n');
  let description = '';
  const params: Array<{ name: string; type?: string; description?: string }> = [];
  let returns: { type?: string; description?: string } | undefined;
  let example = '';
  const tags: Record<string, string> = {};

  let currentSection: 'description' | 'example' | null = 'description';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('@param')) {
      currentSection = null;
      const match = trimmed.match(/@param\s+(?:\{([^}]+)\}\s+)?(\w+)\s*-?\s*(.*)/);
      if (match) {
        params.push({
          name: match[2],
          type: match[1],
          description: match[3],
        });
      }
    } else if (trimmed.startsWith('@returns') || trimmed.startsWith('@return')) {
      currentSection = null;
      const match = trimmed.match(/@returns?\s+(?:\{([^}]+)\}\s+)?(.*)/);
      if (match) {
        returns = {
          type: match[1],
          description: match[2],
        };
      }
    } else if (trimmed.startsWith('@example')) {
      currentSection = 'example';
    } else if (trimmed.startsWith('@')) {
      currentSection = null;
      const match = trimmed.match(/@(\w+)\s+(.*)/);
      if (match) {
        tags[match[1]] = match[2];
      }
    } else if (currentSection === 'description' && trimmed) {
      description += (description ? ' ' : '') + trimmed;
    } else if (currentSection === 'example') {
      example += line + '\n';
    }
  }

  // Determine type and name from declaration
  const { type, name } = parseDeclaration(declaration);
  if (!name) return null;

  return {
    file: relative(baseDir, filePath),
    name,
    type,
    description: description.trim(),
    params: params.length > 0 ? params : undefined,
    returns,
    example: example.trim() || undefined,
    tags,
    line,
  };
}

/**
 * Parse a declaration line to determine type and name
 */
function parseDeclaration(declaration: string): { type: TSDocComment['type']; name: string | null } {
  declaration = declaration.trim();

  // Function
  if (declaration.includes('function ')) {
    const match = declaration.match(/function\s+(\w+)/);
    return { type: 'function', name: match?.[1] || null };
  }

  // Const arrow function
  if (declaration.includes('const ') && declaration.includes('=>')) {
    const match = declaration.match(/const\s+(\w+)/);
    return { type: 'function', name: match?.[1] || null };
  }

  // Export function
  if (declaration.includes('export ') && declaration.includes('function ')) {
    const match = declaration.match(/function\s+(\w+)/);
    return { type: 'function', name: match?.[1] || null };
  }

  // Class
  if (declaration.includes('class ')) {
    const match = declaration.match(/class\s+(\w+)/);
    return { type: 'class', name: match?.[1] || null };
  }

  // Interface
  if (declaration.includes('interface ')) {
    const match = declaration.match(/interface\s+(\w+)/);
    return { type: 'interface', name: match?.[1] || null };
  }

  // Type
  if (declaration.includes('type ')) {
    const match = declaration.match(/type\s+(\w+)/);
    return { type: 'type', name: match?.[1] || null };
  }

  // Const
  if (declaration.includes('const ') || declaration.includes('export const ')) {
    const match = declaration.match(/const\s+(\w+)/);
    return { type: 'const', name: match?.[1] || null };
  }

  return { type: 'const', name: null };
}

/**
 * Recursively scan directory for TypeScript files
 */
function scanDirectory(dir: string, baseDir: string): TSDocComment[] {
  const results: TSDocComment[] = [];

  try {
    const files = readdirSync(dir);

    for (const file of files) {
      const filePath = join(dir, file);

      // Skip excluded patterns
      if (EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath))) {
        continue;
      }

      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        results.push(...scanDirectory(filePath, baseDir));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        try {
          results.push(...extractFromFile(filePath, baseDir));
        } catch (error) {
          console.warn(`Warning: Could not parse ${filePath}:`, error);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dir}:`, error);
  }

  return results;
}

/**
 * Format comments as JSON
 */
function formatAsJSON(comments: TSDocComment[]): string {
  return JSON.stringify(comments, null, 2);
}

/**
 * Format comments as Markdown
 */
function formatAsMarkdown(comments: TSDocComment[]): string {
  let md = '---\n';
  md += 'title: API Reference (Generated)\n';
  md += 'description: Auto-generated API documentation from TSDoc comments\n';
  md += '---\n\n';
  md += '# API Reference (Generated)\n\n';
  md += `> **Note:** This file is auto-generated from TSDoc comments. Last updated: ${new Date().toISOString()}\n\n`;

  // Group by file
  const byFile = comments.reduce((acc, comment) => {
    if (!acc[comment.file]) acc[comment.file] = [];
    acc[comment.file].push(comment);
    return acc;
  }, {} as Record<string, TSDocComment[]>);

  for (const [file, fileComments] of Object.entries(byFile)) {
    md += `## ${file}\n\n`;

    for (const comment of fileComments) {
      md += `### \`${comment.name}\` (${comment.type})\n\n`;

      if (comment.description) {
        md += `${comment.description}\n\n`;
      }

      if (comment.params && comment.params.length > 0) {
        md += '**Parameters:**\n\n';
        for (const param of comment.params) {
          md += `- \`${param.name}\`${param.type ? ` (${param.type})` : ''}`;
          if (param.description) md += ` - ${param.description}`;
          md += '\n';
        }
        md += '\n';
      }

      if (comment.returns) {
        md += '**Returns:**';
        if (comment.returns.type) md += ` \`${comment.returns.type}\``;
        if (comment.returns.description) md += ` - ${comment.returns.description}`;
        md += '\n\n';
      }

      if (comment.example) {
        md += '**Example:**\n\n';
        md += '```typescript\n';
        md += comment.example;
        md += '\n```\n\n';
      }

      if (Object.keys(comment.tags).length > 0) {
        md += '**Tags:**\n\n';
        for (const [tag, value] of Object.entries(comment.tags)) {
          md += `- @${tag}: ${value}\n`;
        }
        md += '\n';
      }

      md += `*Source: [${file}:${comment.line}](../${file}#L${comment.line})*\n\n`;
      md += '---\n\n';
    }
  }

  return md;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const format = args.includes('--format=md') || args.includes('--format') && args[args.indexOf('--format') + 1] === 'md'
    ? 'md'
    : 'json';

  console.log('🔍 Scanning for TSDoc comments...\n');

  const baseDir = process.cwd();
  const allComments: TSDocComment[] = [];

  for (const dir of SCAN_DIRS) {
    const fullPath = join(baseDir, dir);
    console.log(`Scanning ${dir}/...`);
    const comments = scanDirectory(fullPath, baseDir);
    allComments.push(...comments);
    console.log(`  Found ${comments.length} documented items\n`);
  }

  console.log(`\n✅ Total: ${allComments.length} documented items\n`);

  if (allComments.length === 0) {
    console.log('ℹ️  No TSDoc comments found. Add JSDoc comments to your code like this:\n');
    console.log('/**');
    console.log(' * Description of your function');
    console.log(' * @param name - Parameter description');
    console.log(' * @returns Return value description');
    console.log(' */');
    console.log('export function myFunction(name: string) { ... }\n');
    return;
  }

  if (isDryRun) {
    console.log('📋 Preview (first 3 items):\n');
    console.log(JSON.stringify(allComments.slice(0, 3), null, 2));
    console.log('\n(Use without --dry-run to save to file)');
    return;
  }

  const outputDir = join(baseDir, 'content/docs');
  let outputPath: string;
  let content: string;

  if (format === 'md') {
    outputPath = join(outputDir, 'api-reference-generated.mdx');
    content = formatAsMarkdown(allComments);
  } else {
    outputPath = join(outputDir, 'api-reference.json');
    content = formatAsJSON(allComments);
  }

  writeFileSync(outputPath, content, 'utf-8');
  console.log(`💾 Saved to: ${relative(baseDir, outputPath)}\n`);

  // Print summary
  const byType = allComments.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📊 Summary by type:');
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }
  console.log();
}

// Run the script
main();
