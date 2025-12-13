export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ ok: false, error: "method_not_allowed", ts: new Date().toISOString() });
    return;
  }

  const base =
    globalThis.process?.env?.ADMIN_API_INTERNAL_URL || "http://admin-api:3080";

  const cookie = req.headers.cookie || "";
  const forwardedHost = req.headers.host || "";

  try {
    const upstreamRes = await globalThis.fetch(`${base}/api/diag`, {
      headers: {
        accept: "application/json",
        cookie,
        "x-forwarded-host": forwardedHost,
      },
    });

    let upstream;
    try {
      upstream = await upstreamRes.json();
    } catch {
      upstream = { status: upstreamRes.status, statusText: upstreamRes.statusText };
    }

    if (!upstreamRes.ok) {
      res.status(502).json({
        ok: false,
        error: `Upstream returned ${upstreamRes.status}`,
        upstream,
        ts: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({ ok: true, upstream, ts: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({ ok: false, error: message, ts: new Date().toISOString() });
  }
}

