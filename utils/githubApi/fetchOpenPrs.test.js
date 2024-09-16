import { describe, it } from "node:test";
import expect from "node:assert";
import { handlePrsApiResponse } from "./fetchOpenPrs.js";

describe("handlePrsApiResponse", () => {
  describe("openPrCount", () => {
    it("returns the length of the array containing PRs", () => {
      const actual = handlePrsApiResponse({ data: [1, 2, 3] });
      const expected = { openPrCount: 3 };

      expect.deepEqual(actual, expected);
    });

    it("returns 0 if there are no open PRs", () => {
      const actual = handlePrsApiResponse({ data: [] });
      const expected = { openPrCount: 0 };

      expect.equal(actual, expected);
    });
  });
});
