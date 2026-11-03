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
});

const testSortingForColumn = async (
  { ascValue, descValue, topAscending, topDescending },
  page
) => {
  const sortSelect = page.getByTestId("sort-controls").locator("select");

  // Select ascending
  const ascUrl = await sortSelect.locator(`option[value*="sortBy=${ascValue}"][value*="sortDirection=asc"]`).getAttribute("value");
  await sortSelect.selectOption(ascUrl);
  await assertFirstRow(topAscending, page);

  // Select descending
  const descUrl = await sortSelect.locator(`option[value*="sortBy=${descValue}"][value*="sortDirection=desc"]`).getAttribute("value");
  await sortSelect.selectOption(descUrl);
  await assertFirstRow(topDescending, page);
};

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
    "Language",
    "Open PRs",
    "Open bot PRs",
    "Oldest open PR",
    "Updated at",
    "Most recent PR",
    "Most recent issue",
    "Oldest open issue",
    "Open issues",
    "Prod vulnerabilities",
    "Dev vulnerabilities",
    "End of life",
    "Tags",
    "Responsible team",
    "Prod vulnerability > 14 days old",
  ]) {
    await expect(grid.locator(".ag-header-cell-text, .ag-header-group-text", { hasText: header }).first()).toBeAttached();
  }

  const repoNames = await page.locator("[col-id='name'].ag-cell").allTextContents();
  const totalRepos = Number((await page.getByText("repos tracked").textContent()).match(/\d+/)[0]);
  expect(repoNames).toHaveLength(totalRepos);
  expect(repoNames).toEqual(expect.arrayContaining(["optionparser", "php-missing", "govuk-blogs"]));

  await expect(grid.getByRole("link", { name: "optionparser" })).toHaveAttribute("href", /github\.com/);

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

test("shows a placeholder in the end of life column when no dependencies are affected", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  const endOfLifeCells = page.getByTestId("repo-grid").locator("[col-id='endOfLifeDependencies'].ag-cell");
  await expect(endOfLifeCells).toHaveText(["\u2014", "\u2014", "\u2014"]);
});
