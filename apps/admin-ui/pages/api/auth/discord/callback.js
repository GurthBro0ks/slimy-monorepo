export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } });
  }

  const base =
    process.env.ADMIN_API_INTERNAL_URL && !process.env.ADMIN_API_INTERNAL_URL.includes("localhost")
      ? process.env.ADMIN_API_INTERNAL_URL
      : "http://admin-api:3080";

  // admin-api real callback route
  const upstream = new URL("/api/auth/callback", base);

  // forward query string (code/state/etc)
  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  upstream.search = qs ? qs.slice(1) : "";

  let upstreamRes;
  try {
    upstreamRes = await fetch(upstream.toString(), {
      method: "GET",
      redirect: "manual",
      headers: {
        accept: req.headers.accept || "*/*",
        cookie: req.headers.cookie || "",
        "user-agent": req.headers["user-agent"] || "",
        "x-forwarded-host": req.headers["x-forwarded-host"] || req.headers.host || "",
        "x-forwarded-proto":
          req.headers["x-forwarded-proto"] || (req.socket?.encrypted ? "https" : "http"),
        "x-forwarded-port":
          req.headers["x-forwarded-port"] ||
          (typeof req.headers.host === "string" && req.headers.host.includes(":")
            ? req.headers.host.split(":").pop()
            : ""),
      },
    });
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: { code: "UPSTREAM_UNREACHABLE", message: String(e?.message || e) },
    });
  }

  // Location (redirect) passthrough
  const location = upstreamRes.headers.get("location");
  if (location) res.setHeader("Location", location);

  // Set-Cookie passthrough (support multi-cookie)
  const h = upstreamRes.headers;
  const cookies =
    typeof h.getSetCookie === "function"
      ? h.getSetCookie()
      : (h.get("set-cookie") ? [h.get("set-cookie")] : []).filter(Boolean);

  if (cookies.length) res.setHeader("Set-Cookie", cookies);

  // Content-Type passthrough
  const ct = upstreamRes.headers.get("content-type");
  if (ct) res.setHeader("Content-Type", ct);

  // For redirects, return empty body with correct status + headers
  if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
    res.statusCode = upstreamRes.status;
    return res.end();
  }

  // Otherwise pass through response body
  const buf = Buffer.from(await upstreamRes.arrayBuffer());
  res.statusCode = upstreamRes.status;
  return res.end(buf);
}
