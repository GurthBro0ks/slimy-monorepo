const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isJsonContentType(contentType) {
  if (!contentType) return false;
  const normalized = String(contentType).toLowerCase();
  return normalized.includes("application/json") || normalized.includes("+json");
}

function mergeVaryHeader(existing, incoming) {
  const existingParts = String(existing || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const incomingParts = String(incoming || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const merged = new Set([...existingParts, ...incomingParts]);
  return Array.from(merged).join(", ");
}

function firstHeaderValue(value) {
  if (!value) return "";
  const raw = Array.isArray(value) ? value[0] : String(value);
  return raw.split(",")[0].trim();
}

function splitSetCookieHeader(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];

  const parts = [];
  let current = "";
  let inExpires = false;

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];

    if (ch === ",") {
      if (!inExpires) {
        const trimmed = current.trim();
        if (trimmed) parts.push(trimmed);
        current = "";
        continue;
      }
    }

    current += ch;

    if (!inExpires && current.length >= 8) {
      const tail = current.slice(-8).toLowerCase();
      if (tail === "expires=") inExpires = true;
    } else if (inExpires && ch === ";") {
      inExpires = false;
    }
  }

  const last = current.trim();
  if (last) parts.push(last);
  return parts;
}

function extractCookieNames(value) {
  if (!value) return [];
  const list = String(value)
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split("=")[0].trim())
    .filter(Boolean);
  return Array.from(new Set(list));
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
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  const csrfToken = req.headers["x-csrf-token"] || "";
  const forwardedHost = firstHeaderValue(req.headers["x-forwarded-host"]) || firstHeaderValue(req.headers.host);
  const forwardedProto =
    firstHeaderValue(req.headers["x-forwarded-proto"]) || (req.socket?.encrypted ? "https" : "http");
  const forwardedPort =
    firstHeaderValue(req.headers["x-forwarded-port"]) ||
    (forwardedHost && forwardedHost.includes(":") ? forwardedHost.split(":").pop() : "");

  // Extract active guild ID from cookie to forward as header
  const activeGuildCookie = (cookie || "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("slimy_admin_active_guild_id="));
  const activeGuildId = activeGuildCookie
    ? decodeURIComponent(activeGuildCookie.split("=")[1] || "").trim()
    : "";

  const headers = {
    ...(cookie ? { cookie } : null),
    ...(contentType ? { "content-type": contentType } : null),
    ...(accept ? { accept } : null),
    ...(origin ? { origin } : null),
    ...(referer ? { referer } : null),
    ...(csrfToken ? { "x-csrf-token": csrfToken } : null),
    ...(forwardedHost ? { "x-forwarded-host": forwardedHost } : null),
    ...(forwardedProto ? { "x-forwarded-proto": forwardedProto } : null),
    ...(forwardedPort ? { "x-forwarded-port": forwardedPort } : null),
    ...(activeGuildId ? { "x-slimy-active-guild-id": activeGuildId } : null),
  };

  const cookieNames = extractCookieNames(cookie);
  res.setHeader("x-slimy-proxy-has-cookie", cookie ? "1" : "0");
  res.setHeader("x-slimy-proxy-cookie-names", cookieNames.join(","));

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
    const corsAllowOrigin = upstreamRes.headers.get("access-control-allow-origin") || "";
    const corsAllowCredentials =
      upstreamRes.headers.get("access-control-allow-credentials") || "";
    const corsAllowMethods =
      upstreamRes.headers.get("access-control-allow-methods") || "";
    const corsAllowHeaders =
      upstreamRes.headers.get("access-control-allow-headers") || "";
    const corsExposeHeaders =
      upstreamRes.headers.get("access-control-expose-headers") || "";
    const upstreamVary = upstreamRes.headers.get("vary") || "";

    const setCookies =
      typeof upstreamRes.headers.getSetCookie === "function"
        ? upstreamRes.headers.getSetCookie()
        : [];
    const setCookieFallback = upstreamRes.headers.get("set-cookie") || "";
    const setCookieParsed = !setCookies.length && setCookieFallback
      ? splitSetCookieHeader(setCookieFallback)
      : [];

    if (upstreamContentType) res.setHeader("content-type", upstreamContentType);
    if (location) res.setHeader("location", location);
    if (corsAllowOrigin) res.setHeader("access-control-allow-origin", corsAllowOrigin);
    if (corsAllowCredentials) {
      res.setHeader("access-control-allow-credentials", corsAllowCredentials);
    }
    if (corsAllowMethods) res.setHeader("access-control-allow-methods", corsAllowMethods);
    if (corsAllowHeaders) res.setHeader("access-control-allow-headers", corsAllowHeaders);
    if (corsExposeHeaders) {
      res.setHeader("access-control-expose-headers", corsExposeHeaders);
    }
    if (upstreamVary) {
      const existingVary = res.getHeader("vary");
      const mergedVary = mergeVaryHeader(existingVary, upstreamVary);
      if (mergedVary) res.setHeader("vary", mergedVary);
    }
    if (setCookies.length) res.setHeader("set-cookie", setCookies);
    else if (setCookieParsed.length) res.setHeader("set-cookie", setCookieParsed);
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
