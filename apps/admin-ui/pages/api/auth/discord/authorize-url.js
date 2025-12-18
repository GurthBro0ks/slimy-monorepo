import crypto from "crypto";

function firstHeader(req, name, fallback) {
  const v = req.headers[name];
  if (!v) return fallback;
  return String(v).split(",")[0].trim();
}

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

  // If host has no port, append it. Never override a port already present,
  // because some runtimes inject an internal `x-forwarded-port` value.
  if (!host.includes(":")) return `${host}:${port}`;

  return host;
}

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } });
  }

  const proto = firstHeader(req, "x-forwarded-proto", "http");
  const rawHost = firstHeader(req, "x-forwarded-host", firstHeader(req, "host", "localhost:3001"));
  const forwardedPort = firstHeader(req, "x-forwarded-port", "");
  const host = withForwardedPortIfMissing(rawHost, forwardedPort);
  const origin = `${proto}://${host}`;

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ ok: false, error: { code: "MISSING_CLIENT_ID" } });
  }

  // ✅ This is the only redirect_uri we will ever use from admin-ui now.
  const redirectUri = `${origin}/api/auth/discord/callback`;

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
  res.statusCode = 302;
  res.setHeader("Location", location);
  return res.end();
}
