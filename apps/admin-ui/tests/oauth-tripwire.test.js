const assert = require("assert");
const fs = require("fs");
const path = require("path");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function isSourceFile(file) {
  return /\.(jsx?|tsx?)$/.test(file) && !/\.d\.ts$/.test(file);
}

function rel(p) {
  return p.replace(process.cwd() + path.sep, "");
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

// ====== Tripwire 1: authorize-url must be canonical ======
const authorizeFile = path.join(__dirname, "..", "pages", "api", "auth", "discord", "authorize-url.js");
const authorizeSrc = read(authorizeFile);

assert.ok(
  authorizeSrc.includes("/api/auth/discord/callback"),
  `[tripwire] ${rel(authorizeFile)} must use /api/auth/discord/callback`,
);
assert.ok(
  !authorizeSrc.includes("/api/auth/callback"),
  `[tripwire] ${rel(authorizeFile)} must not reference legacy /api/auth/callback`,
);
assert.ok(
  !authorizeSrc.includes("/api/admin-api/"),
  `[tripwire] ${rel(authorizeFile)} must not reference /api/admin-api/`,
);
assert.ok(
  !authorizeSrc.includes("localhost:3080"),
  `[tripwire] ${rel(authorizeFile)} must not reference localhost:3080`,
);
console.log("[PASS] authorize-url canonical redirect_uri");

// ====== Tripwire 2: client bundle must not link to legacy login/proxy paths ======
const appRoot = path.join(__dirname, "..");
const scanRoots = ["pages", "components", "lib"].map((p) => path.join(appRoot, p));

const banned = [
  { needle: "/api/admin-api/", reason: "proxy path must not be used in browser" },
  { needle: "NEXT_PUBLIC_ADMIN_API_PUBLIC_URL", reason: "browser must not build absolute admin-api URLs" },
  { needle: "/api/auth/login", reason: "browser must use /api/auth/discord/authorize-url" },
];

const files = scanRoots.flatMap((dir) => (fs.existsSync(dir) ? walk(dir) : []));
const candidates = files
  .filter(isSourceFile)
  .filter((file) => !file.includes(`${path.sep}pages${path.sep}api${path.sep}`)); // allow server routes

const hits = [];
for (const file of candidates) {
  const src = read(file);
  for (const { needle, reason } of banned) {
    if (src.includes(needle)) hits.push({ file: rel(file), needle, reason });
  }
}

assert.deepStrictEqual(
  hits,
  [],
  `[tripwire] banned client-side auth/proxy references found:\n${hits
    .map((h) => `- ${h.file}: contains ${JSON.stringify(h.needle)} (${h.reason})`)
    .join("\n")}`,
);
console.log("[PASS] no legacy auth/proxy references in client bundle");

console.log("\n=== All oauth tripwires passed ===");

