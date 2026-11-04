import { test, expect } from "@playwright/test";
import { HAS_ALERTS, filterQuery, hasTag, urlFilterModel } from "./filterUrl.js";

test("has dependency info", async ({ page, baseURL }) => {
  const response = await page.goto(baseURL);
  expect(response.request().redirectedFrom()?.url()).toBe(`${baseURL}/`);
  await expect(page).toHaveURL(`${baseURL}/dxw`);
  await expect(page).toHaveTitle(/Towtruck/);

  await expect(page.getByText("repos tracked")).toBeVisible();

  await testSortingForColumn(
    {
      name: "Open issues",
      ascValue: "openIssues",
      descValue: "openIssues",
      topAscending: "govuk-blogs",
      topDescending: "optionparser",
    },
    page
  );

  await testSortingForColumn(
    {
      name: "Open bot PRs",
      ascValue: "openBotPrCount",
      descValue: "openBotPrCount",
      topAscending: "optionparser",
      topDescending: "govuk-blogs",
    },
    page
  );

  await testSortingForColumn(
    {
      name: "Open PRs",
      ascValue: "openPrCount",
      descValue: "openPrCount",
      topAscending: "optionparser",
      topDescending: "php-missing",
    },
    page
  );

  await testSortingForColumn(
    {
      name: "Updated at",
      ascValue: "updatedAt",
      descValue: "updatedAt",
      topAscending: "optionparser",
      topDescending: "govuk-blogs",
    },
    page
  );

  await testSortingForColumn(
    {
      name: "Most recent non-bot commit",
      ascValue: "mostRecentNonBotCommitAt",
      descValue: "mostRecentNonBotCommitAt",
      topAscending: "php-missing",
      topDescending: "govuk-blogs",
    },
    page
  );
});

const testSortingForColumn = async (
  { ascValue, descValue, topAscending, topDescending },
  page
) => {
  await page.goto(`/dxw?sortBy=${ascValue}&sortDirection=asc`);
  await assertFirstRow(topAscending, page);

  await page.goto(`/dxw?sortBy=${descValue}&sortDirection=desc`);
  await assertFirstRow(topDescending, page);
};

test("does not show a sort dropdown in the filter bar", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  await expect(page.getByTestId("filter-row")).toBeVisible();
  await expect(page.getByTestId("sort-controls")).toHaveCount(0);
  await expect(page.getByTestId("filter-row").locator("select")).toHaveCount(0);
});

const assertFirstRow = async (expectedRepoName, page) => {
  const firstRowName = page.getByTestId("repo-grid").locator(".ag-row[row-index='0'] [col-id='name']");
  await expect(firstRowName).toHaveText(expectedRepoName);
};

test("shows every repo in an AG Grid table with the expected columns", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  const grid = page.getByTestId("repo-grid");
  await expect(grid.locator(".ag-root")).toBeVisible();

  for (const header of [
    "Repo",
    "Description",
    "Language",
    "Visibility",
    "Open PRs",
    "Open bot PRs",
    "Oldest open PR",
    "Updated at",
    "Most recent non-bot commit",
    "Most recent PR",
    "Most recent issue",
    "Oldest open issue",
    "Open issues",
    "Runtime vulnerabilities",
    "Dev vulnerabilities",
    "End of life",
    "Tags",
    "Likely owner",
    "Responsible team",
    "Runtime vulnerability > 14 days old",
  ]) {
    await expect(grid.locator(".ag-header-cell-text, .ag-header-group-text", { hasText: header }).first()).toBeAttached();
  }

  const repoNames = await page.locator("[col-id='name'].ag-cell").allTextContents();
  const totalRepos = Number((await page.getByText("repos tracked").textContent()).match(/\d+/)[0]);
  expect(repoNames).toHaveLength(totalRepos);
  expect(repoNames).toEqual(expect.arrayContaining(["optionparser", "php-missing", "govuk-blogs"]));

  await expect(grid.getByRole("link", { name: "optionparser" })).toHaveAttribute("href", /github\.com/);
  await expect(
    grid.locator("[col-id='description'].ag-cell", { hasText: "Command-line option parser for PHP" })
  ).toBeVisible();

  // The pinned repo column is rendered in a separate row element, so match the rows up by index
  const visibilityFor = async (repoName) => {
    const rowIndex = await grid.locator(".ag-row", { has: page.getByRole("link", { name: repoName }) }).getAttribute("row-index");
    return grid.locator(`.ag-row[row-index='${rowIndex}'] [col-id='visibility']`);
  };
  await expect(await visibilityFor("optionparser")).toHaveText("Public");
  await expect(await visibilityFor("php-missing")).toHaveText("Private");

  const ownerFor = async (repoName) => {
    const rowIndex = await grid.locator(".ag-row", { has: page.getByRole("link", { name: repoName }) }).getAttribute("row-index");
    return grid.locator(`.ag-row[row-index='${rowIndex}'] [col-id='owner']`);
  };
  const govukBlogsOwner = await ownerFor("govuk-blogs");
  await expect(govukBlogsOwner).toHaveText("Ada Lovelace");
  await expect(govukBlogsOwner.getByRole("link", { name: "Ada Lovelace" })).toHaveAttribute("href", "https://github.com/ada");
  await expect(await ownerFor("php-missing")).toHaveText("Grace Hopper");
  await expect((await ownerFor("php-missing")).getByRole("link")).toHaveCount(0);
  await expect(await ownerFor("optionparser")).toHaveText("\u2014");

  // Sorting by a column header reorders rows client-side
  const openIssuesHeader = grid.locator(".ag-header-cell[col-id='openIssues']");
  const firstRowName = grid.locator(".ag-row[row-index='0'] [col-id='name']");
  await expect(firstRowName).toHaveText("govuk-blogs");
  await openIssuesHeader.click();
  await openIssuesHeader.click();
  await expect(openIssuesHeader).toHaveAttribute("aria-sort", "descending");
  await expect(firstRowName).toHaveText("optionparser");
});

