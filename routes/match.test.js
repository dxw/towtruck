import { describe, it } from "node:test";
import expect from "node:assert";
import { match } from "./match.js";

describe("match", () => {
  it("should match literal paths", () => {
    const handler1 = () => {};
    const handler2 = () => {};
    const handler3 = () => {};

    const handlers = {
      "/": handler1,
      "/foo": handler2,
      "/foo/bar": handler3,
    };

    const actual1 = match(handlers, "/");
    const actual2 = match(handlers, "/foo");
    const actual3 = match(handlers, "/foo/bar");

    expect.deepStrictEqual(actual1, [handler1, {}]);
    expect.deepStrictEqual(actual2, [handler2, {}]);
    expect.deepStrictEqual(actual3, [handler3, {}]);
  });

  it("should match paths with parameters", () => {
    const handler1 = () => {};
    const handler2 = () => {};

    const handlers = {
      "/{param}": handler1,
      "/{paramA}/{paramB}": handler2,
    };

    const actual1 = match(handlers, "/foo");
    const actual2 = match(handlers, "/bar");
    const actual3 = match(handlers, "/baz/quux");

    expect.deepStrictEqual(actual1, [handler1, { param: "foo" }]);
    expect.deepStrictEqual(actual2, [handler1, { param: "bar" }]);
    expect.deepStrictEqual(actual3, [handler2, { paramA: "baz", paramB: "quux" }]);
  });
});
