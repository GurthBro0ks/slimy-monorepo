import crypto from "crypto";
import { getPublicOrigin } from "../../../../lib/oauth-origin";

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

  // ✅ This is the only redirect_uri we will ever use from admin-ui now.
  const redirectUri = `${origin}/api/auth/discord/callback`;

  // Temporary debug headers (useful for curl / DevTools without reading logs)
  res.setHeader("x-slimy-oauth-origin", origin);
  res.setHeader("x-slimy-oauth-redirect-uri", redirectUri);

  const configured = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI;
  if (configured && configured !== redirectUri) {
    console.warn(
      "[authorize-url] Mismatch: env.NEXT_PUBLIC_DISCORD_REDIRECT_URI =",
      configured,
      "but generated =",
      redirectUri
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  // Product rule: after login, ALWAYS land on /guilds.
  const returnTo = "/guilds";

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
  console.info("[authorize-url] redirect_uri", redirectUri);
  console.info("[authorize-url] authorize_url", location);
  res.statusCode = 302;
  res.setHeader("Location", location);
  return res.end();
}
