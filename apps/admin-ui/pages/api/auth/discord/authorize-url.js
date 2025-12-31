import crypto from "crypto";
import { getPublicOrigin } from "../../../../lib/oauth-origin";

function isLoopbackHostname(hostname) {
  const normalized = String(hostname || "").trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1") return true;
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    const inner = normalized.slice(1, -1);
    if (inner === "::1") return true;
  }
  if (normalized.endsWith(".localhost")) return true;
  return false;
}

function allowLoopbackOauth() {
  if (process.env.NODE_ENV !== "production") return true;
  const raw = String(process.env.ALLOW_LOCALHOST_OAUTH || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function normalizePostLoginPath(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\")) return null;
  if (trimmed.includes("\r") || trimmed.includes("\n")) return null;
  return trimmed;
}

function isCallbackPath(path) {
  const p = String(path || "").split("?")[0].split("#")[0];
  const discordCallbackPath = "/api/auth/" + "discord/callback";
  return (
    p === "/api/auth/callback" ||
    p.startsWith("/api/auth/callback/") ||
    p === discordCallbackPath ||
    p.startsWith(`${discordCallbackPath}/`)
  );
}

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } });
  }

  // Derive public origin with security validation
  const origin = getPublicOrigin(req);

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ ok: false, error: { code: "MISSING_CLIENT_ID" } });
  }

  // Single source of truth: use DISCORD_REDIRECT_URI directly (no proxy prefix/path concatenation).
  // This must match the Discord app's whitelisted Redirect URLs exactly.
  const rawRedirect = String(process.env.DISCORD_REDIRECT_URI || "").trim();
  let redirectUri = rawRedirect;

  if (!redirectUri) {
    // Reasonable fallback for local dev (still derived from origin, but only when env is unset).
    redirectUri = `${origin}/api/auth/callback`;
  } else if (redirectUri.startsWith("/")) {
    // Allow setting a path-only redirect URI, resolved against the public origin.
    redirectUri = new URL(redirectUri, origin).toString();
  }

  if (redirectUri.includes("/api/admin-api/")) {
    return res.status(500).json({
      ok: false,
      error: {
        code: "INVALID_DISCORD_REDIRECT_URI",
        message: "DISCORD_REDIRECT_URI must not include /api/admin-api/",
      },
      redirectUri,
    });
  }

  // Safety rail: never emit loopback redirect URIs to clients in production.
  if (!allowLoopbackOauth()) {
    try {
      const u = new URL(redirectUri);
      if (isLoopbackHostname(u.hostname)) {
        return res.status(500).json({
          ok: false,
          error: {
            code: "DISALLOWED_DISCORD_REDIRECT_URI",
            message: "DISCORD_REDIRECT_URI must not point at loopback/localhost in production",
          },
        });
      }
    } catch {
      // ignore parse failures; redirectUri is expected to be absolute by this point
    }
  }

  // Temporary debug headers (useful for curl / DevTools without reading logs)
  res.setHeader("x-slimy-oauth-origin", origin);
  res.setHeader("x-slimy-oauth-redirect-uri", redirectUri);

  // Temporary debug: report whether env was used (no secrets)
  res.setHeader("x-slimy-oauth-redirect-source", rawRedirect ? "env:DISCORD_REDIRECT_URI" : "fallback:origin");

  const state = crypto.randomBytes(16).toString("hex");

  const configuredPostLogin =
    normalizePostLoginPath(String(process.env.ADMIN_UI_POST_LOGIN_REDIRECT || "")) || "/guilds";
  const returnTo = isCallbackPath(configuredPostLogin) ? "/" : configuredPostLogin;

  // Cookies must be set on the admin-ui origin (localhost:3001)
  // IMPORTANT: omit Domain entirely for localhost reliability.
  const cookieBase = "Path=/; HttpOnly; SameSite=Lax";
  const cookies = [
    `oauth_state=${encodeURIComponent(state)}; ${cookieBase}`,
    `oauth_return_to=${encodeURIComponent(returnTo)}; ${cookieBase}`,
    `oauth_redirect_uri=${encodeURIComponent(redirectUri)}; ${cookieBase}`,
  ];
  res.setHeader("Set-Cookie", cookies);
  res.setHeader("Cache-Control", "no-store");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify guilds",
    state,
    prompt: "consent",
  });

  const location = `https://discord.com/oauth2/authorize?${params.toString()}`;

  // Debug mode: return computed values (no secrets).
  if ("debug" in req.query) {
    const redactedParams = new URLSearchParams(params);
    redactedParams.set("client_id", "REDACTED");
    return res.status(200).json({
      ok: true,
      redirectUri,
      returnTo,
      authorizeUrl: `https://discord.com/oauth2/authorize?${redactedParams.toString()}`,
    });
  }

  res.statusCode = 302;
  res.setHeader("Location", location);
  return res.end();
}
