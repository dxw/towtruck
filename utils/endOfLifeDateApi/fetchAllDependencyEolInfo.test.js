import { describe, it } from "node:test";
import expect from "node:assert";
import {
  fetchAllDependencyLifetimes,
  saveAllDependencyLifetimes,
} from "./fetchAllDependencyEolInfo.js";

const db = {
  getAllRepositories: () => ({}),
  transaction: (fn) => {
    return (arg) => fn(arg);
  },
  saveToDependency: () => {},
};
const apiClient = {
  getAllCycles: (dependency) => ({ dependency, cycles: [] }),
};

describe("fetchAllDependencyLifetimes", () => {
  it("should return information only for dependencies for which the endoflife.date API has information", async (t) => {
    const repositories = {
      repo1: {
        dependencies: [
          {
            name: "foobar",
          },
          {
            name: "libquux",
          },
        ],
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

    const actual = await fetchAllDependencyLifetimes(db, apiClient);

    expect.deepStrictEqual(actual, expected);
  });

  it("should avoid duplicate results", async (t) => {
    const repositories = {
      repo1: {
        dependencies: [
          {
            name: "foobar",
          },
        ],
      },
      repo2: {
        dependencies: [
          {
            name: "foobar",
          },
        ],
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

    const actual = await fetchAllDependencyLifetimes(db, apiClient);

    expect.deepStrictEqual(actual, expected);
  });
});

describe("saveAllDependencyLifetimes", () => {
  it("should save the expected lifetime information", async (t) => {
    t.mock.method(db, "transaction");
    t.mock.method(db, "saveToDependency");

    const dependency1 = {
      dependency: "foobar",
      lifetimes: {
        dependency: "foobar",
        cycles: [
          {
            cycle: "1.2",
            latestVersion: "1.2.3",
            releaseDate: "2024-01-01",
          },
        ],
      },
    };

    const dependency2 = {
      dependency: "libquux",
      lifetimes: {
        dependency: "libquux",
        cycles: [
          {
            cycle: "4.4",
          },
          {
            cycle: "4.3",
          },
        ],
      },
    };

    const allLifetimes = [dependency1, dependency2];

    await saveAllDependencyLifetimes(allLifetimes, db);

    expect.strictEqual(db.transaction.mock.callCount(), 1);

    expect.strictEqual(db.saveToDependency.mock.callCount(), 2);

    expect.deepStrictEqual(db.saveToDependency.mock.calls[0].arguments, [
      dependency1.dependency,
      "lifetimes",
      dependency1.lifetimes,
    ]);
    expect.deepStrictEqual(db.saveToDependency.mock.calls[1].arguments, [
      dependency2.dependency,
      "lifetimes",
      dependency2.lifetimes,
    ]);
  });
});