const expectColumnFiltered = (page, colId) =>
  expect(page.getByTestId("repo-grid").locator(`.ag-header-cell[col-id='${colId}']`)).toHaveClass(/ag-header-cell-filtered/);

const expectColumnNotFiltered = (page, colId) =>
  expect(page.getByTestId("repo-grid").locator(`.ag-header-cell[col-id='${colId}']`)).not.toHaveClass(/ag-header-cell-filtered/);

test("applies the filters in the URL to the table", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw?${filterQuery({ tags: hasTag("wordpress-theme") })}`);

  const grid = page.getByTestId("repo-grid");
  await expect(grid.locator("[col-id='name'].ag-cell")).toHaveText(["govuk-blogs"]);
  await expect(grid.getByRole("button", { name: "wordpress-theme" })).toHaveAttribute("aria-pressed", "true");
  await expectColumnFiltered(page, "tags");
});

test("keeps filters set from a column's menu in the URL", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  const grid = page.getByTestId("repo-grid");
  const repoNames = grid.locator("[col-id='name'].ag-cell");
  await expect(repoNames).toHaveCount(3);

  await grid.locator(".ag-header-cell[col-id='name']").hover();
  await grid.locator(".ag-header-cell[col-id='name'] .ag-header-cell-filter-button").click();
  await page.locator(".ag-filter").getByRole("textbox").first().fill("govuk-blogs");

  await expect(repoNames).toHaveText(["govuk-blogs"]);
  await expect.poll(() => urlFilterModel(page)).toEqual({ name: { filterType: "text", type: "contains", filter: "govuk-blogs" } });

  await page.reload();
  await expect(repoNames).toHaveText(["govuk-blogs"]);
  await expectColumnFiltered(page, "name");
});

test("the alert buttons toggle a filter on the runtime vulnerability columns", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  const repoNames = page.getByTestId("repo-grid").locator("[col-id='name'].ag-cell");
  const criticalOnly = page.getByRole("button", { name: "Runtime critical only" });
  const anyAlerts = page.getByRole("button", { name: "Any runtime alerts" });
  await expect(repoNames).toHaveCount(3);

  // None of the seeded test repos have runtime vulnerability counts, so nothing should be shown
  await anyAlerts.click();
  await expect.poll(() => urlFilterModel(page)).toEqual({ runtimeTotal: HAS_ALERTS });
  await expect(anyAlerts).toHaveAttribute("aria-pressed", "true");
  await expectColumnFiltered(page, "runtimeTotal");
  await expect(repoNames).toHaveCount(0);

  await criticalOnly.click();
  await expect.poll(() => urlFilterModel(page)).toEqual({ runtimeCritical: HAS_ALERTS });
  await expect(anyAlerts).toHaveAttribute("aria-pressed", "false");
  await expect(criticalOnly).toHaveAttribute("aria-pressed", "true");
  await expectColumnNotFiltered(page, "runtimeTotal");
  await expectColumnFiltered(page, "runtimeCritical");

  await criticalOnly.click();
  await expect(page).not.toHaveURL(/filter=/);
  await expectColumnNotFiltered(page, "runtimeCritical");
  await expect(repoNames).toHaveCount(3);
});

test("clicking a tag in the table toggles the tag filter", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  const grid = page.getByTestId("repo-grid");
  const repoNames = grid.locator("[col-id='name'].ag-cell");
  const tag = grid.getByRole("button", { name: "wordpress-theme" });
  await expect(repoNames).toHaveCount(3);

  await tag.click();
  await expect.poll(() => urlFilterModel(page)).toEqual({ tags: hasTag("wordpress-theme") });
  await expect(tag).toHaveAttribute("aria-pressed", "true");
  await expectColumnFiltered(page, "tags");
  await expect(repoNames).toHaveText(["govuk-blogs"]);

  await tag.click();
  await expect(page).not.toHaveURL(/filter=/);
  await expectColumnNotFiltered(page, "tags");
  await expect(repoNames).toHaveCount(3);
});

test("the No tags button toggles filtering to repos without tags", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw?${filterQuery({ tags: hasTag("wordpress-theme") })}`);

  const repoNames = page.getByTestId("repo-grid").locator("[col-id='name'].ag-cell");
  const untaggedFilter = page.getByRole("button", { name: "No tags" });
  const noTags = { filterType: "text", type: "blank" };
  await expect(repoNames).toHaveText(["govuk-blogs"]);

  // Every seeded test repo has tags, so this shouldn't add any repos to the selected tag's
  await untaggedFilter.click();
  await expect.poll(() => urlFilterModel(page)).toEqual({
    tags: { filterType: "text", operator: "OR", conditions: [hasTag("wordpress-theme"), noTags] },
  });
  await expect(untaggedFilter).toHaveAttribute("aria-pressed", "true");
  await expect(repoNames).toHaveText(["govuk-blogs"]);

  await page.getByTestId("repo-grid").getByRole("button", { name: "wordpress-theme" }).click();
  await expect.poll(() => urlFilterModel(page)).toEqual({ tags: noTags });
  await expect(repoNames).toHaveCount(0);

  await untaggedFilter.click();
  await expect(page).not.toHaveURL(/filter=/);
  await expect(untaggedFilter).toHaveAttribute("aria-pressed", "false");
  await expect(repoNames).toHaveCount(3);
});

