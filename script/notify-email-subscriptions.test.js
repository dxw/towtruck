import { describe, it } from "node:test";
import assert from "node:assert";
import { getMatchingRepos, buildEmailBody } from "./notify-email-subscriptions.js";

describe("getMatchingRepos", () => {
  const allRepos = [
    { name: "repo-a", topics: ["govpress", "wordpress"], criticalSeverityAlerts: 2, totalOpenAlerts: 5 },
    { name: "repo-b", topics: ["delivery-plus"], criticalSeverityAlerts: 0, totalOpenAlerts: 1 },
    { name: "repo-c", topics: ["govpress"], criticalSeverityAlerts: 1, totalOpenAlerts: 3 },
    { name: "repo-d", topics: ["internal"], criticalSeverityAlerts: 0, totalOpenAlerts: 0 },
  ];

  it("returns repos matching selected tags", () => {
    const subscription = { tags: ["govpress"], criticalAlerts: false };
    const result = getMatchingRepos(subscription, allRepos);
    assert.deepStrictEqual(result.map((r) => r.name), ["repo-a", "repo-c"]);
  });

  it("returns repos with critical alerts when criticalAlerts is enabled", () => {
    const subscription = { tags: [], criticalAlerts: true };
    const result = getMatchingRepos(subscription, allRepos);
    assert.deepStrictEqual(result.map((r) => r.name), ["repo-a", "repo-c"]);
  });

  it("combines tag and critical alert filters without duplicates", () => {
    const subscription = { tags: ["delivery-plus"], criticalAlerts: true };
    const result = getMatchingRepos(subscription, allRepos);
    assert.deepStrictEqual(result.map((r) => r.name), ["repo-b", "repo-a", "repo-c"]);
  });

  it("returns empty array when no criteria match", () => {
    const subscription = { tags: ["nonexistent"], criticalAlerts: false };
    const result = getMatchingRepos(subscription, allRepos);
    assert.deepStrictEqual(result, []);
  });

  it("returns empty array when no criteria are set", () => {
    const subscription = { tags: [], criticalAlerts: false };
    const result = getMatchingRepos(subscription, allRepos);
    assert.deepStrictEqual(result, []);
  });
});

describe("buildEmailBody", () => {
  it("returns a no-match message when repos array is empty", () => {
    const subscription = { org: "dxw", tags: ["govpress"], criticalAlerts: false };
    const html = buildEmailBody(subscription, []);
    assert.ok(html.includes("No repos currently match"));
    assert.ok(html.includes("dxw"));
  });

  it("returns an HTML table when repos are provided", () => {
    const subscription = { org: "dxw", tags: ["govpress"], criticalAlerts: true };
    const repos = [
      {
        name: "my-repo",
        htmlUrl: "https://github.com/dxw/my-repo",
        criticalSeverityAlerts: 3,
        totalOpenAlerts: 7,
        openBotPrCount: 2,
        openPrCount: 4,
        topics: ["govpress", "wordpress"],
      },
    ];
    const html = buildEmailBody(subscription, repos);
    assert.ok(html.includes("Weekly Towtruck Report"));
    assert.ok(html.includes("my-repo"));
    assert.ok(html.includes("3 critical"));
    assert.ok(html.includes("7 total"));
    assert.ok(html.includes("2 bot PRs"));
    assert.ok(html.includes("govpress, wordpress"));
  });
});

