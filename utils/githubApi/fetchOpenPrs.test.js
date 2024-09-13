import { describe, it } from "node:test";
import expect from "node:assert";
import { handlePrsApiResponse } from "./fetchOpenPrs.js";

describe("handlePrsApiResponse", () => {
  it("returns the length of the array containing PRs", () => {
    expect.equal(handlePrsApiResponse({ data: [1, 2, 3] }), 3);
  });

  it("returns 0 if there are no open PRs", () => {
    expect.equal(handlePrsApiResponse({ data: undefined }), 0);
  });
});
