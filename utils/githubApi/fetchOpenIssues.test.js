import { describe, it } from "node:test";
import expect from "node:assert";
import { handleIssuesApiResponse } from "./fetchOpenIssues.js";

describe("handleIssuesApiResponse", () => {
  describe("mostRecentIssueOpenedAt", () => {
    it("returns null if there are no issues", () => {
      const actual = handleIssuesApiResponse({ data: [] });

      expect.strictEqual(actual.mostRecentIssueOpenedAt, null);
    });

    it("ignores issues opened by Renovate", () => {
      const renovateIssue = { created_at: "2024-01-01T12:34:56Z", user: { login: "renovate[bot]" } };
      const openIssue = { created_at: "2023-01-01T12:34:56Z", user: { login: "dan" } };
      const actual = handleIssuesApiResponse({ data: [renovateIssue, openIssue] });

      expect.deepEqual(actual.mostRecentIssueOpenedAt, new Date(openIssue.created_at));
    });

    it("ignores issues that are pull requests", () => {
      const pullRequest = { created_at: "2024-01-01T12:34:56Z", user: { login: "dan" }, pull_request: {} };
      const openIssue = { created_at: "2023-01-01T12:34:56Z", user: { login: "dan" } };
      const actual = handleIssuesApiResponse({ data: [pullRequest, openIssue] });

      expect.deepEqual(actual.mostRecentIssueOpenedAt, new Date(openIssue.created_at));
    });

    it ("returns the latest value of created_at among all elements in the list", () => {
      const issue1 = { created_at: "2024-01-01T12:34:56Z", user: { login: "dan" } };
      const issue2 = { created_at: "2024-02-02T12:34:56Z", user: { login: "dan" } };

      const actual = handleIssuesApiResponse({ data: [issue1, issue2] });

      expect.deepStrictEqual(actual.mostRecentIssueOpenedAt, new Date(issue2.created_at));
    });
  });

  describe("oldestOpenIssueOpenedAt", () => {
    it("returns null if there are no issues", () => {
      const actual = handleIssuesApiResponse({ data: [] });

      expect.deepEqual(actual.oldestOpenIssueOpenedAt, null);
    });

    it("returns null if there are no open issues", () => {
      const closedIssue = { created_at: "2024-01-01T12:34:56Z", state: "closed", user: { login: "dan" } }
      const actual = handleIssuesApiResponse({ data: [closedIssue] });

      expect.deepEqual(actual.oldestOpenIssueOpenedAt, null);
    });

    it("ignores issues opened by Renovate", () => {
      const renovateIssue = { created_at: "2023-01-01T12:34:56Z", state: "open", user: { login: "renovate[bot]" } };
      const openIssue = { created_at: "2024-01-01T12:34:56Z", state: "open", user: { login: "dan" } };
      const actual = handleIssuesApiResponse({ data: [renovateIssue, openIssue] });

      expect.deepEqual(actual.oldestOpenIssueOpenedAt, new Date(openIssue.created_at));
    });

    it("ignores issues that are pull requests", () => {
      const pullRequest = { created_at: "2023-01-01T12:34:56Z", state: "open", user: { login: "dan" }, pull_request: {} };
      const openIssue = { created_at: "2024-01-01T12:34:56Z", state: "open", user: { login: "dan" } };
      const actual = handleIssuesApiResponse({ data: [pullRequest, openIssue] });

      expect.deepEqual(actual.oldestOpenIssueOpenedAt, new Date(openIssue.created_at));
    });

    it ("returns the earliest value of created_at among all elements in the list with a state of 'open'", () => {
      const closedIssue = { created_at: "2023-12-31T12:34:56Z", state: "closed", user: { login: "dan" } };
      const openIssue1 = { created_at: "2024-01-01T12:34:56Z", state: "open", user: { login: "dan" } };
      const openIssue2 = { created_at: "2024-02-02T12:34:56Z", state: "open", user: { login: "dan" } };

      const actual = handleIssuesApiResponse({ data: [closedIssue, openIssue1, openIssue2] });

      expect.deepStrictEqual(actual.oldestOpenIssueOpenedAt, new Date(openIssue1.created_at));
    });
  });
});
