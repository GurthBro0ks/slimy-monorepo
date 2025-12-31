"use strict";

const request = require("supertest");

const express = require("express");
const cookieParser = require("cookie-parser");

describe("discord oauth callback (redirect loop guard)", () => {
  jest.setTimeout(30_000);

  function makeApp() {
    const app = express();
    app.set("trust proxy", 1);
    app.use(cookieParser());
    app.use("/api/auth", require("./auth"));
    return app;
  }

  test("does not 302 back to /api/auth/callback on canonical admin origin", async () => {
    const app = makeApp();
    const res = await request(app)
      .get("/api/auth/callback?code=REDACTED&state=REDACTED")
      .set("host", "admin.slimyai.xyz")
      .set("x-forwarded-host", "admin.slimyai.xyz")
      .set("x-forwarded-proto", "https")
      .redirects(0);

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(typeof res.headers.location).toBe("string");
    expect(res.headers.location).not.toContain("/api/auth/callback");
  });

  test("supports ?debug=1 without redirecting", async () => {
    const app = makeApp();
    const res = await request(app)
      .get("/api/auth/callback?debug=1")
      .set("host", "admin.slimyai.xyz")
      .set("x-forwarded-host", "admin.slimyai.xyz")
      .set("x-forwarded-proto", "https")
      .redirects(0);

    expect(res.status).toBe(200);
    expect(res.headers.location).toBeUndefined();
    expect(res.body).toMatchObject({
      ok: true,
      requestOrigin: "https://admin.slimyai.xyz",
    });
    expect(typeof res.body.redirectUri).toBe("string");
    expect(typeof res.body.postLoginRedirect).toBe("string");
  });

  test("debug mode loop-guards ADMIN_UI_POST_LOGIN_REDIRECT when it points at the callback", async () => {
    const app = makeApp();
    const prev = process.env.ADMIN_UI_POST_LOGIN_REDIRECT;
    process.env.ADMIN_UI_POST_LOGIN_REDIRECT = "/api/auth/callback";

    try {
      const res = await request(app)
        .get("/api/auth/callback?debug=1")
        .set("host", "admin.slimyai.xyz")
        .set("x-forwarded-host", "admin.slimyai.xyz")
        .set("x-forwarded-proto", "https")
        .redirects(0);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(String(res.body.postLoginRedirect)).toBe("https://admin.slimyai.xyz/");
    } finally {
      if (prev === undefined) delete process.env.ADMIN_UI_POST_LOGIN_REDIRECT;
      else process.env.ADMIN_UI_POST_LOGIN_REDIRECT = prev;
    }
  });
});
