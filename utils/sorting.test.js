import { describe, it } from "node:test";
import expect from "node:assert";
import { sortByOpenPrs, sortByNumericValue, sortByType } from "./sorting.js";

describe("sortByOpenPrs", () => {
  it("returns the original array if sortDirection is not provided", () => {
    const repos = [
      { name: "Repo 1", openPrsCount: 5 },
      { name: "Repo 2", openPrsCount: 3 },
      { name: "Repo 3", openPrsCount: 7 },
    ];

    const result = sortByOpenPrs(repos);

    expect.deepEqual(result, repos);
  });

  it("sorts the array in ascending order by openPrsCount if sortDirection is 'asc'", () => {
    const repos = [
      { name: "Repo 1", openPrsCount: 5 },
      { name: "Repo 2", openPrsCount: 3 },
      { name: "Repo 3", openPrsCount: 7 },
    ];

    const result = sortByOpenPrs(repos, "asc");

    expect.deepEqual(result, [
      { name: "Repo 2", openPrsCount: 3 },
      { name: "Repo 1", openPrsCount: 5 },
      { name: "Repo 3", openPrsCount: 7 },
    ]);
  });

  it("sorts the array in descending order by openPrsCount if sortDirection is 'desc'", () => {
    const repos = [
      { name: "Repo 1", openPrsCount: 5 },
      { name: "Repo 2", openPrsCount: 3 },
      { name: "Repo 3", openPrsCount: 7 },
    ];

    const result = sortByOpenPrs(repos, "desc");

    expect.deepEqual(result, [
      { name: "Repo 3", openPrsCount: 7 },
      { name: "Repo 1", openPrsCount: 5 },
      { name: "Repo 2", openPrsCount: 3 },
    ]);
  });
});

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
});
