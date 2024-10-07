import { describe, it } from "node:test";
import expect from "node:assert";
import { handleEvent } from "./repository.js";

const db = {
  saveToRepository: () => {},
};

const octokit = {
  request: async () => {
    return Promise.resolve({});
  },
};

describe("handleEvent", () => {
  it("should update the core information in the database for the repository", async (t) => {
    t.mock.method(db, "saveToRepository");

    const payload = {
      repository: {
        name: "repo",
        description: "Some repo",
        owner: {
          login: "dxw",
        },
        url: "https://some.api/dxw/repo",
        html_url: "https://some.site/dxw/repo",
        issues_url: "https://some.api/issues",
        pulls_url: "https://some.api/pulls",
        updated_at: "2024-01-01T12:34:56.789Z",
        language: "Ruby",
        topics: ["foo", "bar"],
        open_issues: 4,
      },
    };

    const event = {
      payload,
      octokit,
    };

    const expected = {
      name: "repo",
      owner: "dxw",
      description: "Some repo",
      htmlUrl: "https://some.site/dxw/repo",
      apiUrl: "https://some.api/dxw/repo",
      pullsUrl: "https://some.api/pulls",
      issuesUrl: "https://some.api/issues",
      updatedAt: "2024-01-01T12:34:56.789Z",
      language: "Ruby",
      topics: ["foo", "bar"],
      openIssues: 4,
    };

    await handleEvent(event, db);

    expect.strictEqual(db.saveToRepository.mock.callCount(), 1);

    expect.deepStrictEqual(db.saveToRepository.mock.calls[0].arguments, [
      payload.repository.name,
      "main",
      expected,
    ]);
  });
});
