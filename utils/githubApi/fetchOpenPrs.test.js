import { describe, it } from "node:test";
import expect from "node:assert";
import { handlePrsApiResponse } from "./fetchOpenPrs.js";

describe("handlePrsApiResponse", () => {
  describe("openPrCount", () => {
    it("returns the length of the array containing PRs", () => {
      const actual = handlePrsApiResponse({ data: [1, 2, 3] });
      const expected = { openPrCount: 3, openBotPrCount: 0 };

      expect.deepEqual(actual, expected);
    });

    it("returns 0 if there are no open PRs", () => {
      const actual = handlePrsApiResponse({ data: [] });
      const expected = { openPrCount: 0, openBotPrCount: 0 };

      expect.deepEqual(actual, expected);
    });
  });

  describe("openBotPrCount", () => {
    it("returns 1 if there is a PR authored by dependabot", () => {
      const dependabotPr = { user: { login: "dependabot[bot]" } };
      const actual = handlePrsApiResponse({ data: [dependabotPr] });

      expect.equal(actual.openBotPrCount, 1);
    });

    it("returns 1 if there is a PR authored by renovate", () => {
      const renovatePr = { user: { login: "renovate[bot]" } };
      const actual = handlePrsApiResponse({ data: [renovatePr] });

      expect.equal(actual.openBotPrCount, 1);
    });

    it("returns 0 if there is a PR authored by other authors", () => {
      const humanPr = { user: { login: "rich" } };
      const actual = handlePrsApiResponse({ data: [humanPr] });

      expect.equal(actual.openBotPrCount, 0);
    });

    it("handles a variety of PR authors correctly", () => {
      const dependabotPr = {
        user: {
          login: "dependabot[bot]",
        },
      };
      const renovatePr = {
        user: {
          login: "renovate[bot]",
        },
      };
      const humanPr = {
        user: {
          login: "rich",
        },
      };
      const actual = handlePrsApiResponse({
        data: [dependabotPr, renovatePr, humanPr],
      });

      expect.equal(actual.openBotPrCount, 2);
    });
  });
});
