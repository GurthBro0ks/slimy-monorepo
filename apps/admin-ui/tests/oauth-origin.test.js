const assert = require("assert");
const {
  normalizeOrigin,
  isAllowedOrigin,
  getPublicOrigin,
  firstHeader,
  withForwardedPortIfMissing,
  isLocalhostHostname,
  DEFAULT_FALLBACK,
} = require("../lib/oauth-origin");

// Mock request helper
function mockReq(headers = {}) {
  return { headers };
}

// ===== normalizeOrigin tests =====
assert.strictEqual(normalizeOrigin("https://example.com"), "https://example.com");
assert.strictEqual(normalizeOrigin("https://example.com/"), "https://example.com");
assert.strictEqual(normalizeOrigin("https://example.com/path"), "https://example.com");
assert.strictEqual(normalizeOrigin("http://localhost:3001"), "http://localhost:3001");
assert.strictEqual(normalizeOrigin(""), "");
assert.strictEqual(normalizeOrigin(null), "");
assert.strictEqual(normalizeOrigin(undefined), "");
console.log("[PASS] normalizeOrigin tests");

// ===== isLocalhostHostname tests =====
assert.strictEqual(isLocalhostHostname("localhost"), true);
assert.strictEqual(isLocalhostHostname("127.0.0.1"), true);
assert.strictEqual(isLocalhostHostname("::1"), true);
assert.strictEqual(isLocalhostHostname("[::1]"), true); // bracketed IPv6 from URL parser
assert.strictEqual(isLocalhostHostname("foo.localhost"), true);
assert.strictEqual(isLocalhostHostname("example.com"), false);
assert.strictEqual(isLocalhostHostname("admin.slimyai.xyz"), false);
assert.strictEqual(isLocalhostHostname(""), false);
console.log("[PASS] isLocalhostHostname tests");

// ===== firstHeader tests =====
assert.strictEqual(firstHeader(mockReq({ host: "localhost:3001" }), "host", ""), "localhost:3001");
assert.strictEqual(firstHeader(mockReq({ host: "a, b, c" }), "host", ""), "a");
assert.strictEqual(firstHeader(mockReq({}), "host", "fallback"), "fallback");
assert.strictEqual(firstHeader(mockReq({ "x-forwarded-proto": "https, http" }), "x-forwarded-proto", ""), "https");
console.log("[PASS] firstHeader tests");

// ===== withForwardedPortIfMissing tests =====
assert.strictEqual(withForwardedPortIfMissing("localhost", "3010"), "localhost:3010");
assert.strictEqual(withForwardedPortIfMissing("localhost:3001", "3010"), "localhost:3001"); // never override
assert.strictEqual(withForwardedPortIfMissing("[::1]", "3010"), "[::1]:3010");
assert.strictEqual(withForwardedPortIfMissing("[::1]:3001", "3010"), "[::1]:3001"); // never override
assert.strictEqual(withForwardedPortIfMissing("localhost", ""), "localhost");
assert.strictEqual(withForwardedPortIfMissing("", "3010"), "");
console.log("[PASS] withForwardedPortIfMissing tests");

// ===== isAllowedOrigin tests (dev mode with ALLOW_LOCALHOST_OAUTH) =====
// Use explicit env var to allow localhost (since NODE_ENV may be replaced at build time)
const originalNodeEnv = process.env.NODE_ENV;
const originalAllowLocalhost = process.env.ALLOW_LOCALHOST_OAUTH;
process.env.ALLOW_LOCALHOST_OAUTH = "1";

assert.strictEqual(isAllowedOrigin("http://localhost:3001"), true);
assert.strictEqual(isAllowedOrigin("http://localhost:3010"), true);
assert.strictEqual(isAllowedOrigin("http://localhost:9999"), true);
assert.strictEqual(isAllowedOrigin("http://localhost:3080"), false); // never allow admin-api port
assert.strictEqual(isAllowedOrigin("http://127.0.0.1:3001"), true);
assert.strictEqual(isAllowedOrigin("http://127.0.0.1:3080"), false); // never allow admin-api port
assert.strictEqual(isAllowedOrigin("http://[::1]:3001"), true);
assert.strictEqual(isAllowedOrigin("https://admin.slimyai.xyz"), true);
assert.strictEqual(isAllowedOrigin("https://slimyai.xyz"), true);
assert.strictEqual(isAllowedOrigin("https://www.slimyai.xyz"), true);
assert.strictEqual(isAllowedOrigin("https://evil.com"), false);
assert.strictEqual(isAllowedOrigin("https://attacker.slimyai.xyz"), false);
console.log("[PASS] isAllowedOrigin tests (dev mode)");

// ===== isAllowedOrigin tests (production mode - localhost disabled) =====
process.env.ALLOW_LOCALHOST_OAUTH = "0";

assert.strictEqual(isAllowedOrigin("https://admin.slimyai.xyz"), true);
assert.strictEqual(isAllowedOrigin("https://slimyai.xyz"), true);
assert.strictEqual(isAllowedOrigin("https://www.slimyai.xyz"), true);
assert.strictEqual(isAllowedOrigin("http://localhost:3001"), false); // localhost not allowed
assert.strictEqual(isAllowedOrigin("https://evil.com"), false);
console.log("[PASS] isAllowedOrigin tests (production mode)");

// Restore env vars
process.env.NODE_ENV = originalNodeEnv;
if (originalAllowLocalhost === undefined) {
  delete process.env.ALLOW_LOCALHOST_OAUTH;
} else {
  process.env.ALLOW_LOCALHOST_OAUTH = originalAllowLocalhost;
}

// ===== getPublicOrigin tests =====
// Enable localhost for these tests
process.env.ALLOW_LOCALHOST_OAUTH = "1";

// Test 1: host header with port → uses that port
const req1 = mockReq({ host: "localhost:3010" });
assert.strictEqual(getPublicOrigin(req1), "http://localhost:3010");

// Test 1b: localhost:3080 is never allowed → fall back
const req1b = mockReq({ host: "localhost:3080" });
assert.strictEqual(getPublicOrigin(req1b), DEFAULT_FALLBACK);

// Test 2: x-forwarded headers for production domain
const req2 = mockReq({
  "x-forwarded-host": "admin.slimyai.xyz",
  "x-forwarded-proto": "https",
});
assert.strictEqual(getPublicOrigin(req2), "https://admin.slimyai.xyz");

// Test 3: evil host falls back to default (not reflected)
const req3 = mockReq({ host: "evil.com" });
const result3 = getPublicOrigin(req3);
assert.strictEqual(result3, DEFAULT_FALLBACK);

// Test 4: no headers at all → falls back to default
const req4 = mockReq({});
assert.strictEqual(getPublicOrigin(req4), DEFAULT_FALLBACK);

// Test 5: x-forwarded-port adds port to host
const req5 = mockReq({
  host: "localhost",
  "x-forwarded-port": "3010",
});
assert.strictEqual(getPublicOrigin(req5), "http://localhost:3010");

// Test 6: comma-separated forwarded headers (takes first)
const req6 = mockReq({
  "x-forwarded-host": "admin.slimyai.xyz, proxy.internal",
  "x-forwarded-proto": "https, http",
});
assert.strictEqual(getPublicOrigin(req6), "https://admin.slimyai.xyz");

console.log("[PASS] getPublicOrigin tests");

// Cleanup
delete process.env.ALLOW_LOCALHOST_OAUTH;

console.log("\n=== All oauth-origin tests passed ===");
