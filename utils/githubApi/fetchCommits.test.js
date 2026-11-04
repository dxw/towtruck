import { describe, it } from "node:test";
import expect from "node:assert";
import { commitIsFromBot, getCommitsForRepo, handleCommitsApiResponse } from "./fetchCommits.js";

const humanCommit = (date, login = "rich") => ({
  author: { login, type: "User" },
  commit: { author: { name: "Rich", date } },
});

describe("commitIsFromBot", () => {
  it("returns true for commits by a GitHub bot account", () => {
    expect.strictEqual(commitIsFromBot({ author: { login: "some-app", type: "Bot" } }), true);
  });

  it("returns true for commits by renovate or dependabot", () => {
    expect.strictEqual(commitIsFromBot({ author: { login: "renovate[bot]" } }), true);
    expect.strictEqual(commitIsFromBot({ author: { login: "dependabot[bot]" } }), true);
  });

  it("returns true for commits not linked to a GitHub account with a bot author name", () => {
    expect.strictEqual(commitIsFromBot({ author: null, commit: { author: { name: "renovate[bot]" } } }), true);
  });

  it("returns false for commits by people", () => {
    expect.strictEqual(commitIsFromBot(humanCommit("2024-01-01T00:00:00Z")), false);
  });

  it("returns false for commits by people not linked to a GitHub account", () => {
    expect.strictEqual(commitIsFromBot({ author: null, commit: { author: { name: "Rich" } } }), false);
  });
});

describe("handleCommitsApiResponse", () => {
  it("returns null if there are no commits", () => {
    const actual = handleCommitsApiResponse({ data: [] });

    expect.strictEqual(actual.mostRecentNonBotCommitAt, null);
  });

  it("returns null if every commit is from a bot", () => {
    const actual = handleCommitsApiResponse({
      data: [{ author: { login: "renovate[bot]", type: "Bot" }, commit: { author: { date: "2024-01-01T00:00:00Z" } } }],
    });

    expect.strictEqual(actual.mostRecentNonBotCommitAt, null);
  });

  it("returns the latest author date among commits not made by bots", () => {
    const actual = handleCommitsApiResponse({
      data: [
        { author: { login: "dependabot[bot]", type: "Bot" }, commit: { author: { date: "2024-03-03T00:00:00Z" } } },
        humanCommit("2024-01-01T00:00:00Z"),
        humanCommit("2024-02-02T00:00:00Z", "jo"),
      ],
    });

    expect.deepStrictEqual(actual.mostRecentNonBotCommitAt, new Date("2024-02-02T00:00:00Z"));
  });
});

describe("getCommitsForRepo", () => {
  it("requests the most recent commits on the default branch", async (t) => {
    const octokit = { request: t.mock.fn(async () => ({ data: [humanCommit("2024-01-01T00:00:00Z")] })) };
    const repository = { name: "repo", commits_url: "https://some.api/commits{/sha}" };

    const actual = await getCommitsForRepo({ octokit, repository });

    expect.deepStrictEqual(octokit.request.mock.calls[0].arguments, ["https://some.api/commits?per_page=100"]);
    expect.deepStrictEqual(actual, { mostRecentNonBotCommitAt: new Date("2024-01-01T00:00:00Z") });
  });

  it("returns an empty object if the request fails, e.g. for an empty repo", async (t) => {
    t.mock.method(console, "warn", () => {});
    const octokit = { request: async () => Promise.reject(new Error("Git Repository is empty.")) };
    const repository = { name: "repo", commits_url: "https://some.api/commits{/sha}" };

    const actual = await getCommitsForRepo({ octokit, repository });

    expect.deepStrictEqual(actual, {});
  });
});
