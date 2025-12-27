const assert = require("assert");
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "pages", "api", "auth", "discord", "callback.js");
const src = fs.readFileSync(file, "utf8");

assert.ok(
  src.includes("ADMIN_API_INTERNAL_URL"),
  "[tripwire] callback proxy must reference ADMIN_API_INTERNAL_URL",
);

assert.ok(
  !/ADMIN_API_INTERNAL_URL\s*\)\s*&&\s*!\s*process\.env\.ADMIN_API_INTERNAL_URL\.includes\("localhost"\)/.test(src) &&
    !/ADMIN_API_INTERNAL_URL\.includes\("localhost"\)/.test(src),
  "[tripwire] callback proxy must not ignore ADMIN_API_INTERNAL_URL when it contains localhost (host-network deployments)",
);

assert.ok(
  src.includes("http://admin-api:3080"),
  "[tripwire] callback proxy must keep docker-network fallback upstream http://admin-api:3080",
);

assert.ok(
  !src.includes("String(e?.message") && !src.includes("String(e?.message || e)"),
  "[tripwire] callback proxy must not return raw upstream error messages to clients (no internal DNS/loopback leaks)",
);

console.log("[PASS] auth callback proxy tripwires");
