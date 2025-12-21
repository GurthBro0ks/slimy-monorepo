/**
 * OAuth Origin Helper
 *
 * Derives the public origin for OAuth redirect_uri from request headers,
 * with security validation to prevent arbitrary origin reflection.
 */

const DEFAULT_FALLBACK = "http://localhost:3001";

const ALLOWED_PRODUCTION_HOSTS = new Set([
  "admin.slimyai.xyz",
  "slimyai.xyz",
  "www.slimyai.xyz",
]);

/**
 * Extract first value from a potentially comma-separated header.
 */
function firstHeader(req, name, fallback = "") {
  const v = req?.headers?.[name];
  if (!v) return fallback;
  return String(v).split(",")[0].trim();
}

/**
 * Append port to host if not already present.
 * Handles IPv6 bracketed addresses.
 */
function withForwardedPortIfMissing(host, port) {
  if (!host || !port) return host;
  if (!/^[0-9]+$/.test(port)) return host;

  // IPv6 host header should be bracketed: "[::1]:3001"
  if (host.startsWith("[")) {
    const closing = host.indexOf("]");
    if (closing === -1) return host;
    if (host.includes("]:")) return host;
    const base = host.slice(0, closing + 1);
    return `${base}:${port}`;
  }

  // If host has no port, append it. Never override a port already present.
  if (!host.includes(":")) return `${host}:${port}`;

  return host;
}

/**
 * Normalize an origin string to protocol://host format.
 * Strips trailing slashes and handles edge cases.
 */
function normalizeOrigin(value) {
  if (!value) return "";
  try {
    const url = new URL(String(value).trim());
    return `${url.protocol}//${url.host}`;
  } catch {
    return String(value).trim().replace(/\/$/, "");
  }
}

/**
 * Check if a hostname is localhost/loopback.
 * Handles bracketed IPv6 addresses (e.g., [::1] from URL parser).
 */
function isLocalhostHostname(hostname) {
  let normalized = String(hostname || "").trim().toLowerCase();
  if (!normalized) return false;
  // Handle bracketed IPv6 from URL parser
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    normalized = normalized.slice(1, -1);
  }
  if (normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1") return true;
  if (normalized.endsWith(".localhost")) return true;
  return false;
}

/**
 * Check if we should allow localhost origins.
 * Uses a runtime env var check that won't be replaced at build time.
 */
function shouldAllowLocalhost() {
  // ALLOW_LOCALHOST_OAUTH can be set to explicitly control behavior
  const explicit = process.env.ALLOW_LOCALHOST_OAUTH;
  if (explicit === "1" || explicit === "true") return true;
  if (explicit === "0" || explicit === "false") return false;

  // Default: allow localhost unless explicitly in production mode
  // Note: Next.js replaces NODE_ENV at build time, so we also check
  // a runtime-safe indicator
  const nodeEnv = process.env.NODE_ENV;
  const productionIndicator = process.env.SLIMY_PRODUCTION;

  // If explicitly marked as production, don't allow localhost
  if (productionIndicator === "1" || productionIndicator === "true") {
    return false;
  }

  // Default to allowing localhost for development convenience
  return nodeEnv !== "production";
}

/**
 * Check if an origin is allowed based on environment and security rules.
 *
 * Production: only allow admin.slimyai.xyz, slimyai.xyz, www.slimyai.xyz
 * Development: allow localhost/127.0.0.1/::1 with ANY port
 */
function isAllowedOrigin(origin) {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    // Production hosts are always allowed
    if (ALLOWED_PRODUCTION_HOSTS.has(hostname)) {
      return true;
    }

    // Check if localhost should be allowed
    if (isLocalhostHostname(hostname) && shouldAllowLocalhost()) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Derive the public origin from request headers with security validation.
 *
 * Priority order:
 * 1. Request headers: x-forwarded-proto + x-forwarded-host (+ x-forwarded-port) or host
 * 2. Env fallback: PUBLIC_ADMIN_ORIGIN / ADMIN_UI_ORIGIN / NEXT_PUBLIC_ADMIN_UI_ORIGIN
 * 3. Final fallback: http://localhost:3001
 *
 * After deriving origin, validates with isAllowedOrigin().
 * If validation fails, falls back to env override or default.
 */
function getPublicOrigin(req) {
  const envOverride = normalizeOrigin(
    process.env.PUBLIC_ADMIN_ORIGIN ||
    process.env.ADMIN_UI_ORIGIN ||
    process.env.NEXT_PUBLIC_ADMIN_UI_ORIGIN ||
    ""
  );

  // Extract from request headers first (priority over env)
  const protoHeader = firstHeader(req, "x-forwarded-proto", "");
  const rawHost = firstHeader(req, "x-forwarded-host", firstHeader(req, "host", ""));
  const forwardedPort = firstHeader(req, "x-forwarded-port", "");
  const host = withForwardedPortIfMissing(rawHost, forwardedPort);

  if (!host) {
    // No host information at all, use env override or fallback
    if (envOverride && isAllowedOrigin(envOverride)) {
      return envOverride;
    }
    return DEFAULT_FALLBACK;
  }

  // Infer protocol: use header, or default to http for localhost, https otherwise
  let proto = protoHeader;
  if (!proto) {
    try {
      const hostname = host.split(":")[0].toLowerCase();
      proto = isLocalhostHostname(hostname) ? "http" : "https";
    } catch {
      proto = "http";
    }
  }

  const derivedOrigin = `${proto}://${host}`;

  // Validate the derived origin
  if (isAllowedOrigin(derivedOrigin)) {
    return derivedOrigin;
  }

  // Origin not allowed, log and fall back
  console.warn(
    "[oauth-origin] Origin not allowed, falling back:",
    { derived: derivedOrigin, fallback: envOverride || DEFAULT_FALLBACK }
  );

  if (envOverride && isAllowedOrigin(envOverride)) {
    return envOverride;
  }
  return DEFAULT_FALLBACK;
}

module.exports = {
  normalizeOrigin,
  isAllowedOrigin,
  getPublicOrigin,
  // Export for testing
  firstHeader,
  withForwardedPortIfMissing,
  isLocalhostHostname,
  DEFAULT_FALLBACK,
  ALLOWED_PRODUCTION_HOSTS,
};
