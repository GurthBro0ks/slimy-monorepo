const assert = require("assert");
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "pages", "api", "auth", "discord", "authorize-url.js");
const src = fs.readFileSync(file, "utf8");

assert.ok(
  src.includes("ADMIN_UI_POST_LOGIN_REDIRECT"),
  "[tripwire] authorize-url must support ADMIN_UI_POST_LOGIN_REDIRECT for post-login destination",
);

assert.ok(
  !src.includes('const returnTo = "/guilds"'),
  "[tripwire] authorize-url must not hardcode returnTo to /guilds (should be configurable via ADMIN_UI_POST_LOGIN_REDIRECT)",
);

assert.ok(
  src.includes("isCallbackPath") && src.includes("returnTo = isCallbackPath"),
  "[tripwire] authorize-url must loop-guard returnTo when it points at the OAuth callback routes",
);

console.log("[PASS] oauth post-login redirect tripwires");

