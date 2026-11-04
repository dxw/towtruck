import { describe, it } from "node:test";
import expect from "node:assert";
import { mapRepoToGridRow, serialiseGridRows } from "./repoGrid.js";

const uiRepo = {
  name: "towtruck",
  htmlUrl: "https://github.com/dxw/towtruck",
  description: "Keeping on top of dxw's repos",
  language: "JavaScript",
  topics: ["d-plus", "internal"],
  openPrCount: 3,
  openBotPrCount: 2,
  openIssues: 5,
  oldestOpenPrOpenedAt: "1 Jan 2026",
  oldestOpenPrOpenedAtISO8601: "2026-01-01T00:00:00Z",
  updatedAt: "2 Feb 2026",
  updatedAtISO8601: "2026-02-02T00:00:00Z",
  mostRecentNonBotCommitAt: "6 Jun 2026",
  mostRecentNonBotCommitAtISO8601: "2026-06-06T00:00:00Z",
  mostRecentPrOpenedAt: "3 Mar 2026",
  mostRecentPrOpenedAtISO8601: "2026-03-03T00:00:00Z",
  mostRecentIssueOpenedAt: "4 Apr 2026",
  mostRecentIssueOpenedAtISO8601: "2026-04-04T00:00:00Z",
  oldestOpenIssueOpenedAt: "5 May 2025",
  oldestOpenIssueOpenedAtISO8601: "2025-05-05T00:00:00Z",
  totalOpenAlerts: 6,
  runtimeAlerts: { critical: 1, high: 2, medium: 0, low: 1, total: 4 },
  devAlerts: { critical: 0, high: 0, medium: 1, low: 1, total: 2 },
  hasOpenRuntimeAlertOlderThan14Days: true,
  dependencies: [
    { name: "node", version: "18.0.0", isOutOfSupport: true, isEndOfLifeSoon: false, endOfLifeDate: new Date("2025-04-30T00:00:00Z"), endOfLifeRelative: "7 months ago" },
    { name: "php", version: "8.2.0", isOutOfSupport: false, isEndOfLifeSoon: true, endOfLifeDate: new Date("2026-12-31T00:00:00Z"), endOfLifeRelative: "in about 2 months" },
    { name: "express", version: "5.0.0", isOutOfSupport: false, isEndOfLifeSoon: false, endOfLifeDate: null, endOfLifeRelative: null },
  ],
};

describe("mapRepoToGridRow", () => {
  it("maps a UI repo to a flat grid row", () => {
    expect.deepStrictEqual(mapRepoToGridRow(uiRepo), {
      name: "towtruck",
      htmlUrl: "https://github.com/dxw/towtruck",
      description: "Keeping on top of dxw's repos",
      language: "JavaScript",
      openPrCount: 3,
      openBotPrCount: 2,
      oldestOpenPrOpenedAt: { iso: "2026-01-01T00:00:00Z", display: "1 Jan 2026" },
      updatedAt: { iso: "2026-02-02T00:00:00Z", display: "2 Feb 2026" },
      mostRecentNonBotCommitAt: { iso: "2026-06-06T00:00:00Z", display: "6 Jun 2026" },
      mostRecentPrOpenedAt: { iso: "2026-03-03T00:00:00Z", display: "3 Mar 2026" },
      mostRecentIssueOpenedAt: { iso: "2026-04-04T00:00:00Z", display: "4 Apr 2026" },
      oldestOpenIssueOpenedAt: { iso: "2025-05-05T00:00:00Z", display: "5 May 2025" },
      openIssues: 5,
      runtimeCritical: 1,
      runtimeHigh: 2,
      runtimeMedium: 0,
      runtimeLow: 1,
      runtimeTotal: 4,
      devCritical: 0,
      devHigh: 0,
      devMedium: 1,
      devLow: 1,
      devTotal: 2,
      tags: ["d-plus", "internal"],
      responsibleTeam: null,
      hasRuntimeAlertOlderThan14Days: true,
      endOfLifeDependencies: [
        { name: "node", version: "18.0.0", status: "ended", date: "2025-04-30T00:00:00.000Z", relative: "7 months ago" },
        { name: "php", version: "8.2.0", status: "endingSoon", date: "2026-12-31T00:00:00.000Z", relative: "in about 2 months" },
      ],
    });
  });

  it("uses null for an empty description", () => {
    expect.strictEqual(mapRepoToGridRow({ ...uiRepo, description: "" }).description, null);
  });

  it("lists only dependencies that are out of support or reaching end of life soon", () => {
    const row = mapRepoToGridRow(uiRepo);

    expect.deepStrictEqual(row.endOfLifeDependencies.map((dependency) => dependency.name), ["node", "php"]);
  });

  it("uses null for a missing dependency version", () => {
    const repo = { ...uiRepo, dependencies: [{ name: "node", isOutOfSupport: true, isEndOfLifeSoon: false, endOfLifeDate: new Date("2025-04-30T00:00:00Z"), endOfLifeRelative: "7 months ago" }] };

    expect.strictEqual(mapRepoToGridRow(repo).endOfLifeDependencies[0].version, null);
  });

  it("uses nulls for vulnerability fields when Dependabot data has no runtime/dev split", () => {
    const repo = { ...uiRepo, runtimeAlerts: undefined, devAlerts: undefined, hasOpenRuntimeAlertOlderThan14Days: undefined };
    const row = mapRepoToGridRow(repo);

    for (const field of ["runtimeCritical", "runtimeHigh", "runtimeMedium", "runtimeLow", "runtimeTotal", "devCritical", "devHigh", "devMedium", "devLow", "devTotal", "hasRuntimeAlertOlderThan14Days"]) {
      expect.strictEqual(row[field], null, field);
    }
  });

  it("uses nulls for missing dates and an empty array for missing topics", () => {
    const row = mapRepoToGridRow({ name: "empty", htmlUrl: "https://github.com/dxw/empty" });

    expect.deepStrictEqual(row.oldestOpenPrOpenedAt, { iso: null, display: null });
    expect.deepStrictEqual(row.mostRecentNonBotCommitAt, { iso: null, display: null });
    expect.deepStrictEqual(row.tags, []);
    expect.strictEqual(row.language, null);
    expect.strictEqual(row.description, null);
    expect.strictEqual(row.openPrCount, null);
    expect.deepStrictEqual(row.endOfLifeDependencies, []);
  });
});

describe("serialiseGridRows", () => {
  it("returns JSON that parses back to grid rows", () => {
    expect.deepStrictEqual(JSON.parse(serialiseGridRows([uiRepo])), [mapRepoToGridRow(uiRepo)]);
  });

  it("escapes < so the output can't close an inline script element", () => {
    const output = serialiseGridRows([{ ...uiRepo, language: "</script><script>alert(1)</script>" }]);

    expect.ok(!output.includes("<"));
    expect.strictEqual(JSON.parse(output)[0].language, "</script><script>alert(1)</script>");
  });
});
