import { describe, it } from "node:test";
import expect from "node:assert";
import { fetchForRepo, saveAllRepos } from "./fetchAllRepos.js";
import { Dependency } from "../../model/Dependency.js";

const octokit = {
  request: async () => {
    return Promise.resolve({});
  },
};

const db = {
  transaction: (fn) => {
    return (arg) => fn(arg);
  },
  saveToRepository: () => {},
};

describe("fetchForRepo", () => {
  it("should map core repository information", async (t) => {
    const responses = {
      "https://some.api/issues": {
        data: [],
      },
      "https://some.api/pulls": {
        data: [],
      },
    };

    t.mock.method(octokit, "request", async (url) =>
      Promise.resolve(responses[url]),
    );

    const repository = {
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

    const actual = await fetchForRepo(repository, octokit);

    expect.deepStrictEqual(actual.repo, expected);
  });

  it("should fetch dependency information", async (t) => {
    const responses = {
      "https://some.api/issues": {
        data: [
          {
            user: {
              login: "renovate[bot]",
            },
            body: "## Detected dependencies\n\n- `foobar 1.2.3`\n- `libquux 0.1.1-alpha` \n\n---",
          },
        ],
      },
      "https://some.api/pulls": {
        data: [],
      },
    };

    t.mock.method(octokit, "request", async (url) =>
      Promise.resolve(responses[url]),
    );

    const repository = {
      name: "repo",
      owner: {
        login: "dxw",
      },
      issues_url: "https://some.api/issues",
      pulls_url: "https://some.api/pulls",
    };

    const expected = [
      new Dependency("foobar", "1.2.3"),
      new Dependency("libquux", "0.1.1-alpha"),
    ];

    const actual = await fetchForRepo(repository, octokit);

    expect.deepStrictEqual(actual.dependencies, expected);
  });

  it("should fetch open pull request information", async (t) => {
    const responses = {
      "https://some.api/issues": {
        data: [],
      },
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

    const repository = {
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
    };

    const expected = {
      openPrCount: 2,
      openBotPrCount: 1,
      oldestOpenPrOpenedAt: new Date("2024-01-01T12:34:56.789Z"),
      mostRecentPrOpenedAt: new Date("2024-10-10T11:22:33.444Z"),
    };

    const actual = await fetchForRepo(repository, octokit);

    expect.deepStrictEqual(actual.prInfo, expected);
  });

  it("should fetch open issue information", async (t) => {
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
      "https://some.api/pulls": {
        data: [],
      },
    };

    t.mock.method(octokit, "request", async (url) =>
      Promise.resolve(responses[url]),
    );

    const repository = {
      name: "repo",
      owner: {
        login: "dxw",
      },
      issues_url: "https://some.api/issues",
      pulls_url: "https://some.api/pulls",
    };

    const expected = {
      oldestOpenIssueOpenedAt: new Date("2024-01-01T12:34:56.789Z"),
      mostRecentIssueOpenedAt: new Date("2024-10-10T11:22:33.444Z"),
    };

    const actual = await fetchForRepo(repository, octokit);

    expect.deepStrictEqual(actual.issueInfo, expected);
  });

  it("should fetch Dependabot vulnerability information", async (t) => {
    const responses = {
      "https://some.api/issues": {
        data: [],
      },
      "https://some.api/pulls": {
        data: [],
      },
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

    const repository = {
      name: "repo",
      owner: {
        login: "dxw",
      },
      issues_url: "https://some.api/issues",
      pulls_url: "https://some.api/pulls",
    };

    const expected = {
      criticalSeverityAlerts: 1,
      highSeverityAlerts: 1,
      mediumSeverityAlerts: 1,
      lowSeverityAlerts: 1,
      totalOpenAlerts: 4,
    };

    const actual = await fetchForRepo(repository, octokit);

    expect.deepStrictEqual(actual.alerts, expected);
  });
});

describe("saveAllRepos", () => {
  it("should save the expected repository information", async (t) => {
    t.mock.method(db, "transaction");
    t.mock.method(db, "saveToRepository");

    const repo1 = {
      repo: {
        name: "repo1",
        owner: "dxw",
      },
      dependencies: ["foo"],
      prInfo: {
        openPrCount: 1,
      },
      issueInfo: {
        openIssueCount: 2,
      },
      alerts: {
        totalOpenAlerts: 4,
      },
    };

    const repo2 = {
      repo: {
        name: "repo2",
        owner: "dxw",
      },
      dependencies: ["bar"],
      prInfo: {
        openPrCount: 0,
      },
      issueInfo: {
        openIssueCount: 3,
      },
      alerts: {
        totalOpenAlerts: 2,
      },
    };

    const allRepos = [repo1, repo2];

    await saveAllRepos(allRepos, db);

    expect.strictEqual(db.transaction.mock.callCount(), 1);

    expect.strictEqual(db.saveToRepository.mock.callCount(), 12);

    expect.deepStrictEqual(db.saveToRepository.mock.calls[0].arguments, [
      repo1.repo.name,
      "main",
      repo1.repo,
    ]);
    expect.deepStrictEqual(db.saveToRepository.mock.calls[1].arguments, [
      repo1.repo.name,
      "owner",
      repo1.repo.owner,
    ]);
    expect.deepStrictEqual(db.saveToRepository.mock.calls[2].arguments, [
      repo1.repo.name,
      "dependencies",
      repo1.dependencies,
    ]);
    expect.deepStrictEqual(db.saveToRepository.mock.calls[3].arguments, [
      repo1.repo.name,
      "pullRequests",
      repo1.prInfo,
    ]);
    expect.deepStrictEqual(db.saveToRepository.mock.calls[4].arguments, [
      repo1.repo.name,
      "issues",
      repo1.issueInfo,
    ]);
    expect.deepStrictEqual(db.saveToRepository.mock.calls[5].arguments, [
      repo1.repo.name,
      "dependabotAlerts",
      repo1.alerts,
    ]);

    expect.deepStrictEqual(db.saveToRepository.mock.calls[6].arguments, [
      repo2.repo.name,
      "main",
      repo2.repo,
    ]);
    expect.deepStrictEqual(db.saveToRepository.mock.calls[7].arguments, [
      repo2.repo.name,
      "owner",
      repo2.repo.owner,
    ]);
    expect.deepStrictEqual(db.saveToRepository.mock.calls[8].arguments, [
      repo2.repo.name,
      "dependencies",
      repo2.dependencies,
    ]);
    expect.deepStrictEqual(db.saveToRepository.mock.calls[9].arguments, [
      repo2.repo.name,
      "pullRequests",
      repo2.prInfo,
    ]);
    expect.deepStrictEqual(db.saveToRepository.mock.calls[10].arguments, [
      repo2.repo.name,
      "issues",
      repo2.issueInfo,
    ]);
    expect.deepStrictEqual(db.saveToRepository.mock.calls[11].arguments, [
      repo2.repo.name,
      "dependabotAlerts",
      repo2.alerts,
    ]);
  });
});
