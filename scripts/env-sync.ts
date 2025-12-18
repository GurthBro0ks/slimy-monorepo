import fs from "node:fs";
import path from "node:path";

type Schema = {
  sourceFile: string;
  targets: Record<string, { include: string[] }>;
  required?: string[];
  placeholderReject?: string[];
};

const REPO_ROOT = path.resolve(__dirname, "..");

function readJson(p: string): any {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function fileExists(p: string) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Minimal .env parser that preserves raw values.
 * - Supports KEY=VALUE
 * - Ignores blank lines and comments starting with #
 * - Does not expand variables (keep simple and predictable)
 */
function parseEnvFile(raw: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1); // keep raw (may include quotes/spaces)
    if (key) out.set(key, value);
  }
  return out;
}

function globMatch(pattern: string, key: string): boolean {
  if (!pattern.includes("*")) return pattern === key;
  const [pre, post] = pattern.split("*");
  return key.startsWith(pre) && key.endsWith(post ?? "");
}

function expandIncludes(allKeys: string[], include: string[]): string[] {
  const picked = new Set<string>();
  for (const pat of include) {
    if (pat.includes("*")) {
      for (const k of allKeys) if (globMatch(pat, k)) picked.add(k);
    } else {
      picked.add(pat);
    }
  }
  return [...picked];
}

function looksLikePlaceholder(v: string, rejects: string[]): boolean {
  const raw = v.trim().replace(/^["']|["']$/g, "");
  return rejects.some((r) => raw.includes(r));
}

function writeTarget(
  targetAbs: string,
  keys: string[],
  env: Map<string, string>,
  sourceRel: string,
) {
  const header = `# AUTO-GENERATED FILE — DO NOT EDIT
# Source: ${sourceRel}
# Generated: ${new Date().toISOString()}
`;
  const lines: string[] = [];
  for (const k of keys.sort()) {
    const v = env.get(k);
    if (v === undefined) continue;
    lines.push(`${k}=${v}`);
  }
  fs.mkdirSync(path.dirname(targetAbs), { recursive: true });
  fs.writeFileSync(targetAbs, header + "\n" + lines.join("\n") + "\n", "utf8");
}

function ensureSymlink(targetAbs: string, sourceAbs: string) {
  const linkTarget = path.relative(path.dirname(targetAbs), sourceAbs) || ".";

  try {
    const st = fs.lstatSync(targetAbs);
    if (st.isSymbolicLink()) {
      const existing = fs.readlinkSync(targetAbs);
      if (existing === linkTarget) return { changed: false };
      fs.unlinkSync(targetAbs);
    } else {
      fs.rmSync(targetAbs, { force: true });
    }
  } catch {
    // doesn't exist
  }

  fs.mkdirSync(path.dirname(targetAbs), { recursive: true });
  fs.symlinkSync(linkTarget, targetAbs);
  return { changed: true };
}

function main() {
  const schemaPath = path.join(REPO_ROOT, "config", "env.schema.json");
  if (!fileExists(schemaPath)) {
    console.error("Missing config/env.schema.json");
    process.exit(2);
  }
  const schema = readJson(schemaPath) as Schema;

  const sourceAbs = path.join(REPO_ROOT, schema.sourceFile);
  if (!fileExists(sourceAbs)) {
    console.error(
      `Missing canonical env file: ${schema.sourceFile} (expected at repo root)`,
    );
    process.exit(2);
  }

  const raw = fs.readFileSync(sourceAbs, "utf8");
  const env = parseEnvFile(raw);
  const allKeys = [...env.keys()];

  const rejects = schema.placeholderReject ?? [];

  const required = schema.required ?? [];
  const missing: string[] = [];
  const placeholder: string[] = [];
  for (const k of required) {
    const v = env.get(k);
    if (!v) {
      missing.push(k);
      continue;
    }
    if (rejects.length && looksLikePlaceholder(v, rejects)) placeholder.push(k);
  }
  if (missing.length || placeholder.length) {
    if (missing.length)
      console.error(`Missing required env keys: ${missing.join(", ")}`);
    if (placeholder.length)
      console.error(
        `Required keys look like placeholders: ${placeholder.join(", ")}`,
      );
    process.exit(1);
  }

  const symlinkMode = process.argv.includes("--symlink");
  const sourceRel = `/${schema.sourceFile}`;

  for (const [targetRel, cfg] of Object.entries(schema.targets)) {
    const targetAbs = path.join(REPO_ROOT, targetRel);

    if (symlinkMode) {
      const { changed } = ensureSymlink(targetAbs, sourceAbs);
      console.log(
        `${changed ? "Linked" : "Kept"} ${targetRel} -> ${path.relative(
          REPO_ROOT,
          sourceAbs,
        )}`,
      );
      continue;
    }

    const keys = expandIncludes(allKeys, cfg.include);
    const existingKeys = keys.filter((k) => env.has(k));

    writeTarget(targetAbs, existingKeys, env, sourceRel);
    console.log(`Wrote ${targetRel} (${existingKeys.length} keys)`);
  }

  console.log("env:sync complete (no values printed).");
}

main();

