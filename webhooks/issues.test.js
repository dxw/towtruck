import { describe, it } from "node:test";
import expect from "node:assert";
import { handleEvent } from "./issues.js";

const db = {
  saveToRepository: () => {},
};

const octokit = {
  request: async () => {
    return Promise.resolve({});
  },
};

describe("handleEvent", () => {
  it("should update the open issue information in the database for the repository", async (t) => {
    const responses = {
      "https://some.api/issues": {
        data: [
          {
            user: {
              login: "foo",
            },
            created_at: "2024-01-01T12:34:56.789Z",
            state: "open",
          },
          {
            user: {
              login: "bar",
            },
            created_at: "2024-10-10T11:22:33.444Z",
            state: "open",
          },
        ],
      },
    };

    t.mock.method(octokit, "request", async (url) =>
      Promise.resolve(responses[url]),
    );
    t.mock.method(db, "saveToRepository");

    const payload = {
      repository: {
        name: "repo",
        owner: {
          login: "dxw",
        },
        issues_url: "https://some.api/issues",
      },
    };

    const event = {
      payload,
      octokit,
    };

    const expected = {
      oldestOpenIssueOpenedAt: new Date("2024-01-01T12:34:56.789Z"),
      mostRecentIssueOpenedAt: new Date("2024-10-10T11:22:33.444Z"),
    };

    await handleEvent(event, db);

    expect.strictEqual(octokit.request.mock.callCount(), 1);

    expect.strictEqual(db.saveToRepository.mock.callCount(), 1);

    expect.deepStrictEqual(db.saveToRepository.mock.calls[0].arguments, [
      payload.repository.name,
      "issues",
      expected,
    ]);
  });
});
