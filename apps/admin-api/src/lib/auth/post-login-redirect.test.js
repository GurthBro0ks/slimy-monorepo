"use strict";

const { resolvePostLoginRedirectUrl } = require("./post-login-redirect");

function isLocalOrigin(origin) {
  try {
    const u = new URL(String(origin));
    return ["localhost", "127.0.0.1"].includes(u.hostname);
  } catch {
    return false;
  }
}

describe("resolvePostLoginRedirectUrl", () => {
  test("prefers oauth_redirect_uri cookie origin + oauth_return_to", () => {
    const url = resolvePostLoginRedirectUrl({
      cookieRedirectUri: "http://localhost:3001/api/auth/callback",
      headers: {},
      returnToCookie: "/guilds",
      allowedOrigins: ["http://localhost:3000", "http://localhost:3001"],
      isLocalOrigin,
      clientUrl: "http://localhost:3000",
      defaultPath: "/guilds",
    });

    expect(url).toBe("http://localhost:3001/guilds");
  });

  test("falls back to x-forwarded origin when cookie missing", () => {
    const url = resolvePostLoginRedirectUrl({
      cookieRedirectUri: "",
      headers: { "x-forwarded-proto": "http", "x-forwarded-host": "localhost:3001" },
      returnToCookie: "/dashboard",
      allowedOrigins: ["http://localhost:3000", "http://localhost:3001"],
      isLocalOrigin,
      clientUrl: "http://localhost:3000",
      defaultPath: "/guilds",
    });

    expect(url).toBe("http://localhost:3001/dashboard");
  });

  test("falls back to CLIENT_URL when cookie and forwarded origin missing", () => {
    const url = resolvePostLoginRedirectUrl({
      cookieRedirectUri: "",
      headers: {},
      returnToCookie: "/guilds",
      allowedOrigins: ["http://localhost:3000", "http://localhost:3001"],
      isLocalOrigin,
      clientUrl: "http://localhost:3000",
      defaultPath: "/guilds",
    });

    expect(url).toBe("http://localhost:3000/guilds");
  });
});
