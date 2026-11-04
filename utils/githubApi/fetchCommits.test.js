import { describe, it } from "node:test";
import expect from "node:assert";
import { commitIsFromBot, findTopCommitter, getCommitsForRepo, handleCommitsApiResponse } from "./fetchCommits.js";

const humanCommit = (date, login = "rich", name = "Rich") => ({
  author: { login, type: "User" },
  commit: { author: { name, date } },
});

const unlinkedCommit = (name) => ({ author: null, commit: { author: { name, date: "2024-01-01T00:00:00Z" } } });

const botCommit = () => ({ author: { login: "renovate[bot]", type: "Bot" }, commit: { author: { name: "renovate[bot]", date: "2024-01-01T00:00:00Z" } } });

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

describe("findTopCommitter", () => {
  it("returns null if there are no commits", () => {
    expect.strictEqual(findTopCommitter([]), null);
  });

  it("returns the person with the most commits", () => {
    const actual = findTopCommitter([
      humanCommit("2024-03-03T00:00:00Z", "jo", "Jo"),
      humanCommit("2024-02-02T00:00:00Z", "rich", "Rich"),
      humanCommit("2024-01-01T00:00:00Z", "rich", "Rich"),
    ]);

    expect.deepStrictEqual(actual, { name: "Rich", login: "rich" });
  });

  it("counts commits from the same GitHub account together, using the name from their most recent commit", () => {
    const actual = findTopCommitter([
      humanCommit("2024-04-04T00:00:00Z", "rich", "Rich Smith"),
      unlinkedCommit("Jo"),
      unlinkedCommit("Jo"),
      humanCommit("2024-02-02T00:00:00Z", "rich", "rich-laptop"),
      humanCommit("2024-01-01T00:00:00Z", "rich", "Rich"),
    ]);

    expect.deepStrictEqual(actual, { name: "Rich Smith", login: "rich" });
  });

  it("groups commits not linked to a GitHub account by author name", () => {
    const actual = findTopCommitter([humanCommit("2024-03-03T00:00:00Z", "rich", "Rich"), unlinkedCommit("Jo"), unlinkedCommit("Jo")]);

    expect.deepStrictEqual(actual, { name: "Jo", login: null });
  });

  it("counts recent commits for more than older ones", () => {
    const actual = findTopCommitter([
      ...Array.from({ length: 2 }, () => humanCommit("2024-06-01T00:00:00Z", "jo", "Jo")),
      ...Array.from({ length: 10 }, () => humanCommit("2023-06-01T00:00:00Z", "rich", "Rich")),
    ]);

    expect.deepStrictEqual(actual, { name: "Jo", login: "jo" });
  });

  it("halves the weight of commits for every 90 days they are older than the newest commit", () => {
    const commits = (count) => [
      ...Array.from({ length: 2 }, () => humanCommit("2024-04-01T00:00:00Z", "jo", "Jo")),
      ...Array.from({ length: count }, () => humanCommit("2024-01-02T00:00:00Z", "rich", "Rich")),
    ];

    // Rich's commits are 90 days older, so 4 of them are worth Jo's 2 and the tie goes to the more recent committer
    expect.deepStrictEqual(findTopCommitter(commits(4)), { name: "Jo", login: "jo" });
    expect.deepStrictEqual(findTopCommitter(commits(5)), { name: "Rich", login: "rich" });
  });

  it("breaks ties in favour of whoever committed most recently", () => {
    const actual = findTopCommitter([
      humanCommit("2024-01-01T00:00:00Z", "jo", "Jo"),
      humanCommit("2024-01-01T00:00:00Z", "rich", "Rich"),
      humanCommit("2024-01-01T00:00:00Z", "rich", "Rich"),
      humanCommit("2024-01-01T00:00:00Z", "jo", "Jo"),
    ]);

    expect.deepStrictEqual(actual, { name: "Jo", login: "jo" });
  });

  it("ignores commits without a date", () => {
    const undated = { author: { login: "rich", type: "User" }, commit: { author: { name: "Rich" } } };
    const actual = findTopCommitter([undated, undated, humanCommit("2024-01-01T00:00:00Z", "jo", "Jo")]);

    expect.deepStrictEqual(actual, { name: "Jo", login: "jo" });
    expect.strictEqual(findTopCommitter([undated]), null);
  });

  it("falls back to the GitHub username if the commit has no author name", () => {
    const actual = findTopCommitter([{ author: { login: "rich", type: "User" }, commit: { author: { name: "", date: "2024-01-01T00:00:00Z" } } }]);

    expect.deepStrictEqual(actual, { name: "rich", login: "rich" });
  });
});

