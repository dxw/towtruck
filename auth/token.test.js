import { describe, it } from "node:test";
import expect from "node:assert";
import { isTokenValid, parseToken } from "./token.js";

const app = {
  oauth: {
    createToken: async () => {},
    checkToken: async () => {},
  }
};

describe("parseToken", () => {
  it("should return undefined if there is no cookie", () => {
    const request = {
      headers: {
      },
    };

    const actual = parseToken(request);

    expect.strictEqual(actual, undefined);
  });

  it("should return undefined if there is no token in the cookie", () => {
    const request = {
      headers: {
        cookie: "Foo=bar; Baz=quux"
      },
    };

    const actual = parseToken(request);

    expect.strictEqual(actual, undefined);
  });

  it("should return the token value if the token is the only cookie", () => {
    const request = {
      headers: {
        cookie: "Token=tokenA"
      },
    };

    const actual = parseToken(request);

    expect.strictEqual(actual, "tokenA");
  });

  it("should return the token value if the token is not the only cookie", () => {
    const request = {
      headers: {
        cookie: "Foo=bar; Token=tokenC; Baz=quux"
      },
    };

    const actual = parseToken(request);

    expect.strictEqual(actual, "tokenC");
  });
});

describe("isTokenValid", () => {
  it("should return false if the token is invalid", async (t) => {
    t.mock.method(app.oauth, "checkToken", () => { throw "kaboom!"; });

    const actual = await isTokenValid(app, "sometoken");

    expect.strictEqual(actual, false);
  });

  it("should return false if the token is for the wrong app", async (t) => {
    const checkTokenResponse = {
      data: {
        app: {
          client_id: "foo",
        },
        created_at: "2024-01-01T12:34:56.789Z",
        expires_at: "9999-12-31T23:59:59.999Z",
      },
      authentication: {
        clientId: "bar",
      },
    };

    t.mock.method(app.oauth, "checkToken", () => checkTokenResponse);

    const actual = await isTokenValid(app, "sometoken");

    expect.strictEqual(actual, false);
  });

  it("should return false if the token was created in the future", async (t) => {
    const checkTokenResponse = {
      data: {
        app: {
          client_id: "foo",
        },
        created_at: "9999-01-01T12:34:56.789Z",
        expires_at: "9999-12-31T23:59:59.999Z",
      },
      authentication: {
        clientId: "foo",
      },
    };

    t.mock.method(app.oauth, "checkToken", () => checkTokenResponse);

    const actual = await isTokenValid(app, "sometoken");

    expect.strictEqual(actual, false);
  });

  it("should return false if the token expired in the past", async (t) => {
    const checkTokenResponse = {
      data: {
        app: {
          client_id: "foo",
        },
        created_at: "2024-01-01T12:34:56.789Z",
        expires_at: "2023-12-31T23:59:59.999Z",
      },
      authentication: {
        clientId: "foo",
      },
    };

    t.mock.method(app.oauth, "checkToken", () => checkTokenResponse);

    const actual = await isTokenValid(app, "sometoken");

    expect.strictEqual(actual, false);
  });

  it("should return true if the token is valid", async (t) => {
    const checkTokenResponse = {
      data: {
        app: {
          client_id: "foo",
        },
        created_at: "2024-01-01T12:34:56.789Z",
        expires_at: "9999-12-31T23:59:59.999Z",
      },
      authentication: {
        clientId: "foo",
      },
    };

    t.mock.method(app.oauth, "checkToken", () => checkTokenResponse);

    const actual = await isTokenValid(app, "sometoken");

    expect.strictEqual(actual, true);
  });
});
