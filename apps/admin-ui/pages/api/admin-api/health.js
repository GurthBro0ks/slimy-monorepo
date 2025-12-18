export default async function handler(_req, res) {
  const base =
    globalThis.process?.env?.ADMIN_API_INTERNAL_URL || "http://admin-api:3080";

  try {
    const upstreamRes = await globalThis.fetch(`${base}/api/health`, {
      headers: { accept: "application/json" },
    });
    const requestId = upstreamRes.headers.get("x-request-id") || null;

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
        requestId,
      });
      return;
    }

    if (requestId) res.setHeader("X-Request-ID", requestId);
    res.status(200).json({ ok: true, upstream, ts: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({ ok: false, error: message });
  }
}
