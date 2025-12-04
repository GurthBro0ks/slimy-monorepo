import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

console.log("Scanning for deprecated code usage...\n");

// Step 1: Find all deprecated exports in packages
const deprecatedExports = new Map<string, { file: string; line: number; reason: string }>();

const packageFiles = glob.sync("packages/*/src/**/*.{ts,tsx}", { cwd: process.cwd() });

for (const file of packageFiles) {
  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split("\n");
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line has a @deprecated JSDoc tag
    if (line.includes("@deprecated")) {
      // Look ahead for the export statement
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const exportLine = lines[j];
        
        // Match various export patterns
        const exportMatch = exportLine.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/);
        if (exportMatch) {
          const exportName = exportMatch[1];
          const reasonMatch = line.match(/@deprecated\s+(.+)/);
          const reason = reasonMatch ? reasonMatch[1].trim() : "No reason provided";
          
          deprecatedExports.set(exportName, {
            file,
            line: j + 1,
            reason,
          });
          break;
        }
      }
    }
  }
}

console.log(`Found ${deprecatedExports.size} deprecated export(s) in packages:\n`);
for (const [name, info] of deprecatedExports.entries()) {
  console.log(`  - ${name} (${info.file}:${info.line})`);
  console.log(`    Reason: ${info.reason}\n`);
}

// Step 2: Find usages of deprecated exports in apps
let deprecatedUsagesFound = 0;

const appFiles = glob.sync("apps/**/src/**/*.{ts,tsx}", { cwd: process.cwd() })
  .concat(glob.sync("apps/**/app/**/*.{ts,tsx}", { cwd: process.cwd() }));

for (const file of appFiles) {
  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split("\n");
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line imports from a local package
    if (line.includes("from") && line.includes("@slimy")) {
      // Extract imported names
      const importMatch = line.match(/import\s+\{([^}]+)\}\s+from/);
      if (importMatch) {
        const imports = importMatch[1].split(",").map(s => s.trim());
        
        for (const importName of imports) {
          if (deprecatedExports.has(importName)) {
            const info = deprecatedExports.get(importName)!;
            console.warn(
              `[WARNING] Deprecated usage: '${importName}' is used in ${file}:${i + 1}`
            );
            console.warn(`  Reason: ${info.reason}\n`);
            deprecatedUsagesFound++;
          }
        }
      }
    }
  }
}

console.log("----------------------------------------");
if (deprecatedUsagesFound > 0) {
  console.log(`Audit complete. Found ${deprecatedUsagesFound} deprecated usage(s).`);
  process.exit(1); // Exit with error code to fail CI/CD
} else {
  console.log("Audit complete. No deprecated usages found. Excellent!");
  process.exit(0);
}
