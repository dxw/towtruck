import { describe, it } from "node:test";
import expect from "node:assert";
import { mapRepoFromStorageToUi } from "./utils.js";

describe("mapRepoFromStorageToUi", () => {
  it("converts the ISO8601 date to a human-readable date", () => {
    const storedRepos = [
      {
        name: "repo1",
        description: "description1",
        updatedAt: "2021-01-01T00:00:00Z",
        htmlUrl: "http://url.com/repo1",
        apiUrl: "http://api.com/repo1",
        pullsUrl: "http://api.com/repo1/pulls",
        issuesUrl: "http://api.com/repo1/issues",
        language: null,
        topics: [],
        openIssues: 0,
      },
    ];

    const persistedData = {
      repos: storedRepos,
    };

    const expected = [
      {
        name: "repo1",
        description: "description1",
        updatedAt: new Date("2021-01-01T00:00:00Z").toLocaleDateString(),
        htmlUrl: "http://url.com/repo1",
        apiUrl: "http://api.com/repo1",
        pullsUrl: "http://api.com/repo1/pulls",
        issuesUrl: "http://api.com/repo1/issues",
        language: null,
        topics: [],
        openIssues: 0,
      },
    ];

    expect.deepEqual(mapRepoFromStorageToUi(persistedData).repos, expected);
  });

  it("returns a count of the number of repos", () => {
    const storedRepos = [
      {
        name: "repo1",
        description: "description1",
        updatedAt: "2021-01-01T00:00:00Z",
        htmlUrl: "http://url.com/repo1",
        apiUrl: "http://api.com/repo1",
        pullsUrl: "http://api.com/repo1/pulls",
        issuesUrl: "http://api.com/repo1/issues",
        language: null,
        topics: [],
        openIssues: 0,
      },
      {
        name: "repo2",
        description: "description2",
        updatedAt: "2021-01-01T00:00:00Z",
        htmlUrl: "http://url.com/repo2",
        apiUrl: "http://api.com/repo2",
        pullsUrl: "http://api.com/repo2/pulls",
        issuesUrl: "http://api.com/repo2/issues",
        language: null,
        topics: [],
        openIssues: 0,
      },
      {
        name: "repo3",
        description: "description3",
        updatedAt: "2021-01-01T00:00:00Z",
        htmlUrl: "http://url.com/repo3",
        apiUrl: "http://api.com/repo3",
        pullsUrl: "http://api.com/repo3/pulls",
        issuesUrl: "http://api.com/repo3/issues",
        language: null,
        topics: [],
        openIssues: 0,
      },
    ];
    const persistedData = {
      repos: storedRepos,
    };

    expect.deepEqual(mapRepoFromStorageToUi(persistedData).totalRepos, 3);
  });
});
