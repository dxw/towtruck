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

  it("should extract dependencies from the new Renovate Dashboard format with HTML details blocks", async () => {
    const issuesApiResponse = {
      data: [
        {
          user: {
            login: "renovate[bot]",
          },
          body: '# Dependency Dashboard\n'
            + 'This issue lists Renovate updates and detected dependencies.\n'
            + '\n'
            + '## Detected Dependencies\n'
            + '\n'
            + '<details><summary>npm (1)</summary>\n'
            + '<blockquote>\n'
            + '<details><summary>package.json (3)</summary>\n'
            + '\n'
            + ' - `@octokit/app ^16.0.0`\n'
            + ' - `express ^5.0.0`\n'
            + ' - `chokidar 3.6.0`\n'
            + '\n'
            + '</details>\n'
            + '</blockquote>\n'
            + '</details>\n'
            + '\n'
            + '<details><summary>github-actions (1)</summary>\n'
            + '<blockquote>\n'
            + '<details><summary>.github/workflows/test.yml (2)</summary>\n'
            + '\n'
            + ' - `actions/checkout v7@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0`\n'
            + ' - `actions/setup-node v6@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e`\n'
            + '\n'
            + '</details>\n'
            + '</blockquote>\n'
            + '</details>\n'
            + '\n'
            + '<details><summary>dockerfile (1)</summary>\n'
            + '<blockquote>\n'
            + '<details><summary>Dockerfile (1)</summary>\n'
            + '\n'
            + ' - `node 24.18.0-slim@sha256:abc123`\n'
            + '\n'
            + '</details>\n'
            + '</blockquote>\n'
            + '</details>\n'
            + '\n'
            + '---\n'
            + '\n'
            + '- [ ] <!-- manual job -->Check this box to trigger a request for Renovate to run again on this repository\n',
        },
      ],
    };

    const expectedDependencies = [
      new Dependency("@octokit/app", "^16.0.0"),
      new Dependency("express", "^5.0.0"),
      new Dependency("chokidar", "3.6.0"),
      new Dependency("actions/checkout", "v7"),
      new Dependency("actions/setup-node", "v6"),
      new Dependency("node", "24.18.0-slim"),
    ];

    expect.deepEqual(
      handleIssuesApiResponse(issuesApiResponse),
      expectedDependencies
    );
  });
});
