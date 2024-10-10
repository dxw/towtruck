import { describe, it } from "node:test";
import expect from "node:assert";
import { handleEvent } from "./dependencies.js";
import { Dependency } from "../model/Dependency.js";

const db = {
  transaction: (fn) => {
    return (arg) => fn(arg);
  },
  saveToRepository: () => {},
  saveToDependency: () => {},
  getAllRepositories: () => {},
};

const octokit = {
  request: async () => {
    return Promise.resolve({});
  },
};

const apiClient = {
  getAllCycles: (dependency) => ({ dependency, cycles: [] }),
};

describe("handleEvent", () => {
  it("should update the dependency information in the database for the repository", async (t) => {
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
    };

    const repository = {
      name: "repo",
      owner: {
        login: "dxw",
      },
      issues_url: "https://some.api/issues",
    };

    const repositories = {
      repo: {
        repository,
        dependencies: [],
      },
    };

    t.mock.method(octokit, "request", async (url) =>
      Promise.resolve(responses[url]),
    );
    t.mock.method(db, "saveToRepository");
    t.mock.method(db, "getAllRepositories", () => repositories);

    const payload = {
      repository,
    };

    const event = {
      payload,
      octokit,
    };

    const expected = [
      new Dependency("foobar", "1.2.3"),
      new Dependency("libquux", "0.1.1-alpha"),
    ];

    await handleEvent(event, db, apiClient);

    expect.strictEqual(octokit.request.mock.callCount(), 1);

    expect.strictEqual(db.saveToRepository.mock.callCount(), 1);

    expect.deepStrictEqual(db.saveToRepository.mock.calls[0].arguments, [
      payload.repository.name,
      "dependencies",
      expected,
    ]);
  });

  it("should update the lifetime information stored in the database", async (t) => {
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
    };

    const repository = {
      name: "repo",
      owner: {
        login: "dxw",
      },
      issues_url: "https://some.api/issues",
    };

    const repositories = {
      repo: {
        repository,
        dependencies: [new Dependency("foobar", "1.2.3")],
      },
    };

    const cycles = {
      foobar: [
        {
          cycle: "1.2",
          latestVersion: "1.2.3",
          releaseDate: "2024-01-01",
        },
      ],
    };

    t.mock.method(octokit, "request", async (url) =>
      Promise.resolve(responses[url]),
    );
    t.mock.method(db, "transaction");
    t.mock.method(db, "saveToDependency");
    t.mock.method(db, "getAllRepositories", () => repositories);
    t.mock.method(apiClient, "getAllCycles", (dependency) => {
      if (cycles[dependency]) {
        return { dependency, cycles: cycles[dependency] };
      } else {
        return { message: "Product not found" };
      }
    });

    const expected = [
      {
        dependency: "foobar",
        lifetimes: {
          dependency: "foobar",
          cycles: cycles.foobar,
        },
      },
    ];

    const payload = {
      repository,
    };

    const event = {
      payload,
      octokit,
    };

    await handleEvent(event, db, apiClient);

    expect.strictEqual(apiClient.getAllCycles.mock.callCount(), 1);

    expect.strictEqual(db.saveToDependency.mock.callCount(), 1);

    expect.deepStrictEqual(db.saveToDependency.mock.calls[0].arguments, [
      expected[0].dependency,
      "lifetimes",
      expected[0].lifetimes,
    ]);
  });
});
