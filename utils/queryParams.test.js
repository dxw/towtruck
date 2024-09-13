import { describe, it } from "node:test";
import expect from "node:assert";
import { getQueryParams } from "./queryParams.js";

describe("getQueryParams", () => {
  it("returns null if there are no query params", () => {
    const url = new URL("http://localhost:3000");

    const result = getQueryParams(url);

    expect.deepEqual(result, { sortBy: null, sortDirection: null });
  });

  it("returns sortDirection param if it exists", () => {
    const url = new URL("http://localhost:3000?sortDirection=asc");

    const result = getQueryParams(url);

    expect.deepEqual(result, { sortBy: null, sortDirection: "asc" });
  });

  it("returns sortBy param if it exists", () => {
    const url = new URL("http://localhost:3000?sortBy=openPrs");

    const result = getQueryParams(url);

    expect.deepEqual(result, { sortBy: "openPrs", sortDirection: null });
  });

  it("returns both params if they exists", () => {
    const url = new URL(
      "http://localhost:3000?sortBy=openPrs&sortDirection=asc"
    );

    const result = getQueryParams(url);

    expect.deepEqual(result, { sortBy: "openPrs", sortDirection: "asc" });
  });
});
