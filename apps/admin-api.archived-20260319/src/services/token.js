"use strict";

const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");

const config = require("../config");

function getHostFromRequest(req) {
  const header = req?.headers?.["x-forwarded-host"] || req?.headers?.host || "";
  const first = Array.isArray(header) ? header[0] : String(header);
  const host = first.split(",")[0].trim().split(":")[0].trim().toLowerCase();
  return host;
}

function isLocalhostHost(host) {
  if (!host) return true;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
  if (host.endsWith(".localhost")) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return false;
}

function isHttpsRequest(req) {
  const xfProto = req?.headers?.["x-forwarded-proto"];
  const raw = Array.isArray(xfProto) ? xfProto[0] : xfProto ? String(xfProto) : "";
  const proto = raw.split(",")[0].trim().toLowerCase();
  if (proto) return proto === "https";
  if (req?.secure === true) return true;
  if (req?.protocol) return String(req.protocol).toLowerCase() === "https";
  return false;
}

function getCookieOptions(req, overrides = {}) {
  const secure = isHttpsRequest(req);
  const host = getHostFromRequest(req);
  const sameSite = (overrides.sameSite ?? config.jwt.cookieSameSite ?? "lax").toLowerCase();

  const options = {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge:
      overrides.maxAge ??
      Number(config.jwt.maxAgeSeconds || 12 * 60 * 60) * 1000,
  };

  if (!isLocalhostHost(host) && config.jwt.cookieDomain && !overrides.domain) {
    options.domain = config.jwt.cookieDomain;
  }

  if ((options.sameSite || "").toLowerCase() === "none" && !options.secure) {
    // Browsers reject SameSite=None without Secure; fall back for HTTP localhost/dev.
    options.sameSite = "lax";
  }

  if (overrides.domain) options.domain = overrides.domain;
  if (typeof overrides.httpOnly === "boolean") options.httpOnly = overrides.httpOnly;
  if (typeof overrides.secure === "boolean") options.secure = overrides.secure;
  if (overrides.path) options.path = overrides.path;

  return options;
}

function signSession(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

function createSessionToken({ user, guilds, role }) {
  const csrfToken = nanoid(32);
  const session = {
    sub: user.id,
    username: user.username,
    globalName: user.globalName,
    avatar: user.avatar,
    role,
    guilds,
    csrfToken,
  };

  const token = signSession(session);
  return { token, csrfToken, session };
}

function verifySessionToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = {
  createSessionToken,
  verifySessionToken,
  getCookieOptions,
};
