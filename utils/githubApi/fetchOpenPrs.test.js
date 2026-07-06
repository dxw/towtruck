import { describe, it } from "node:test";
import expect from "node:assert";
import { handlePrsApiResponse, handleClosedBotPrsResponse } from "./fetchOpenPrs.js";

describe("handlePrsApiResponse", () => {
  describe("openPrCount", () => {
    it("returns the length of the array containing PRs", () => {
      const actual = handlePrsApiResponse({ data: [1, 2, 3] });

      expect.strictEqual(actual.openPrCount, 3);
    });

    it("returns 0 if there are no open PRs", () => {
      const actual = handlePrsApiResponse({ data: [] });

      expect.strictEqual(actual.openPrCount, 0);
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

  describe("mostRecentPrOpenedAt", () => {
    it("returns null if there are no PRs", () => {
      const actual = handlePrsApiResponse({ data: [] });

      expect.strictEqual(actual.mostRecentPrOpenedAt, null);
    });
  });

  it ("returns the latest value of created_at among all elements in the list", () => {
    const pr1 = { created_at: "2024-01-01T12:34:56Z" };
    const pr2 = { created_at: "2024-02-02T12:34:56Z" };

    const actual = handlePrsApiResponse({ data: [pr1, pr2] });

    expect.deepStrictEqual(actual.mostRecentPrOpenedAt, new Date(pr2.created_at));
  });

  describe("oldestOpenPrOpenedAt", () => {
    it("returns null if there are no PRs", () => {
      const actual = handlePrsApiResponse({ data: [] });

      expect.deepEqual(actual.oldestOpenPrOpenedAt, null);
    });
  });

  it("returns null if there are no open PRs", () => {
    const closedPr = { created_at: "2024-01-01T12:34:56Z", state: "closed" }
    const actual = handlePrsApiResponse({ data: [closedPr] });

    expect.deepEqual(actual.oldestOpenPrOpenedAt, null);
  });

  it ("returns the earliest value of created_at among all elements in the list with a state of 'open'", () => {
    const closedPr = { created_at: "2023-12-31T12:34:56Z", state: "closed" };
    const openPr1 = { created_at: "2024-01-01T12:34:56Z", state: "open" };
    const openPr2 = { created_at: "2024-02-02T12:34:56Z", state: "open" };

    const actual = handlePrsApiResponse({ data: [closedPr, openPr1, openPr2] });

    expect.deepStrictEqual(actual.oldestOpenPrOpenedAt, new Date(openPr1.created_at));
  });
});

describe("handleClosedBotPrsResponse", () => {
  it("returns null if there are no closed PRs", () => {
    const actual = handleClosedBotPrsResponse([]);

    expect.strictEqual(actual.mostRecentBotPrClosedAt, null);
  });

  it("returns null if there are no bot PRs among closed PRs", () => {
    const humanPr = { user: { login: "rich" }, closed_at: "2024-03-01T12:00:00Z" };
    const actual = handleClosedBotPrsResponse([humanPr]);

    expect.strictEqual(actual.mostRecentBotPrClosedAt, null);
  });

  it("returns the closed_at date of a renovate bot PR", () => {
    const renovatePr = { user: { login: "renovate[bot]" }, closed_at: "2024-03-01T12:00:00Z" };
    const actual = handleClosedBotPrsResponse([renovatePr]);

    expect.deepStrictEqual(actual.mostRecentBotPrClosedAt, new Date("2024-03-01T12:00:00Z"));
  });

  it("returns the closed_at date of a dependabot PR", () => {
    const dependabotPr = { user: { login: "dependabot[bot]" }, closed_at: "2024-04-15T10:00:00Z" };
    const actual = handleClosedBotPrsResponse([dependabotPr]);

    expect.deepStrictEqual(actual.mostRecentBotPrClosedAt, new Date("2024-04-15T10:00:00Z"));
  });

  it("returns the most recent closed_at among multiple bot PRs", () => {
    const olderRenovatePr = { user: { login: "renovate[bot]" }, closed_at: "2024-01-01T12:00:00Z" };
    const newerDependabotPr = { user: { login: "dependabot[bot]" }, closed_at: "2024-05-01T12:00:00Z" };
    const humanPr = { user: { login: "rich" }, closed_at: "2024-06-01T12:00:00Z" };

    const actual = handleClosedBotPrsResponse([olderRenovatePr, newerDependabotPr, humanPr]);

    expect.deepStrictEqual(actual.mostRecentBotPrClosedAt, new Date("2024-05-01T12:00:00Z"));
  });
});

