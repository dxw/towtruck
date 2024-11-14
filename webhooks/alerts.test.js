import { describe, it } from "node:test";
import expect from "node:assert";
import { handleEvent } from "./alerts.js";

const db = {
  saveToRepository: () => {},
};

const octokit = {
  request: async () => {
    return Promise.resolve({});
  },
};

describe("handleEvent", () => {
  it("should update the Dependabot alert information in the database for the repository", async (t) => {
    const responses = {
      "/repos/{owner}/{repo}/dependabot/alerts": {
        data: [
          {
            state: "open",
            security_vulnerability: {
              severity: "critical",
            },
          },
          {
            state: "open",
            security_vulnerability: {
              severity: "high",
            },
          },
          {
            state: "open",
            security_vulnerability: {
              severity: "medium",
            },
          },
          {
            state: "open",
            security_vulnerability: {
              severity: "low",
            },
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
      },
    };

    const event = {
      payload,
      octokit,
    };

    const expected = {
      criticalSeverityAlerts: 1,
      highSeverityAlerts: 1,
      mediumSeverityAlerts: 1,
      lowSeverityAlerts: 1,
      totalOpenAlerts: 4,
    };

    await handleEvent(event, db);

    expect.strictEqual(octokit.request.mock.callCount(), 1);

    expect.strictEqual(db.saveToRepository.mock.callCount(), 1);

    expect.deepStrictEqual(db.saveToRepository.mock.calls[0].arguments, [
      payload.repository.name,
      "dependabotAlerts",
      expected,
    ]);
  });
});
