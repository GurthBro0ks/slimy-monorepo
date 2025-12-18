export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } });
  }

  const returnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "";
  const qs = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";

  res.statusCode = 302;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Location", `/api/auth/discord/authorize-url${qs}`);
  return res.end();
}

