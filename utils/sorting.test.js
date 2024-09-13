import { describe, it } from "node:test";
import expect from "node:assert";
import { sortByNumericValue, sortByType, sortByUpdatedAt } from "./sorting.js";

describe("sortByNumericValue", () => {
  it("returns the original array if sortDirection is not provided", () => {
    const repos = [
      { name: "Repo 1", value: 5 },
      { name: "Repo 2", value: 3 },
      { name: "Repo 3", value: 7 },
    ];

    const result = sortByNumericValue(repos, null, "value");

    expect.deepEqual(result, repos);
  });

  it("sorts the array in ascending order by the specified key if sortDirection is 'asc'", () => {
    const repos = [
      { name: "Repo 1", value: 5 },
      { name: "Repo 2", value: 3 },
      { name: "Repo 3", value: 7 },
    ];

    const result = sortByNumericValue(repos, "asc", "value");

    expect.deepEqual(result, [
      { name: "Repo 2", value: 3 },
      { name: "Repo 1", value: 5 },
      { name: "Repo 3", value: 7 },
    ]);
  });

  it("sorts the array in descending order by the specified key if sortDirection is 'desc'", () => {
    const repos = [
      { name: "Repo 1", value: 5 },
      { name: "Repo 2", value: 3 },
      { name: "Repo 3", value: 7 },
    ];

    const result = sortByNumericValue(repos, "desc", "value");

    expect.deepEqual(result, [
      { name: "Repo 3", value: 7 },
      { name: "Repo 1", value: 5 },
      { name: "Repo 2", value: 3 },
    ]);
  });
});

describe.only("sortByUpdatedAt", () => {
  it("sorts the repos by the date they were last updated", () => {
    const reposToSort = [
      { name: "Repo 1", updatedAtISO8601: "2022-01-01T00:00:00Z" },
      { name: "Repo 2", updatedAtISO8601: "2021-01-01T00:00:00Z" },
      { name: "Repo 3", updatedAtISO8601: "2023-01-01T00:00:00Z" },
    ];

    expect.deepEqual(sortByUpdatedAt(reposToSort, "asc"), [
      { name: "Repo 2", updatedAtISO8601: "2021-01-01T00:00:00Z" },
      { name: "Repo 1", updatedAtISO8601: "2022-01-01T00:00:00Z" },
      { name: "Repo 3", updatedAtISO8601: "2023-01-01T00:00:00Z" },
    ]);
  });
});

describe("sortByType", () => {
  it("sorts the repos by number of open PRs", () => {
    const reposToSort = [
      { name: "Repo 1", openPrsCount: 5 },
      { name: "Repo 2", openPrsCount: 3 },
      { name: "Repo 3", openPrsCount: 7 },
    ];

    expect.deepEqual(
      sortByType(reposToSort, "asc", "openPrsCount"),
      sortByNumericValue(reposToSort, "asc", "openPrsCount")
    );
  });

  it("sorts the repos by number of open issues", () => {
    const reposToSort = [
      { name: "Repo 1", openIssues: 5 },
      { name: "Repo 2", openIssues: 3 },
      { name: "Repo 3", openIssues: 7 },
    ];

    expect.deepEqual(
      sortByType(reposToSort, "asc", "openIssues"),
      sortByNumericValue(reposToSort, "asc", "openIssues")
    );
  });

  it("returns the original array if the sortBy parameter is passed", () => {
    const reposToSort = [
      { name: "Repo 1", openIssues: 5 },
      { name: "Repo 2", openIssues: 3 },
      { name: "Repo 3", openIssues: 7 },
    ];

    expect.deepEqual(sortByType(reposToSort, "asc", null), reposToSort);
  });

  it('sorts the repos by the date they were last updated if "updatedAt" is provided', () => {
    const reposToSort = [
      { name: "Repo 1", updatedAtISO8601: "2022-01-01T00:00:00Z" },
      { name: "Repo 2", updatedAtISO8601: "2021-01-01T00:00:00Z" },
      { name: "Repo 3", updatedAtISO8601: "2023-01-01T00:00:00Z" },
    ];

    expect.deepEqual(
      sortByType(reposToSort, "asc", "updatedAt"),
      sortByUpdatedAt(reposToSort, "asc")
    );
  });
});
