const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isJsonContentType(contentType) {
  if (!contentType) return false;
  const normalized = String(contentType).toLowerCase();
  return normalized.includes("application/json") || normalized.includes("+json");
}

function getQueryString(reqUrl) {
  if (!reqUrl) return "";
  const idx = reqUrl.indexOf("?");
  return idx === -1 ? "" : reqUrl.slice(idx);
}

export default async function handler(req, res) {
  const base =
    globalThis.process?.env?.ADMIN_API_INTERNAL_URL || "http://admin-api:3080";
  const ts = new Date().toISOString();

  const raw = req.query?.path;
  const pathSegments = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (pathSegments.length === 0) {
    res.status(400).json({ ok: false, error: "missing_path", ts });
    return;
  }

  if (pathSegments[0] !== "api") {
    res.status(400).json({ ok: false, error: "only_api_paths_allowed", ts });
    return;
  }

  if (pathSegments.some((seg) => seg === "..")) {
    res.status(400).json({ ok: false, error: "path_traversal_blocked", ts });
    return;
  }

  const baseUrl = String(base).replace(/\/$/, "");
  const forwardPath = `/${pathSegments.join("/")}`;
  const queryString = getQueryString(req.url);
  const targetUrl = `${baseUrl}${forwardPath}${queryString}`;

  const method = String(req.method || "GET").toUpperCase();
  const cookie = req.headers.cookie || "";
  const contentType = req.headers["content-type"] || "";
  const accept = req.headers.accept || "";
  const csrfToken = req.headers["x-csrf-token"] || "";
  const forwardedProto = req.headers["x-forwarded-proto"] || "";

  const headers = {
    ...(cookie ? { cookie } : null),
    ...(contentType ? { "content-type": contentType } : null),
    ...(accept ? { accept } : null),
    ...(csrfToken ? { "x-csrf-token": csrfToken } : null),
    "x-forwarded-host": req.headers.host || "",
    ...(forwardedProto ? { "x-forwarded-proto": forwardedProto } : null),
  };

  try {
    const init = {
      method,
      headers,
      redirect: "manual",
    };

    if (METHODS_WITH_BODY.has(method) && req.body !== undefined) {
      const hasBuffer = typeof globalThis.Buffer !== "undefined";
      const isBuffer =
        hasBuffer && typeof globalThis.Buffer.isBuffer === "function"
          ? globalThis.Buffer.isBuffer(req.body)
          : false;

      if (typeof req.body === "string" || isBuffer) {
        init.body = req.body;
      } else {
        init.body = JSON.stringify(req.body);
        if (!headers["content-type"]) headers["content-type"] = "application/json";
      }
    }

    const upstreamRes = await globalThis.fetch(targetUrl, init);

    const upstreamContentType = upstreamRes.headers.get("content-type") || "";
    const location = upstreamRes.headers.get("location") || "";

    const setCookies =
      typeof upstreamRes.headers.getSetCookie === "function"
        ? upstreamRes.headers.getSetCookie()
        : [];
    const setCookieFallback = upstreamRes.headers.get("set-cookie") || "";

    if (upstreamContentType) res.setHeader("content-type", upstreamContentType);
    if (location) res.setHeader("location", location);
    if (setCookies.length) res.setHeader("set-cookie", setCookies);
    else if (setCookieFallback) res.setHeader("set-cookie", setCookieFallback);

    const text = await upstreamRes.text().catch(() => "");
    res.status(upstreamRes.status);

    if (isJsonContentType(upstreamContentType)) {
      try {
        const json = text ? JSON.parse(text) : null;
        res.json(json);
        return;
      } catch {
        // fall through to text
      }
    }

    res.send(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({ ok: false, error: message, ts });
  }
}
