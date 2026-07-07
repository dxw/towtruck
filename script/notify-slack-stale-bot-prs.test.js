import { describe, it } from "node:test";
import assert from "node:assert";
import { buildSlackPayload } from "./notify-slack-stale-bot-prs.js";

describe("buildSlackPayload", () => {
  it("returns null when there are no stale repos", () => {
    const payload = buildSlackPayload([]);

    assert.strictEqual(payload, null);
  });

  it("returns a warning message listing stale repos", () => {
    const staleRepos = [
      {
        name: "my-repo",
        mostRecentBotPrClosedAt: "01/01/24",
        htmlUrl: "https://github.com/dxw/my-repo",
      },
    ];

    const payload = buildSlackPayload(staleRepos);

    assert.ok(payload.text.includes("Stale Bot PRs Report"));
    assert.ok(payload.text.includes("1 repo has"));
    assert.ok(payload.text.includes("my-repo"));
    assert.ok(payload.text.includes("last bot PR closed: 01/01/24"));
  });

  it("pluralises correctly for multiple repos", () => {
    const staleRepos = [
      {
        name: "repo-a",
        mostRecentBotPrClosedAt: null,
        htmlUrl: "https://github.com/dxw/repo-a",
      },
      {
        name: "repo-b",
        mostRecentBotPrClosedAt: "15/03/24",
        htmlUrl: "https://github.com/dxw/repo-b",
      },
    ];

    const payload = buildSlackPayload(staleRepos);

    assert.ok(payload.text.includes("2 repos have"));
    assert.ok(payload.text.includes("repo-a"));
    assert.ok(payload.text.includes("last bot PR closed: never"));
    assert.ok(payload.text.includes("repo-b"));
    assert.ok(payload.text.includes("last bot PR closed: 15/03/24"));
  });

  it("shows never when mostRecentBotPrClosedAt is null", () => {
    const staleRepos = [
      {
        name: "no-closed",
        mostRecentBotPrClosedAt: null,
        htmlUrl: "https://github.com/dxw/no-closed",
      },
    ];

    const payload = buildSlackPayload(staleRepos);

    assert.ok(payload.text.includes("last bot PR closed: never"));
  });
});
