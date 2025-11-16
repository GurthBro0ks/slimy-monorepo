#!/usr/bin/env tsx
/**
 * Bundle Size Monitoring Script
 * 
 * Analyzes bundle sizes after build and reports if they exceed thresholds.
 * Can be used in CI/CD pipelines to prevent bundle size regressions.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface BundleSizeConfig {
  maxInitialBundleSize: number; // in KB
  maxRouteChunkSize: number; // in KB
  maxTotalBundleSize: number; // in KB
  warnThreshold: number; // percentage (0-1)
}

const DEFAULT_CONFIG: BundleSizeConfig = {
  maxInitialBundleSize: 1000, // 1MB
  maxRouteChunkSize: 500, // 500KB
  maxTotalBundleSize: 3000, // 3MB
  warnThreshold: 0.8, // Warn at 80% of limit
};

interface BundleInfo {
  name: string;
  size: number; // in bytes
  sizeKB: number;
}

function parseBuildManifest(buildDir: string): BundleInfo[] {
  const manifestPath = join(buildDir, '.next', 'build-manifest.json');
  
  if (!existsSync(manifestPath)) {
    throw new Error(`Build manifest not found at ${manifestPath}. Run 'next build' first.`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const bundles: BundleInfo[] = [];

  // Parse pages and their chunks
  if (manifest.pages) {
    Object.entries(manifest.pages).forEach(([page, chunkValue]) => {
      const chunkList = Array.isArray(chunkValue)
        ? chunkValue
        : typeof chunkValue === 'string'
          ? [chunkValue]
          : [];

      chunkList.forEach((chunk) => {
        const chunkPath = join(buildDir, '.next', chunk);
        if (existsSync(chunkPath)) {
          const stats = require('fs').statSync(chunkPath);
          bundles.push({
            name: `${page} -> ${chunk}`,
            size: stats.size,
            sizeKB: Math.round(stats.size / 1024),
          });
        }
      });
    });
  }

  return bundles;
}

function getInitialBundleSize(buildDir: string): number {
  const staticDir = join(buildDir, '.next', 'static', 'chunks');
  if (!existsSync(staticDir)) {
    return 0;
  }

  // Find main app chunk (usually main-app.js or similar)
  const mainChunks = [
    'main-app.js',
    'main.js',
    'webpack.js',
  ];

  let totalSize = 0;
  const { readdirSync, statSync } = require('fs');
  
  try {
    const files = readdirSync(staticDir);
    files.forEach((file: string) => {
      if (mainChunks.some(chunk => file.includes(chunk)) || file.match(/^main-[a-z0-9]+\.js$/)) {
        const filePath = join(staticDir, file);
        const stats = statSync(filePath);
        totalSize += stats.size;
      }
    });
  } catch (error) {
    console.warn('Could not read static chunks directory:', error);
  }

  return Math.round(totalSize / 1024); // Convert to KB
}

function analyzeBundleSizes(config: BundleSizeConfig = DEFAULT_CONFIG): {
  passed: boolean;
  warnings: string[];
  errors: string[];
  summary: {
    initialBundleSizeKB: number;
    totalBundles: number;
    largestChunkKB: number;
  };
} {
  const buildDir = process.cwd();
  const warnings: string[] = [];
  const errors: string[] = [];

  // Get initial bundle size
  const initialBundleSizeKB = getInitialBundleSize(buildDir);
  
  // Parse all bundles
  let bundles: BundleInfo[] = [];
  try {
    bundles = parseBuildManifest(buildDir);
  } catch (error) {
    console.warn('Could not parse build manifest:', error);
  }

  const largestChunkKB = bundles.length > 0 
    ? Math.max(...bundles.map(b => b.sizeKB))
    : 0;

  const totalBundleSizeKB = bundles.reduce((sum, b) => sum + b.sizeKB, 0);

  // Check initial bundle size
  if (initialBundleSizeKB > config.maxInitialBundleSize) {
    errors.push(
      `Initial bundle size (${initialBundleSizeKB}KB) exceeds limit (${config.maxInitialBundleSize}KB)`
    );
  } else if (initialBundleSizeKB > config.maxInitialBundleSize * config.warnThreshold) {
    warnings.push(
      `Initial bundle size (${initialBundleSizeKB}KB) is ${Math.round((initialBundleSizeKB / config.maxInitialBundleSize) * 100)}% of limit`
    );
  }

  // Check largest chunk
  if (largestChunkKB > config.maxRouteChunkSize) {
    errors.push(
      `Largest chunk (${largestChunkKB}KB) exceeds limit (${config.maxRouteChunkSize}KB)`
    );
  }

  // Check total bundle size
  if (totalBundleSizeKB > config.maxTotalBundleSize) {
    warnings.push(
      `Total bundle size (${totalBundleSizeKB}KB) exceeds recommended limit (${config.maxTotalBundleSize}KB)`
    );
  }

  const passed = errors.length === 0;

  return {
    passed,
    warnings,
    errors,
    summary: {
      initialBundleSizeKB,
      totalBundles: bundles.length,
      largestChunkKB,
    },
  };
}

function main() {
  const config: BundleSizeConfig = {
    maxInitialBundleSize: parseInt(process.env.MAX_INITIAL_BUNDLE_KB || '1000', 10),
    maxRouteChunkSize: parseInt(process.env.MAX_ROUTE_CHUNK_KB || '500', 10),
    maxTotalBundleSize: parseInt(process.env.MAX_TOTAL_BUNDLE_KB || '3000', 10),
    warnThreshold: parseFloat(process.env.BUNDLE_WARN_THRESHOLD || '0.8'),
  };

  console.log('📦 Analyzing bundle sizes...\n');
  console.log('Configuration:');
  console.log(`  Max initial bundle: ${config.maxInitialBundleSize}KB`);
  console.log(`  Max route chunk: ${config.maxRouteChunkSize}KB`);
  console.log(`  Max total bundle: ${config.maxTotalBundleSize}KB`);
  console.log(`  Warn threshold: ${config.warnThreshold * 100}%\n`);

  const result = analyzeBundleSizes(config);

  console.log('📊 Bundle Size Summary:');
  console.log(`  Initial bundle: ${result.summary.initialBundleSizeKB}KB`);
  console.log(`  Total bundles: ${result.summary.totalBundles}`);
  console.log(`  Largest chunk: ${result.summary.largestChunkKB}KB\n`);

  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`  - ${warning}`));
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach(error => console.log(`  - ${error}`));
    console.log('');
  }

  if (result.passed) {
    console.log('✅ Bundle size checks passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Bundle size checks failed!\n');
    console.log('💡 Tips to reduce bundle size:');
    console.log('  - Use dynamic imports for heavy components');
    console.log('  - Lazy load routes that aren\'t immediately needed');
    console.log('  - Optimize images with next/image');
    console.log('  - Remove unused dependencies');
    console.log('  - Run "npm run build:analyze" for detailed analysis\n');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { analyzeBundleSizes, type BundleSizeConfig };
