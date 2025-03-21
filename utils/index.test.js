import { describe, it } from "node:test";
import expect from "node:assert";
import { mapRepoFromStorageToUi, mapRepoFromApiForStorage, hashToTailwindColor } from "./index.js";
import { formatDistanceToNow } from "date-fns";

describe("mapRepoFromStorageToUi", () => {
  it("converts ISO8601 timestamps to human-readable forms", () => {
    const persistedData = {
      repo1: {
        owner: "dxw",
        main: {
          name: "repo1",
          description: "description1",
          updatedAt: "2021-01-01T00:00:00Z",
          htmlUrl: "http://url.com/repo1",
          apiUrl: "http://api.com/repo1",
          pullsUrl: "http://api.com/repo1/pulls",
          issuesUrl: "http://api.com/repo1/issues",
          language: null,
          topics: [],
        },
        pullRequests: {
          mostRecentPrOpenedAt: "2021-01-01T00:00:00Z",
          oldestOpenPrOpenedAt: "2022-02-02T00:00:00Z",
        },
        issues: {
          openIssues: 0,
          mostRecentIssueOpenedAt: "2023-03-03T00:00:00Z",
          oldestOpenIssueOpenedAt: "2024-04-04T00:00:00Z",
        },
        dependencies: [],
      },
    };

    const expected = [
      {
        name: "repo1",
        description: "description1",
        updatedAt: new Date("2021-01-01T00:00:00Z").toLocaleDateString(),
        updatedAtISO8601: "2021-01-01T00:00:00Z",
        htmlUrl: "http://url.com/repo1",
        apiUrl: "http://api.com/repo1",
        pullsUrl: "http://api.com/repo1/pulls",
        issuesUrl: "http://api.com/repo1/issues",
        language: null,
        topics: [],
        openIssues: 0,
        dependencies: [],
        mostRecentPrOpenedAt: formatDistanceToNow(new Date("2021-01-01T00:00:00Z"), { addSuffix: true }),
        mostRecentPrOpenedAtISO8601: "2021-01-01T00:00:00Z",
        oldestOpenPrOpenedAt: formatDistanceToNow(new Date("2022-02-02T00:00:00Z"), { addSuffix: true }),
        oldestOpenPrOpenedAtISO8601: "2022-02-02T00:00:00Z",
        mostRecentIssueOpenedAt: formatDistanceToNow(new Date("2023-03-03T00:00:00Z"), { addSuffix: true }),
        mostRecentIssueOpenedAtISO8601: "2023-03-03T00:00:00Z",
        oldestOpenIssueOpenedAt: formatDistanceToNow(new Date("2024-04-04T00:00:00Z"), { addSuffix: true }),
        oldestOpenIssueOpenedAtISO8601: "2024-04-04T00:00:00Z",
        languageColor: undefined,
      },
    ];

    expect.deepEqual(mapRepoFromStorageToUi(persistedData).repos, expected);
  });

  it("converts the language string to a Tailwind colour", () => {
    const persistedData = {
      repo1: {
        owner: "dxw",
        main: {
          name: "repo1",
          description: "description1",
          updatedAt: "2021-01-01T00:00:00Z",
          htmlUrl: "http://url.com/repo1",
          apiUrl: "http://api.com/repo1",
          pullsUrl: "http://api.com/repo1/pulls",
          issuesUrl: "http://api.com/repo1/issues",
          language: "Ruby",
          topics: [],
        },
        pullRequests: {
          mostRecentPrOpenedAt: "2021-01-01T00:00:00Z",
          oldestOpenPrOpenedAt: "2022-02-02T00:00:00Z",
        },
        issues: {
          openIssues: 0,
          mostRecentIssueOpenedAt: "2023-03-03T00:00:00Z",
          oldestOpenIssueOpenedAt: "2024-04-04T00:00:00Z",
        },
        dependencies: [],
      },
      repo2: {
        owner: "dxw",
        main: {
          name: "repo2",
          description: "description2",
          updatedAt: "2021-01-01T00:00:00Z",
          htmlUrl: "http://url.com/repo2",
          apiUrl: "http://api.com/repo2",
          pullsUrl: "http://api.com/repo2/pulls",
          issuesUrl: "http://api.com/repo2/issues",
          language: "TypeScript",
          topics: [],
        },
        pullRequests: {
          mostRecentPrOpenedAt: "2021-01-01T00:00:00Z",
          oldestOpenPrOpenedAt: "2022-02-02T00:00:00Z",
        },
        issues: {
          openIssues: 0,
          mostRecentIssueOpenedAt: "2023-03-03T00:00:00Z",
          oldestOpenIssueOpenedAt: "2024-04-04T00:00:00Z",
        },
        dependencies: [],
      },
    };

    const expected = [
      {
        name: "repo1",
        description: "description1",
        updatedAt: new Date("2021-01-01T00:00:00Z").toLocaleDateString(),
        updatedAtISO8601: "2021-01-01T00:00:00Z",
        htmlUrl: "http://url.com/repo1",
        apiUrl: "http://api.com/repo1",
        pullsUrl: "http://api.com/repo1/pulls",
        issuesUrl: "http://api.com/repo1/issues",
        language: "Ruby",
        topics: [],
        openIssues: 0,
        dependencies: [],
        mostRecentPrOpenedAt: formatDistanceToNow(new Date("2021-01-01T00:00:00Z"), { addSuffix: true }),
        mostRecentPrOpenedAtISO8601: "2021-01-01T00:00:00Z",
        oldestOpenPrOpenedAt: formatDistanceToNow(new Date("2022-02-02T00:00:00Z"), { addSuffix: true }),
        oldestOpenPrOpenedAtISO8601: "2022-02-02T00:00:00Z",
        mostRecentIssueOpenedAt: formatDistanceToNow(new Date("2023-03-03T00:00:00Z"), { addSuffix: true }),
        mostRecentIssueOpenedAtISO8601: "2023-03-03T00:00:00Z",
        oldestOpenIssueOpenedAt: formatDistanceToNow(new Date("2024-04-04T00:00:00Z"), { addSuffix: true }),
        oldestOpenIssueOpenedAtISO8601: "2024-04-04T00:00:00Z",
        languageColor: "rose",
      },
      {
        name: "repo2",
        description: "description2",
        updatedAt: new Date("2021-01-01T00:00:00Z").toLocaleDateString(),
        updatedAtISO8601: "2021-01-01T00:00:00Z",
        htmlUrl: "http://url.com/repo2",
        apiUrl: "http://api.com/repo2",
        pullsUrl: "http://api.com/repo2/pulls",
        issuesUrl: "http://api.com/repo2/issues",
        language: "TypeScript",
        topics: [],
        openIssues: 0,
        dependencies: [],
        mostRecentPrOpenedAt: formatDistanceToNow(new Date("2021-01-01T00:00:00Z"), { addSuffix: true }),
        mostRecentPrOpenedAtISO8601: "2021-01-01T00:00:00Z",
        oldestOpenPrOpenedAt: formatDistanceToNow(new Date("2022-02-02T00:00:00Z"), { addSuffix: true }),
        oldestOpenPrOpenedAtISO8601: "2022-02-02T00:00:00Z",
        mostRecentIssueOpenedAt: formatDistanceToNow(new Date("2023-03-03T00:00:00Z"), { addSuffix: true }),
        mostRecentIssueOpenedAtISO8601: "2023-03-03T00:00:00Z",
        oldestOpenIssueOpenedAt: formatDistanceToNow(new Date("2024-04-04T00:00:00Z"), { addSuffix: true }),
        oldestOpenIssueOpenedAtISO8601: "2024-04-04T00:00:00Z",
        languageColor: "emerald",
      },
    ];

    expect.deepEqual(mapRepoFromStorageToUi(persistedData).repos, expected);
  });

  it("returns a count of the number of repos", () => {
    const persistedData = {
      repo1: {
        owner: "dxw",
        main: {
          name: "repo1",
          description: "description1",
          updatedAt: "2021-01-01T00:00:00Z",
          htmlUrl: "http://url.com/repo1",
          apiUrl: "http://api.com/repo1",
          pullsUrl: "http://api.com/repo1/pulls",
          issuesUrl: "http://api.com/repo1/issues",
          language: null,
          topics: [],
        },
        pullRequests: {
          mostRecentPrOpenedAt: "2021-01-01T00:00:00Z",
          oldestOpenPrOpenedAt: "2022-02-02T00:00:00Z",
        },
        issues: {
          openIssues: 0,
          mostRecentIssueOpenedAt: "2023-03-03T00:00:00Z",
          oldestOpenIssueOpenedAt: "2024-04-04T00:00:00Z",
        },
        dependencies: [],
      },
      repo2: {
        owner: "dxw",
        main: {
          name: "repo2",
          description: "description2",
          updatedAt: "2021-01-01T00:00:00Z",
          htmlUrl: "http://url.com/repo2",
          apiUrl: "http://api.com/repo2",
          pullsUrl: "http://api.com/repo2/pulls",
          issuesUrl: "http://api.com/repo2/issues",
          language: null,
          topics: [],
        },
        pullRequests: {
          mostRecentPrOpenedAt: "2021-01-01T00:00:00Z",
          oldestOpenPrOpenedAt: "2022-02-02T00:00:00Z",
        },
        issues: {
          openIssues: 0,
          mostRecentIssueOpenedAt: "2023-03-03T00:00:00Z",
          oldestOpenIssueOpenedAt: "2024-04-04T00:00:00Z",
        },
        dependencies: [],
      },
      repo3: {
        owner: "dxw",
        main: {
          name: "repo3",
          description: "description3",
          updatedAt: "2021-01-01T00:00:00Z",
          htmlUrl: "http://url.com/repo3",
          apiUrl: "http://api.com/repo3",
          pullsUrl: "http://api.com/repo3/pulls",
          issuesUrl: "http://api.com/repo3/issues",
          language: null,
          topics: [],
        },
        pullRequests: {
          mostRecentPrOpenedAt: "2021-01-01T00:00:00Z",
          oldestOpenPrOpenedAt: "2022-02-02T00:00:00Z",
        },
        issues: {
          openIssues: 0,
          mostRecentIssueOpenedAt: "2023-03-03T00:00:00Z",
          oldestOpenIssueOpenedAt: "2024-04-04T00:00:00Z",
        },
        dependencies: [],
      },
    };

    expect.deepEqual(mapRepoFromStorageToUi(persistedData).totalRepos, 3);
  });

  describe("mapRepo", () => {
    it("maps the repo from the data returned from the api", async () => {
      const apiRepo = {
        id: 248204237,
        node_id: "MDEwOlJlcG9zaXRvcnkyNDgyMDQyMzc=",
        name: "security-alert-notifier",
        full_name: "dxw/security-alert-notifier",
        private: false,
        owner: {
          login: "dxw",
          id: 27897,
          node_id: "MDEyOk9yZ2FuaXphdGlvbjI3ODk3",
          avatar_url: "https://avatars.githubusercontent.com/u/27897?v=4",
          gravatar_id: "",
          url: "https://api.github.com/users/dxw",
          html_url: "https://github.com/dxw",
          followers_url: "https://api.github.com/users/dxw/followers",
          following_url:
            "https://api.github.com/users/dxw/following{/other_user}",
          gists_url: "https://api.github.com/users/dxw/gists{/gist_id}",
          starred_url:
            "https://api.github.com/users/dxw/starred{/owner}{/repo}",
          subscriptions_url: "https://api.github.com/users/dxw/subscriptions",
          organizations_url: "https://api.github.com/users/dxw/orgs",
          repos_url: "https://api.github.com/users/dxw/repos",
          events_url: "https://api.github.com/users/dxw/events{/privacy}",
          received_events_url:
            "https://api.github.com/users/dxw/received_events",
          type: "Organization",
          site_admin: false,
        },
        html_url: "https://github.com/dxw/security-alert-notifier",
        description:
          "Icinga plugin to fetch security vulnerabilities for a GitHub organization.",
        fork: false,
        url: "https://api.github.com/repos/dxw/security-alert-notifier",
        forks_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/forks",
        keys_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/keys{/key_id}",
        collaborators_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/collaborators{/collaborator}",
        teams_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/teams",
        hooks_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/hooks",
        issue_events_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/issues/events{/number}",
        events_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/events",
        assignees_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/assignees{/user}",
        branches_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/branches{/branch}",
        tags_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/tags",
        blobs_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/git/blobs{/sha}",
        git_tags_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/git/tags{/sha}",
        git_refs_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/git/refs{/sha}",
        trees_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/git/trees{/sha}",
        statuses_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/statuses/{sha}",
        languages_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/languages",
        stargazers_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/stargazers",
        contributors_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/contributors",
        subscribers_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/subscribers",
        subscription_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/subscription",
        commits_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/commits{/sha}",
        git_commits_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/git/commits{/sha}",
        comments_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/comments{/number}",
        issue_comment_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/issues/comments{/number}",
        contents_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/contents/{+path}",
        compare_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/compare/{base}...{head}",
        merges_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/merges",
        archive_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/{archive_format}{/ref}",
        downloads_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/downloads",
        issues_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/issues{/number}",
        pulls_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/pulls{/number}",
        milestones_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/milestones{/number}",
        notifications_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/notifications{?since,all,participating}",
        labels_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/labels{/name}",
        releases_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/releases{/id}",
        deployments_url:
          "https://api.github.com/repos/dxw/security-alert-notifier/deployments",
        created_at: "2020-03-18T10:44:50Z",
        updated_at: "2024-08-23T14:52:53Z",
        pushed_at: "2024-09-07T15:41:34Z",
        git_url: "git://github.com/dxw/security-alert-notifier.git",
        ssh_url: "git@github.com:dxw/security-alert-notifier.git",
        clone_url: "https://github.com/dxw/security-alert-notifier.git",
        svn_url: "https://github.com/dxw/security-alert-notifier",
        homepage: "",
        size: 91,
        stargazers_count: 3,
        watchers_count: 3,
        language: "Ruby",
        has_issues: true,
        has_projects: true,
        has_downloads: true,
        has_wiki: true,
        has_pages: false,
        has_discussions: false,
        forks_count: 1,
        mirror_url: null,
        archived: false,
        disabled: false,
        open_issues_count: 2,
        license: null,
        allow_forking: true,
        is_template: false,
        web_commit_signoff_required: false,
        topics: ["delivery-plus", "internal", "tech-ops"],
        visibility: "public",
        forks: 1,
        open_issues: 2,
        watchers: 3,
        default_branch: "main",
        permissions: {
          admin: false,
          maintain: false,
          push: false,
          triage: false,
          pull: false,
        },
      };

      const repoToSave = {
        name: "security-alert-notifier",
        owner: "dxw",
        description:
          "Icinga plugin to fetch security vulnerabilities for a GitHub organization.",
        htmlUrl: "https://github.com/dxw/security-alert-notifier",
        apiUrl: "https://api.github.com/repos/dxw/security-alert-notifier",
        pullsUrl:
          "https://api.github.com/repos/dxw/security-alert-notifier/pulls{/number}",
        issuesUrl:
          "https://api.github.com/repos/dxw/security-alert-notifier/issues{/number}",
        updatedAt: "2024-08-23T14:52:53Z",
        language: "Ruby",
        topics: ["delivery-plus", "internal", "tech-ops"],
        openIssues: 2,
      };

      expect.deepEqual(mapRepoFromApiForStorage(apiRepo), repoToSave);
    });
  });
});

describe("hashToTailwindColor", () => {
  it("returns undefined if not given a string", () => {
    const actual = hashToTailwindColor(5);

    expect.strictEqual(actual, undefined);
  });

  it("hashes a string's characters and uses the hash to pick from the list of Tailwind colours", () => {
    const inputStrings = [
      "f",
      "fo",
      "foi",
      "foic",
      "foicn",
      "foicnh",
      "foicnhb",
      "foicnhbm",
      "foicnhbmg",
      "foicnhbmga",
      "foicnhbmgal",
      "foicnhbmgalf",
      "l",
      "lk",
      "lke",
      "lkep",
      "lkepj",
    ];

    const expectedStrings = [
      "red",
      "orange",
      "amber",
      "yellow",
      "lime",
      "green",
      "emerald",
      "teal",
      "cyan",
      "sky",
      "blue",
      "indigo",
      "violet",
      "purple",
      "fuchsia",
      "pink",
      "rose",
    ];

    for (const [input, expected] of inputStrings.map((e, i) => [e, expectedStrings[i]])) {
      const actual = hashToTailwindColor(input);

      expect.strictEqual(actual, expected);
    }
  });
})