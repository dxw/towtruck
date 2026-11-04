import { describe, it } from "node:test";
import expect from "node:assert";
import { handleEvent } from "./commits.js";

describe("handleEvent", () => {
  it("should update the most recent non-bot commit and top committer in the database for the repository", async (t) => {
    const octokit = {
      request: t.mock.fn(async () => ({
        data: [
          {
            author: { login: "renovate[bot]", type: "Bot" },
            commit: { author: { date: "2024-10-10T11:22:33Z" } },
          },
          {
            author: { login: "foo", type: "User" },
            commit: { author: { name: "Foo Bar", date: "2024-01-01T12:34:56Z" } },
          },
        ],
      })),
    };
    const db = { saveToRepository: t.mock.fn() };

    const payload = {
      ref: "refs/heads/main",
      repository: {
        name: "repo",
        full_name: "dxw/repo",
        default_branch: "main",
        commits_url: "https://some.api/commits{/sha}",
      },
    };

    await handleEvent({ payload, octokit }, db);

    expect.deepStrictEqual(octokit.request.mock.calls[0].arguments, ["https://some.api/commits?per_page=100"]);
    expect.strictEqual(db.saveToRepository.mock.callCount(), 1);
    expect.deepStrictEqual(db.saveToRepository.mock.calls[0].arguments, [
      "dxw/repo",
      "commits",
      { mostRecentNonBotCommitAt: new Date("2024-01-01T12:34:56Z"), topCommitter: { name: "Foo Bar", login: "foo" } },
    ]);
  });
});
