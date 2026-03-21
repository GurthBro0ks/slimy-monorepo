"use strict";

const jwt = require("jsonwebtoken");
const config = require("../src/config");
const { getCookieOptions } = require("../src/services/token");

const COOKIE_NAME = config.jwt.cookieName || "slimy_admin_token";
const MAX_AGE_SEC = Number(config.jwt.maxAgeSeconds || 12 * 60 * 60);
const MIN_SECRET_LENGTH = 32;

let cachedSecret = null;

function resolveSecret() {
  if (cachedSecret) {
    return cachedSecret;
  }

  const secret =
    (config.jwt.secret && String(config.jwt.secret).trim()) ||
    (process.env.JWT_SECRET && String(process.env.JWT_SECRET).trim()) ||
    (process.env.SESSION_SECRET && String(process.env.SESSION_SECRET).trim()) ||
    "";

  if (!secret) {
    console.warn(
      "[jwt] JWT_SECRET not configured; using fallback development secret",
    );
    cachedSecret = "dev-secret-change-me-please-use-real-value";
    return cachedSecret;
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    console.warn("[jwt] JWT_SECRET shorter than 32 characters");
  }

  cachedSecret = secret;
  return cachedSecret;
}

function signSession(payload) {
  return jwt.sign(payload, resolveSecret(), {
    algorithm: "HS256",
    expiresIn: MAX_AGE_SEC,
  });
}

function verifySession(token) {
  return jwt.verify(token, resolveSecret(), { algorithms: ["HS256"] });
}

function buildCookieOptions(req) {
  return { ...getCookieOptions(req) };
}

function setAuthCookie(res, token) {
  const req = res?.req;
  const options = buildCookieOptions(req);
  res.cookie(COOKIE_NAME, token, options);

  if (process.env.NODE_ENV !== "production") {
    console.info("[auth] set cookie", {
      cookieName: COOKIE_NAME,
      secure: Boolean(options.secure),
      sameSite: options.sameSite,
      domain: options.domain || null,
      path: options.path,
    });
  }
}

function clearAuthCookie(res) {
  const req = res?.req;
  const options = buildCookieOptions(req);
  delete options.maxAge;
  res.clearCookie(COOKIE_NAME, options);
}

module.exports = {
  COOKIE_NAME,
  signSession,
  verifySession,
  setAuthCookie,
  clearAuthCookie,
};
