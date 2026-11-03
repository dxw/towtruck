import { describe, it } from "node:test";
import expect from "node:assert";
import { mapRepoToGridRow, serialiseGridRows } from "./repoGrid.js";

const uiRepo = {
  name: "towtruck",
  htmlUrl: "https://github.com/dxw/towtruck",
  language: "JavaScript",
  topics: ["d-plus", "internal"],
  openPrCount: 3,
  openBotPrCount: 2,
  openIssues: 5,
  oldestOpenPrOpenedAt: "1 Jan 2026",
  oldestOpenPrOpenedAtISO8601: "2026-01-01T00:00:00Z",
  updatedAt: "2 Feb 2026",
  updatedAtISO8601: "2026-02-02T00:00:00Z",
  mostRecentPrOpenedAt: "3 Mar 2026",
  mostRecentPrOpenedAtISO8601: "2026-03-03T00:00:00Z",
  mostRecentIssueOpenedAt: "4 Apr 2026",
  mostRecentIssueOpenedAtISO8601: "2026-04-04T00:00:00Z",
  oldestOpenIssueOpenedAt: "5 May 2025",
  oldestOpenIssueOpenedAtISO8601: "2025-05-05T00:00:00Z",
  totalOpenAlerts: 6,
  prodAlerts: { critical: 1, high: 2, medium: 0, low: 1, total: 4 },
  devAlerts: { critical: 0, high: 0, medium: 1, low: 1, total: 2 },
  hasOpenProdAlertOlderThan14Days: true,
};

describe("mapRepoToGridRow", () => {
  it("maps a UI repo to a flat grid row", () => {
    expect.deepStrictEqual(mapRepoToGridRow(uiRepo), {
      name: "towtruck",
      htmlUrl: "https://github.com/dxw/towtruck",
      language: "JavaScript",
      openPrCount: 3,
      openBotPrCount: 2,
      oldestOpenPrOpenedAt: { iso: "2026-01-01T00:00:00Z", display: "1 Jan 2026" },
      updatedAt: { iso: "2026-02-02T00:00:00Z", display: "2 Feb 2026" },
      mostRecentPrOpenedAt: { iso: "2026-03-03T00:00:00Z", display: "3 Mar 2026" },
      mostRecentIssueOpenedAt: { iso: "2026-04-04T00:00:00Z", display: "4 Apr 2026" },
      oldestOpenIssueOpenedAt: { iso: "2025-05-05T00:00:00Z", display: "5 May 2025" },
      openIssues: 5,
      prodCritical: 1,
      prodHigh: 2,
      prodMedium: 0,
      prodLow: 1,
      prodTotal: 4,
      devCritical: 0,
      devHigh: 0,
      devMedium: 1,
      devLow: 1,
      devTotal: 2,
      tags: ["d-plus", "internal"],
      responsibleTeam: null,
      hasProdAlertOlderThan14Days: true,
    });
  });

  it("uses nulls for vulnerability fields when Dependabot data has no prod/dev split", () => {
    const repo = { ...uiRepo, prodAlerts: undefined, devAlerts: undefined, hasOpenProdAlertOlderThan14Days: undefined };
    const row = mapRepoToGridRow(repo);

    for (const field of ["prodCritical", "prodHigh", "prodMedium", "prodLow", "prodTotal", "devCritical", "devHigh", "devMedium", "devLow", "devTotal", "hasProdAlertOlderThan14Days"]) {
      expect.strictEqual(row[field], null, field);
    }
  });

  it("uses nulls for missing dates and an empty array for missing topics", () => {
    const row = mapRepoToGridRow({ name: "empty", htmlUrl: "https://github.com/dxw/empty" });

    expect.deepStrictEqual(row.oldestOpenPrOpenedAt, { iso: null, display: null });
    expect.deepStrictEqual(row.tags, []);
    expect.strictEqual(row.language, null);
    expect.strictEqual(row.openPrCount, null);
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
