import { test, expect } from "@playwright/test";

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

  // Sorting by a column header reorders rows client-side
  const openIssuesHeader = grid.locator(".ag-header-cell[col-id='openIssues']");
  const firstRowName = grid.locator(".ag-row[row-index='0'] [col-id='name']");
  await expect(firstRowName).toHaveText("govuk-blogs");
  await openIssuesHeader.click();
  await openIssuesHeader.click();
  await expect(openIssuesHeader).toHaveAttribute("aria-sort", "descending");
  await expect(firstRowName).toHaveText("optionparser");
});

test("clicking a tag in the table toggles the tag filter", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  const grid = page.getByTestId("repo-grid");
  const repoNames = grid.locator("[col-id='name'].ag-cell");
  await expect(repoNames).toHaveCount(3);

  await grid.getByRole("link", { name: "wordpress-theme" }).click();
  await expect(page).toHaveURL(/tag=wordpress-theme/);
  await expect(repoNames).toHaveText(["govuk-blogs"]);

  await grid.getByRole("link", { name: "wordpress-theme" }).click();
  await expect(page).not.toHaveURL(/tag=/);
  await expect(repoNames).toHaveCount(3);
});

test("the No tags button toggles filtering to repos without tags", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw?alertFilter=anyAlerts`);

  const grid = page.getByTestId("repo-grid");
  const repoNames = grid.locator("[col-id='name'].ag-cell");
  const untaggedFilter = page.getByTestId("untagged-filter");
  await expect(grid.locator(".ag-root")).toBeVisible();
  const countWithAlerts = await repoNames.count();
  expect(countWithAlerts).toBeGreaterThan(0);

  // Every seeded test repo has tags, so nothing should be shown
  await untaggedFilter.click();
  await expect(page).toHaveURL(/tag=_untagged/);
  await expect(page).toHaveURL(/alertFilter=anyAlerts/);
  await expect(repoNames).toHaveCount(0);

  await untaggedFilter.click();
  await expect(page).not.toHaveURL(/tag=/);
  await expect(page).toHaveURL(/alertFilter=anyAlerts/);
  await expect(repoNames).toHaveCount(countWithAlerts);
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
