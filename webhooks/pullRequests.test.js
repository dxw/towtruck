import { describe, it } from "node:test";
import expect from "node:assert";
import { handleEvent } from "./pullRequests.js";

const db = {
  saveToRepository: () => {},
};

const octokit = {
  request: async () => {
    return Promise.resolve({});
  },
};

describe("handleEvent", () => {
  it("should update the open pull request information in the database for the repository", async (t) => {
    const responses = {
      "https://some.api/pulls": {
        data: [
          {
            user: {
              login: "renovate[bot]",
            },
            created_at: "2024-10-10T11:22:33.444Z",
            state: "open",
          },
          {
            user: {
              login: "foo",
            },
            created_at: "2024-01-01T12:34:56.789Z",
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
        pulls_url: "https://some.api/pulls",
      },
    };

    const event = {
      payload,
      octokit,
    };

    const expected = {
      openPrCount: 2,
      openBotPrCount: 1,
      oldestOpenPrOpenedAt: new Date("2024-01-01T12:34:56.789Z"),
      mostRecentPrOpenedAt: new Date("2024-10-10T11:22:33.444Z"),
    };

    await handleEvent(event, db);

    expect.strictEqual(octokit.request.mock.callCount(), 1);

    expect.strictEqual(db.saveToRepository.mock.callCount(), 1);

    expect.deepStrictEqual(db.saveToRepository.mock.calls[0].arguments, [
      payload.repository.name,
      "pullRequests",
      expected,
    ]);
  });
});
