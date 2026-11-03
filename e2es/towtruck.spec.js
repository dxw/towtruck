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
  await assertFirstCard(topAscending, page);

  // Select descending
  const descUrl = await sortSelect.locator(`option[value*="sortBy=${descValue}"][value*="sortDirection=desc"]`).getAttribute("value");
  await sortSelect.selectOption(descUrl);
  await assertFirstCard(topDescending, page);
};

const assertFirstCard = async (expectedRepoName, page) => {
  const firstCard = page.locator("#card-view > div").first();
  await expect(firstCard).toContainText(expectedRepoName);
};

test("only shows the security alert details toggle when there are alerts to show", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  const cardFor = (repoName) => page.locator("#card-view > div").filter({ hasText: repoName });

  await expect(cardFor("optionparser").getByText("Show security alert details")).toBeVisible();
  await expect(cardFor("php-missing").getByText("Show security alert details")).toHaveCount(0);
  await expect(cardFor("php-missing").locator("details.group\\/alerts")).toHaveCount(0);
});

test("table view shows every repo in an AG Grid table with the expected columns", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);
  await page.getByRole("button", { name: "Table view" }).click();

  await expect(page).toHaveURL(/view=rows/);
  await expect(page.locator("#card-view")).toHaveCount(0);

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

  // The preference persists, and switching back to cards works
  await page.goto(`${baseURL}/dxw`);
  await expect(page).toHaveURL(/view=rows/);
  await page.getByRole("button", { name: "Card view" }).click();
  await expect(page.locator("#card-view")).toBeVisible();
  await expect(page).not.toHaveURL(/view=rows/);
});
