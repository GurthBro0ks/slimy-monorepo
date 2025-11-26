"use strict";

const jwt = require("jsonwebtoken");
const config = require("../src/config");
const { getCookieOptions } = require("../src/services/token");

const COOKIE_NAME = config.jwt.cookieName || "slimy_admin_token";
const MAX_AGE_SEC = Number(config.jwt.maxAgeSeconds || 12 * 60 * 60);
const FALLBACK_DOMAIN =
  config.jwt.cookieDomain ||
  process.env.COOKIE_DOMAIN ||
  process.env.ADMIN_COOKIE_DOMAIN ||
  (process.env.NODE_ENV === "production" ? ".slimyai.xyz" : undefined);
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
    const errorMsg = "[jwt] CRITICAL: JWT_SECRET not configured. Cannot proceed without secure secret.";

    // Allow development mode to continue with warning, but NEVER in production
    if (process.env.NODE_ENV === "production") {
      console.error(errorMsg);
      throw new Error("JWT_SECRET must be set in production environment");
    }

    console.warn(errorMsg);
    console.warn("[jwt] Using insecure fallback secret for development ONLY");
    cachedSecret = "dev-secret-change-me-please-use-real-value";
    return cachedSecret;
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    const warnMsg = `[jwt] JWT_SECRET is ${secret.length} characters (recommended: ${MIN_SECRET_LENGTH}+)`;

    if (process.env.NODE_ENV === "production") {
      console.error(warnMsg);
      throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production`);
    }

    console.warn(warnMsg);
    console.warn("[jwt] Using weak secret in development - DO NOT use in production");
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

function buildCookieOptions() {
  const options = { ...getCookieOptions() };
  if (FALLBACK_DOMAIN && !options.domain) {
    options.domain = FALLBACK_DOMAIN;
  }
  return options;
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, buildCookieOptions());
}

function clearAuthCookie(res) {
  const options = buildCookieOptions();
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
