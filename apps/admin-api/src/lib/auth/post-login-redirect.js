"use strict";

function firstHeaderValue(value) {
  if (!value) return "";
  const raw = Array.isArray(value) ? value[0] : String(value);
  return raw.split(",")[0].trim();
}

function normalizeReturnToPath(returnTo) {
  if (!returnTo || typeof returnTo !== "string") return null;
  const trimmed = returnTo.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\")) return null;
  if (trimmed.includes("\r") || trimmed.includes("\n")) return null;
  return trimmed;
}

function originFromAbsoluteUrl(urlString) {
  if (!urlString) return "";
  try {
    const u = new URL(String(urlString));
    return u.origin;
  } catch {
    return "";
  }
}

function originFromForwardedHeaders(headers) {
  const proto = firstHeaderValue(headers?.["x-forwarded-proto"]) || "";
  const host = firstHeaderValue(headers?.["x-forwarded-host"]) || "";
  if (!proto || !host) return "";
  return `${proto}://${host}`;
}

function isOriginAllowed(origin, allowedOrigins, isLocalOrigin) {
  if (!origin) return false;
  if (typeof isLocalOrigin === "function" && isLocalOrigin(origin)) return true;
  if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) return true;
  return allowedOrigins.includes(origin);
}

function resolvePostLoginRedirectUrl({
  cookieRedirectUri,
  headers,
  returnToCookie,
  allowedOrigins,
  isLocalOrigin,
  clientUrl,
  defaultPath = "/guilds",
}) {
  const returnToPath = normalizeReturnToPath(returnToCookie) || defaultPath;

  const cookieOrigin = originFromAbsoluteUrl(cookieRedirectUri);
  if (isOriginAllowed(cookieOrigin, allowedOrigins, isLocalOrigin)) {
    return new URL(returnToPath, cookieOrigin).toString();
  }

  const forwardedOrigin = originFromForwardedHeaders(headers || {});
  if (isOriginAllowed(forwardedOrigin, allowedOrigins, isLocalOrigin)) {
    return new URL(returnToPath, forwardedOrigin).toString();
  }

  const fallbackBase = String(clientUrl || "").replace(/\/$/, "");
  if (fallbackBase) {
    return new URL(returnToPath, fallbackBase).toString();
  }

  return returnToPath;
}

module.exports = {
  normalizeReturnToPath,
  originFromAbsoluteUrl,
  originFromForwardedHeaders,
  resolvePostLoginRedirectUrl,
};

