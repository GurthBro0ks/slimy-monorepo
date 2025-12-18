import fs from "node:fs";
import path from "node:path";

type Schema = {
  sourceFile: string;
  required?: string[];
  placeholderReject?: string[];
};

const REPO_ROOT = path.resolve(__dirname, "..");

function fileExists(p: string) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function readJson(p: string): any {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function parseEnvFile(raw: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1);
    if (key) out.set(key, value);
  }
  return out;
}

function looksLikePlaceholder(v: string, rejects: string[]): boolean {
  const raw = v.trim().replace(/^["']|["']$/g, "");
  return rejects.some((r) => raw.includes(r));
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

  const required = schema.required ?? [];
  const rejects = schema.placeholderReject ?? [];

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

  console.log(
    `env:check OK (${required.length} required keys present; no values printed).`,
  );
}

main();

