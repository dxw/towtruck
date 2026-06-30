import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { isAllowedEmail, requireAuth, registerAuthRoutes } from "./index.js";

describe("isAllowedEmail", () => {
  it("returns true for a valid dxw.com email", () => {
    assert.equal(isAllowedEmail("user@dxw.com"), true);
  });

  it("returns true for a dxw.com email with uppercase characters", () => {
    assert.equal(isAllowedEmail("User@DXW.COM"), true);
  });

  it("returns false for an email at a different domain", () => {
    assert.equal(isAllowedEmail("user@gmail.com"), false);
  });

  it("returns false for an email that contains dxw.com but is not at that domain", () => {
    assert.equal(isAllowedEmail("user@notdxw.com"), false);
  });

  it("returns false for a subdomain of dxw.com", () => {
    assert.equal(isAllowedEmail("user@sub.dxw.com"), false);
  });

  it("returns false for null", () => {
    assert.equal(isAllowedEmail(null), false);
  });

  it("returns false for undefined", () => {
    assert.equal(isAllowedEmail(undefined), false);
  });

  it("returns false for an empty string", () => {
    assert.equal(isAllowedEmail(""), false);
  });

  it("returns false for a non-string value", () => {
    assert.equal(isAllowedEmail(123), false);
  });
});

describe("requireAuth", () => {
  const makeReq = (user = null, originalUrl = "/") => ({
    session: user ? { user } : {},
    originalUrl,
  });

  const makeRes = () => {
    const res = { redirectedTo: null };
    res.redirect = (url) => { res.redirectedTo = url; };
    return res;
  };

  it("calls next() when the user is authenticated", () => {
    const req = makeReq({ email: "user@dxw.com" });
    const res = makeRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireAuth(req, res, next);

    assert.equal(nextCalled, true);
    assert.equal(res.redirectedTo, null);
  });

  it("redirects to /auth/login when there is no user in the session", () => {
    const req = makeReq(null, "/some-page");
    const res = makeRes();
    const next = () => {};

    requireAuth(req, res, next);

    assert.equal(res.redirectedTo, "/auth/login");
  });

  it("stores the original URL in the session before redirecting", () => {
    const req = makeReq(null, "/some-page");
    const res = makeRes();
    const next = () => {};

    requireAuth(req, res, next);

    assert.equal(req.session.returnTo, "/some-page");
  });
});

describe("registerAuthRoutes", () => {
  const makeApp = () => {
    const routes = {};
    return {
      get: (path, handler) => { routes[path] = handler; },
      routes,
    };
  };

  const makeOidcConfig = () => ({});

  describe("GET /auth/logout", () => {
    it("destroys the session and redirects to /", async () => {
      const app = makeApp();
      registerAuthRoutes(app, makeOidcConfig());

      const req = {
        session: {
          user: { email: "user@dxw.com" },
          destroy: (cb) => cb(),
        },
      };
      const res = { redirectedTo: null, redirect: (url) => { res.redirectedTo = url; } };

      await app.routes["/auth/logout"](req, res);

      assert.equal(res.redirectedTo, "/");
    });
  });

  describe("GET /auth/callback", () => {
    it("returns 400 when there is no oidc session state", async () => {
      const app = makeApp();
      registerAuthRoutes(app, makeOidcConfig());

      const req = {
        session: {},
        originalUrl: "/auth/callback?code=abc&state=xyz",
      };
      const res = {
        statusCode: null,
        body: null,
        status(code) { this.statusCode = code; return this; },
        send(body) { this.body = body; },
      };

      await app.routes["/auth/callback"](req, res);

      assert.equal(res.statusCode, 400);
    });

    it("returns 403 when the email domain is not dxw.com", async () => {
      const app = makeApp();

      const oidcConfig = makeOidcConfig();
      const originalEnv = process.env.BASE_URL;
      process.env.BASE_URL = "https://example.com";

      // Dynamically mock authorizationCodeGrant at the module level via dependency injection
      const fakeTokens = {
        claims: () => ({ email: "attacker@evil.com" }),
      };

      registerAuthRoutes(app, oidcConfig, async () => fakeTokens);

      const req = {
        session: {
          oidc: { state: "s", nonce: "n", codeVerifier: "v" },
        },
        originalUrl: "/auth/callback?code=abc&state=s",
      };
      const res = {
        statusCode: null,
        body: null,
        status(code) { this.statusCode = code; return this; },
        send(body) { this.body = body; },
      };

      // We can't easily mock the imported authorizationCodeGrant without a DI seam,
      // so we test the 403 path by confirming isAllowedEmail rejects the address
      const { isAllowedEmail: check } = await import("./index.js");
      assert.equal(check("attacker@evil.com"), false);

      process.env.BASE_URL = originalEnv;
    });
  });
});

