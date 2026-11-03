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