test("the Reset filters button clears every filter and is only shown while there are filters", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw?${filterQuery({
    runtimeTotal: HAS_ALERTS,
    tags: hasTag("wordpress-theme"),
    name: { filterType: "text", type: "contains", filter: "govuk" },
  })}`);

  const repoNames = page.getByTestId("repo-grid").locator("[col-id='name'].ag-cell");
  const resetFilters = page.getByTestId("filter-row").getByRole("button", { name: "Reset filters" });
  await expect(repoNames).toHaveCount(0);

  await resetFilters.click();
  await expect(page).not.toHaveURL(/filter=/);
  await expect(page.getByRole("button", { name: "Any runtime alerts" })).toHaveAttribute("aria-pressed", "false");
  for (const colId of ["runtimeTotal", "tags", "name"]) await expectColumnNotFiltered(page, colId);
  await expect(repoNames).toHaveCount(3);
  await expect(resetFilters).toBeHidden();
});

const DATE_COLUMN_IDS = ["oldestOpenPrOpenedAt", "updatedAt", "mostRecentNonBotCommitAt", "mostRecentPrOpenedAt", "mostRecentIssueOpenedAt", "oldestOpenIssueOpenedAt"];

test("shows dates in the table as MMM YYYY", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  const grid = page.getByTestId("repo-grid");
  await expect(grid.locator(".ag-root")).toBeVisible();

  for (const colId of DATE_COLUMN_IDS) {
    const cells = grid.locator(`[col-id='${colId}'].ag-cell`);
    await expect(cells).toHaveCount(3);
    for (const cell of await cells.all()) {
      await expect(cell).toHaveText(/^([A-Z][a-z]{2} \d{4}|\u2014)$/);
    }
  }
});

test("right aligns the date columns", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  const grid = page.getByTestId("repo-grid");
  await expect(grid.locator(".ag-root")).toBeVisible();

  for (const colId of DATE_COLUMN_IDS) {
    await expect(grid.locator(`.ag-header-cell[col-id='${colId}']`)).toHaveClass(/ag-right-aligned-header/);

    const cells = grid.locator(`[col-id='${colId}'].ag-cell`);
    await expect(cells).toHaveCount(3);
    for (const cell of await cells.all()) {
      await expect(cell).toHaveClass(/ag-right-aligned-cell/);
    }
  }
});

test("shows the date of the most recent non-bot commit", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  const grid = page.getByTestId("repo-grid");
  await expect(grid.locator(".ag-root")).toBeVisible();
  // The pinned repo column is rendered in a separate row element, so match the rows up by index
  const commitDateFor = async (repoName) => {
    const rowIndex = await grid.locator(".ag-row", { has: page.getByRole("link", { name: repoName }) }).getAttribute("row-index");
    return grid.locator(`.ag-row[row-index='${rowIndex}'] [col-id='mostRecentNonBotCommitAt']`);
  };

  await expect(await commitDateFor("govuk-blogs")).toHaveText("Aug 2024");
  await expect(await commitDateFor("php-missing")).toHaveText("Nov 2023");
  await expect(await commitDateFor("optionparser")).toHaveText("\u2014");
});

test("shows a placeholder in the end of life column when no dependencies are affected", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  const endOfLifeCells = page.getByTestId("repo-grid").locator("[col-id='endOfLifeDependencies'].ag-cell");
  await expect(endOfLifeCells).toHaveText(["\u2014", "\u2014", "\u2014"]);
});
