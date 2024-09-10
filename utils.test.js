import { describe, it } from "node:test";
import expect from "node:assert";
import { orgRespositoriesToUiRepositories } from "./utils.js";

describe("orgRespositoriesToUiRepositories", () => {
  it("should map the API response to UI terminology", () => {
    const apiResponse = {
      repositories: [
        {
          name: "repo1",
          description: "description1",
          updated_at: "2021-01-01T00:00:00Z",
          html_url: "http://url.com/repo1",
          issues_url: "http://url.com/repo1/issues",
        },
        {
          name: "repo2",
          description: "description2",
          updated_at: "2021-01-02T00:00:00Z",
          html_url: "http://url.com/repo2",
          issues_url: "http://url.com/repo2/issues",
        },
        {
          name: "repo3",
          description: "description3",
          updated_at: "2021-01-03T00:00:00Z",
          html_url: "http://url.com/repo3",
          issues_url: "http://url.com/repo3/issues",
        },
      ],
      total_count: 3,
    };

    const expectedUiResponse = {
      repos: [
        {
          name: "repo1",
          description: "description1",
          updatedAt: new Date("2021-01-01T00:00:00Z").toLocaleDateString(),
          url: "http://url.com/repo1",
          issuesUrl: "http://url.com/repo1/issues",
        },
        {
          name: "repo2",
          description: "description2",
          updatedAt: new Date("2021-01-02T00:00:00Z").toLocaleDateString(),
          url: "http://url.com/repo2",
          issuesUrl: "http://url.com/repo2/issues",
        },
        {
          name: "repo3",
          description: "description3",
          updatedAt: new Date("2021-01-03T00:00:00Z").toLocaleDateString(),
          url: "http://url.com/repo3",
          issuesUrl: "http://url.com/repo3/issues",
        },
      ],
      totalRepos: 3,
    };

    expect.deepEqual(
      orgRespositoriesToUiRepositories(apiResponse),
      expectedUiResponse
    );
  });
});
