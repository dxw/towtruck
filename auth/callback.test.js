import { describe, it } from "node:test";
import expect from "node:assert";
import { handleOAuthCallback } from "./callback.js";

const app = {
  oauth: {
    createToken: async () => {},
    checkToken: async () => {},
  }
}

const response = {
  writeHead: () => {},
  end: () => {},
};

describe("handleOAuthCallback", () => {
  it("should do nothing if the request isn't for the OAuth callback URL", async (t) => {
    t.mock.method(app.oauth, "createToken");
    t.mock.method(response, "writeHead");
    t.mock.method(response, "end");

    const request = {
      url: "/some/path",
      headers: {},
    };

    await handleOAuthCallback(app, request, response);

    expect.strictEqual(app.oauth.createToken.mock.callCount(), 0);
    expect.strictEqual(response.writeHead.mock.callCount(), 0);
    expect.strictEqual(response.end.mock.callCount(), 0);
  });

  it("should use the code passed in through the URL to generate a token and save it as a cookie before redirecting to the index", async (t) => {
    const createTokenResponse = {
      authentication: {
        token: "sometoken",
        expiresAt: "9999-12-31T23:59:59.999Z",
      },
    };

    t.mock.method(app.oauth, "createToken", () => createTokenResponse);
    t.mock.method(response, "writeHead");
    t.mock.method(response, "end");

    const request = {
      url: "/api/github/oauth/callback?code=foo",
      headers: {},
    };

    await handleOAuthCallback(app, request, response);

    expect.strictEqual(app.oauth.createToken.mock.callCount(), 1);
    expect.strictEqual(response.writeHead.mock.callCount(), 1);
    expect.strictEqual(response.end.mock.callCount(), 1);

    expect.deepStrictEqual(app.oauth.createToken.mock.calls[0].arguments, [{ code: "foo" }]);
    expect.deepStrictEqual(response.writeHead.mock.calls[0].arguments, [
      302,
      {
        "Location": "/",
        "Set-Cookie": "Token=sometoken; Path=/; Expires=Fri, 31 Dec 9999 23:59:59 GMT"
      },
    ]);
  });
});
