import { describe, it } from "node:test";
import expect from "node:assert";
import { Dependency } from "../../model/Dependency.js";
import { handleIssuesApiResponse } from "./dependencyDashboard.js";

describe("handleIssuesApiResponse", () => {
  it("should extract dependency version information from the Renovate Dependency Dashboard if it exists", async () => {
    const issuesApiResponse = {
      data: [
        {
          user: {
            login: "some-user",
          },
          pull_request: {},
          body: "Here's a pull request to manually update dependency `foo-utils 1.2.3` to `foo-utils 1.2.4`.",
        },
        {
          user: {
            login: "renovate[bot]",
          },
          pull_request: {},
          body: "Here's a pull request to automatically update dependency `bar-utils 4.5.6` to `bar-utils 4.6.0`.",
        },
        {
          user: {
            login: "renovate[bot]",
          },
          body: '# Dependency Dashboard\n'
            + 'Here\'s some things in the preamble that should not be picked up:\n'
            + '`fake-dependency`, `another-fake-dependency`\n'
            + '\n'
            + '## Detected dependencies\n'
            + '- `libquux v4.1.1.rc4`\n'
            + '- `@xyzzy/utils "~> 22.04 Questing Quokka"`\n'
            + '\n'
            + 'Here\'s some more:\n'
            + '- `baz-framework ^0.1`\n'
            + '---',
        },
      ],
    };

    const expectedDependencies = [
      new Dependency("libquux", "v4.1.1.rc4"),
      new Dependency("@xyzzy/utils", '"~> 22.04 Questing Quokka"'),
      new Dependency("baz-framework", "^0.1"),
    ];

    expect.deepEqual(
      handleIssuesApiResponse(issuesApiResponse),
      expectedDependencies
    );
  });

  it("should return an empty list when there's no Renovate Dependency Dashboard", async () => {
    const issuesApiResponse = {
      data: [
        {
          user: {
            login: "some-user",
          },
          pull_request: {},
          body: "Here's a pull request to manually update dependency `foo-utils 1.2.3` to `foo-utils 1.2.4`.",
        },
        {
          user: {
            login: "renovate[bot]",
          },
          pull_request: {},
          body: "Configure Renovate",
        },
      ],
    };

    const expectedDependencies = [];

    expect.deepEqual(
      handleIssuesApiResponse(issuesApiResponse),
      expectedDependencies
    );
  });
});
