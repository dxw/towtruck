import { describe, it } from "node:test";
import assert from "node:assert";
import { filterByAlerts } from "./alertFiltering.js";

describe("filterByAlerts", () => {
  const repos = [
    { name: "repo1", criticalSeverityAlerts: 2, totalOpenAlerts: 5 },
    { name: "repo2", criticalSeverityAlerts: 0, totalOpenAlerts: 3 },
    { name: "repo3", criticalSeverityAlerts: 1, totalOpenAlerts: 1 },
    { name: "repo4", criticalSeverityAlerts: 0, totalOpenAlerts: 0 },
  ];

  it("returns all repos when no filter is provided", () => {
    const result = filterByAlerts(repos, null);
    assert.strictEqual(result.length, 4);
    assert.deepStrictEqual(result, repos);
  });

  it("returns all repos when empty string filter is provided", () => {
    const result = filterByAlerts(repos, "");
    assert.strictEqual(result.length, 4);
  });

  it("filters repos with critical alerts only", () => {
    const result = filterByAlerts(repos, "criticalOnly");
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].name, "repo1");
    assert.strictEqual(result[1].name, "repo3");
  });

  it("filters repos with any open alerts", () => {
    const result = filterByAlerts(repos, "anyAlerts");
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].name, "repo1");
    assert.strictEqual(result[1].name, "repo2");
    assert.strictEqual(result[2].name, "repo3");
  });

  it("returns empty array when filtering by critical alerts and none exist", () => {
    const reposNoCritical = [
      { name: "repo1", criticalSeverityAlerts: 0, totalOpenAlerts: 2 },
      { name: "repo2", criticalSeverityAlerts: 0, totalOpenAlerts: 1 },
    ];
    const result = filterByAlerts(reposNoCritical, "criticalOnly");
    assert.strictEqual(result.length, 0);
  });

  it("returns empty array when filtering by any alerts and none exist", () => {
    const reposNoAlerts = [
      { name: "repo1", criticalSeverityAlerts: 0, totalOpenAlerts: 0 },
      { name: "repo2", criticalSeverityAlerts: 0, totalOpenAlerts: 0 },
    ];
    const result = filterByAlerts(reposNoAlerts, "anyAlerts");
    assert.strictEqual(result.length, 0);
  });

  it("returns empty array for unknown filter type", () => {
    const result = filterByAlerts(repos, "unknown");
    assert.strictEqual(result.length, 4);
  });

  it("handles repos without alert properties", () => {
    const reposWithout = [
      { name: "repo1" },
      { name: "repo2", criticalSeverityAlerts: 1 },
    ];
    const result = filterByAlerts(reposWithout, "criticalOnly");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, "repo2");
  });
});