describe("handleCommitsApiResponse", () => {
  it("returns null if there are no commits", () => {
    const actual = handleCommitsApiResponse({ data: [] });

    expect.strictEqual(actual.mostRecentNonBotCommitAt, null);
    expect.strictEqual(actual.topCommitter, null);
  });

  it("returns null if every commit is from a bot", () => {
    const actual = handleCommitsApiResponse({
      data: [{ author: { login: "renovate[bot]", type: "Bot" }, commit: { author: { date: "2024-01-01T00:00:00Z" } } }],
    });

    expect.strictEqual(actual.mostRecentNonBotCommitAt, null);
    expect.strictEqual(actual.topCommitter, null);
  });

  it("ignores bots when finding the top committer", () => {
    const actual = handleCommitsApiResponse({ data: [botCommit(), botCommit(), humanCommit("2024-01-01T00:00:00Z")] });

    expect.deepStrictEqual(actual.topCommitter, { name: "Rich", login: "rich" });
  });

  it("only considers the 100 most recent non-bot commits when finding the top committer", () => {
    const actual = handleCommitsApiResponse({
      data: [
        ...Array.from({ length: 60 }, () => humanCommit("2024-02-02T00:00:00Z", "jo", "Jo")),
        ...Array.from({ length: 40 }, () => humanCommit("2024-02-02T00:00:00Z", "rich", "Rich")),
        ...Array.from({ length: 50 }, () => humanCommit("2024-01-01T00:00:00Z", "rich", "Rich")),
      ],
    });

    expect.deepStrictEqual(actual.topCommitter, { name: "Jo", login: "jo" });
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
    expect.deepStrictEqual(actual, {
      mostRecentNonBotCommitAt: new Date("2024-01-01T00:00:00Z"),
      topCommitter: { name: "Rich", login: "rich" },
    });
  });

  it("requests further pages until it has seen 100 non-bot commits", async (t) => {
    const pages = {
      "https://some.api/commits?per_page=100": [...Array.from({ length: 90 }, botCommit), ...Array.from({ length: 10 }, () => humanCommit("2024-03-03T00:00:00Z", "jo", "Jo"))],
      "https://some.api/commits?per_page=100&page=2": [...Array.from({ length: 50 }, botCommit), ...Array.from({ length: 50 }, () => humanCommit("2024-02-02T00:00:00Z"))],
      "https://some.api/commits?per_page=100&page=3": Array.from({ length: 100 }, () => humanCommit("2024-01-01T00:00:00Z", "sam", "Sam")),
      "https://some.api/commits?per_page=100&page=4": Array.from({ length: 100 }, () => humanCommit("2023-01-01T00:00:00Z", "sam", "Sam")),
    };
    const octokit = { request: t.mock.fn(async (url) => ({ data: pages[url] })) };
    const repository = { name: "repo", commits_url: "https://some.api/commits{/sha}" };

    const actual = await getCommitsForRepo({ octokit, repository });

    expect.deepStrictEqual(octokit.request.mock.calls.map((call) => call.arguments[0]), [
      "https://some.api/commits?per_page=100",
      "https://some.api/commits?per_page=100&page=2",
      "https://some.api/commits?per_page=100&page=3",
    ]);
    // 10 from Jo + 50 from Rich + the first 40 from Sam
    expect.deepStrictEqual(actual.topCommitter, { name: "Rich", login: "rich" });
    expect.deepStrictEqual(actual.mostRecentNonBotCommitAt, new Date("2024-03-03T00:00:00Z"));
  });

  it("stops requesting pages when it reaches the end of the history", async (t) => {
    const octokit = { request: t.mock.fn(async () => ({ data: [botCommit(), humanCommit("2024-01-01T00:00:00Z")] })) };
    const repository = { name: "repo", commits_url: "https://some.api/commits{/sha}" };

    await getCommitsForRepo({ octokit, repository });

    expect.strictEqual(octokit.request.mock.callCount(), 1);
  });

  it("requests at most 5 pages", async (t) => {
    const octokit = { request: t.mock.fn(async () => ({ data: Array.from({ length: 100 }, botCommit) })) };
    const repository = { name: "repo", commits_url: "https://some.api/commits{/sha}" };

    const actual = await getCommitsForRepo({ octokit, repository });

    expect.strictEqual(octokit.request.mock.callCount(), 5);
    expect.deepStrictEqual(actual, { mostRecentNonBotCommitAt: null, topCommitter: null });
  });

  it("uses the pages it already has if a later page fails", async (t) => {
    t.mock.method(console, "warn", () => {});
    const octokit = {
      request: t.mock.fn(async (url) => {
        if (url.includes("page=2")) throw new Error("Server error");
        return { data: [...Array.from({ length: 99 }, botCommit), humanCommit("2024-01-01T00:00:00Z")] };
      }),
    };
    const repository = { name: "repo", commits_url: "https://some.api/commits{/sha}" };

    const actual = await getCommitsForRepo({ octokit, repository });

    expect.deepStrictEqual(actual, {
      mostRecentNonBotCommitAt: new Date("2024-01-01T00:00:00Z"),
      topCommitter: { name: "Rich", login: "rich" },
    });
  });

  it("returns an empty object if the request fails, e.g. for an empty repo", async (t) => {
    t.mock.method(console, "warn", () => {});
    const octokit = { request: async () => Promise.reject(new Error("Git Repository is empty.")) };
    const repository = { name: "repo", commits_url: "https://some.api/commits{/sha}" };

    const actual = await getCommitsForRepo({ octokit, repository });

    expect.deepStrictEqual(actual, {});
  });
});
