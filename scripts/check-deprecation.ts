#!/usr/bin/env tsx
/**
 * Custom Deprecation Checker
 * 
 * This script scans packages/* for exported functions/components with @deprecated JSDoc tags
 * and checks if they are imported and used in apps/*.
 * 
 * Exit codes:
 * - 0: No deprecated usage found
 * - 1: Deprecated usage detected
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

interface DeprecatedExport {
  packageName: string;
  exportName: string;
  filePath: string;
  line: number;
}

interface DeprecationUsage {
  deprecatedExport: DeprecatedExport;
  usageFile: string;
  usageLine: number;
}

const MONOREPO_ROOT = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(MONOREPO_ROOT, 'packages');
const APPS_DIR = path.join(MONOREPO_ROOT, 'apps');

/**
 * Recursively find all TypeScript files in a directory
 */
function findTsFiles(dir: string): string[] {
  const results: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules, dist, build, .next, etc.
    if (entry.name === 'node_modules' || entry.name === 'dist' || 
        entry.name === 'build' || entry.name === '.next' || 
        entry.name === 'coverage' || entry.name === '.turbo') {
      continue;
    }
    
    if (entry.isDirectory()) {
      results.push(...findTsFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

/**
 * Check if a node has a @deprecated JSDoc tag
 */
function hasDeprecatedTag(node: ts.Node, sourceFile: ts.SourceFile): boolean {
  const jsDocTags = ts.getJSDocTags(node);
  return jsDocTags.some(tag => tag.tagName.text === 'deprecated');
}

/**
 * Extract deprecated exports from a TypeScript file
 */
function extractDeprecatedExports(filePath: string, packageName: string): DeprecatedExport[] {
  const deprecated: DeprecatedExport[] = [];
  
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  function visit(node: ts.Node) {
    // Check for exported functions
    if (ts.isFunctionDeclaration(node) && node.name) {
      const hasExportModifier = node.modifiers?.some(
        mod => mod.kind === ts.SyntaxKind.ExportKeyword
      );
      
      if (hasExportModifier && hasDeprecatedTag(node, sourceFile)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        deprecated.push({
          packageName,
          exportName: node.name.text,
          filePath,
          line: line + 1,
        });
      }
    }
    
    // Check for exported variables (including arrow functions and React components)
    if (ts.isVariableStatement(node)) {
      const hasExportModifier = node.modifiers?.some(
        mod => mod.kind === ts.SyntaxKind.ExportKeyword
      );
      
      if (hasExportModifier && hasDeprecatedTag(node, sourceFile)) {
        node.declarationList.declarations.forEach(decl => {
          if (ts.isIdentifier(decl.name)) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            deprecated.push({
              packageName,
              exportName: decl.name.text,
              filePath,
              line: line + 1,
            });
          }
        });
      }
    }
    
    // Check for exported classes
    if (ts.isClassDeclaration(node) && node.name) {
      const hasExportModifier = node.modifiers?.some(
        mod => mod.kind === ts.SyntaxKind.ExportKeyword
      );
      
      if (hasExportModifier && hasDeprecatedTag(node, sourceFile)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        deprecated.push({
          packageName,
          exportName: node.name.text,
          filePath,
          line: line + 1,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return deprecated;
}

/**
 * Find all deprecated exports in packages/*
 */
function findDeprecatedExports(): DeprecatedExport[] {
  const allDeprecated: DeprecatedExport[] = [];
  
  if (!fs.existsSync(PACKAGES_DIR)) {
    console.warn(`⚠️  Packages directory not found: ${PACKAGES_DIR}`);
    return allDeprecated;
  }

  const packages = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

  for (const pkg of packages) {
    const pkgPath = path.join(PACKAGES_DIR, pkg);
    const tsFiles = findTsFiles(pkgPath);
    
    for (const file of tsFiles) {
      const deprecated = extractDeprecatedExports(file, pkg);
      allDeprecated.push(...deprecated);
    }
  }

  return allDeprecated;
}

/**
 * Check if a file imports and uses a deprecated export
 */
function checkFileForDeprecatedUsage(
  filePath: string,
  deprecatedExports: DeprecatedExport[]
): DeprecationUsage[] {
  const usages: DeprecationUsage[] = [];
  
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  // Build a map of imported names to their deprecated exports
  const importedDeprecated = new Map<string, DeprecatedExport>();

  function visitImports(node: ts.Node) {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const moduleName = node.moduleSpecifier.text;
      
      // Check if this import is from one of our packages
      const matchingPackages = deprecatedExports.filter(dep => 
        moduleName.includes(dep.packageName) || moduleName.startsWith('@slimy/')
      );
      
      if (matchingPackages.length === 0) {
        return;
      }

      // Extract imported names
      if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        for (const element of node.importClause.namedBindings.elements) {
          const importedName = element.name.text;
          
          // Check if this imported name matches any deprecated export
          const deprecatedExport = deprecatedExports.find(dep => dep.exportName === importedName);
          if (deprecatedExport) {
            importedDeprecated.set(importedName, deprecatedExport);
          }
        }
      }
      
      // Handle default imports
      if (node.importClause?.name) {
        const importedName = node.importClause.name.text;
        const deprecatedExport = deprecatedExports.find(dep => dep.exportName === importedName);
        if (deprecatedExport) {
          importedDeprecated.set(importedName, deprecatedExport);
        }
      }
    }

    ts.forEachChild(node, visitImports);
  }

  visitImports(sourceFile);

  // Now check for usage of imported deprecated symbols
  if (importedDeprecated.size > 0) {
    function visitUsages(node: ts.Node) {
      if (ts.isIdentifier(node)) {
        const name = node.text;
        const deprecatedExport = importedDeprecated.get(name);
        
        if (deprecatedExport) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          usages.push({
            deprecatedExport,
            usageFile: filePath,
            usageLine: line + 1,
          });
        }
      }

      ts.forEachChild(node, visitUsages);
    }

    visitUsages(sourceFile);
  }

  return usages;
}

/**
 * Find all usages of deprecated exports in apps/*
 */
function findDeprecatedUsages(deprecatedExports: DeprecatedExport[]): DeprecationUsage[] {
  const allUsages: DeprecationUsage[] = [];
  
  if (!fs.existsSync(APPS_DIR)) {
    console.warn(`⚠️  Apps directory not found: ${APPS_DIR}`);
    return allUsages;
  }

  const apps = fs.readdirSync(APPS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

  for (const app of apps) {
    const appPath = path.join(APPS_DIR, app);
    const tsFiles = findTsFiles(appPath);
    
    for (const file of tsFiles) {
      const usages = checkFileForDeprecatedUsage(file, deprecatedExports);
      allUsages.push(...usages);
    }
  }

  return allUsages;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning for deprecated exports in packages/*...\n');
  
  const deprecatedExports = findDeprecatedExports();
  
  if (deprecatedExports.length === 0) {
    console.log('✅ No deprecated exports found in packages/*\n');
    process.exit(0);
  }

  console.log(`📦 Found ${deprecatedExports.length} deprecated export(s):\n`);
  for (const dep of deprecatedExports) {
    const relativePath = path.relative(MONOREPO_ROOT, dep.filePath);
    console.log(`   - ${dep.exportName} in ${relativePath}:${dep.line}`);
  }
  console.log();

  console.log('🔍 Scanning apps/* for usage of deprecated exports...\n');
  
  const usages = findDeprecatedUsages(deprecatedExports);
  
  if (usages.length === 0) {
    console.log('✅ No usage of deprecated exports found in apps/*\n');
    process.exit(0);
  }

  console.log(`❌ Found ${usages.length} usage(s) of deprecated exports:\n`);
  
  // Group usages by deprecated export
  const usagesByExport = new Map<string, DeprecationUsage[]>();
  for (const usage of usages) {
    const key = `${usage.deprecatedExport.packageName}:${usage.deprecatedExport.exportName}`;
    if (!usagesByExport.has(key)) {
      usagesByExport.set(key, []);
    }
    usagesByExport.get(key)!.push(usage);
  }

  for (const [key, usageList] of usagesByExport) {
    const firstUsage = usageList[0];
    const { packageName, exportName, filePath, line } = firstUsage.deprecatedExport;
    const relativeDepPath = path.relative(MONOREPO_ROOT, filePath);
    
    console.log(`⚠️  [WARNING] ${usageList.length} usage(s) of deprecated '${exportName}' from ${packageName}`);
    console.log(`   Deprecated in: ${relativeDepPath}:${line}`);
    console.log(`   Used in:`);
    
    for (const usage of usageList) {
      const relativeUsagePath = path.relative(MONOREPO_ROOT, usage.usageFile);
      console.log(`      - ${relativeUsagePath}:${usage.usageLine}`);
    }
    console.log();
  }

  console.log('❌ Build failed: Deprecated exports are still in use.\n');
  console.log('Please either:');
  console.log('  1. Remove usage of deprecated exports from apps/*');
  console.log('  2. Remove the @deprecated tag if the export should still be used\n');
  
  process.exit(1);
}

main();
