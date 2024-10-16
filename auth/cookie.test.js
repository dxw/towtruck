import { describe, it } from "node:test";
import expect from "node:assert";
import { cookie } from "./cookie.js";

describe("cookie", () => {
  it("should return the expected object when no path or expiry is given", () => {
    const expected = {
      "Set-Cookie": "Foo=bar",
    };

    const actual = cookie("Foo", "bar");

    expect.deepStrictEqual(actual, expected);
  });

  it("should return the expected object when the path is given", () => {
    const expected = {
      "Set-Cookie": "Foo=bar; Path=/some/path",
    };

    const actual = cookie("Foo", "bar", "/some/path");

    expect.deepStrictEqual(actual, expected);
  });

  it("should return the expected object when the expiry is given as a string", () => {
    const expected = {
      "Set-Cookie": "Foo=bar; Expires=Mon, 01 Jan 2024 12:34:56 GMT",
    };

    const actual = cookie("Foo", "bar", null, "2024-01-01T12:34:56.789Z");

    expect.deepStrictEqual(actual, expected);
  });

  it("should return the expected object when the expiry is given as a date", () => {
    const expected = {
      "Set-Cookie": "Foo=bar; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    };

    const actual = cookie("Foo", "bar", null, new Date(0));

    expect.deepStrictEqual(actual, expected);
  });

  it("should return the expected object when the path and expiry is given", () => {
    const expected = {
      "Set-Cookie": "Foo=bar; Path=/some/path; Expires=Mon, 01 Jan 2024 12:34:56 GMT",
    };

    const actual = cookie("Foo", "bar", "/some/path", new Date("2024-01-01T12:34:56.789Z"));

    expect.deepStrictEqual(actual, expected);
  });
});
