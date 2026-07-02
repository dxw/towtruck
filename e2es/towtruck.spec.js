import { test, expect } from "@playwright/test";

test("has dependency info", async ({ page, baseURL }) => {
  // Home page lists orgs
  await page.goto(baseURL);
  await expect(page).toHaveTitle(/Towtruck/);

  // Navigate to the dxw org page
  await page.getByRole("link", { name: "dxw" }).click();
  await expect(page).toHaveTitle(/Towtruck/);

  await expect(page.getByText("There are 3 repositories that Towtruck is tracking for dxw.")).toBeVisible();

  await testSortingForColumn(
    {
      name: "Open issues",
      topAscending: "govuk-blogs",
      topDescending: "optionparser",
    },
    page
  );

  await testSortingForColumn(
    {
      name: "Open bot PRs",
      topAscending: "optionparser",
      topDescending: "govuk-blogs",
    },
    page
  );

  await testSortingForColumn(
    {
      name: "Open PRs",
      topAscending: "optionparser",
      topDescending: "php-missing",
    },
    page
  );

  await testSortingForColumn(
    {
      name: "Updated at",
      topAscending: "optionparser",
      topDescending: "govuk-blogs",
    },
    page
  );
});

const testSortingForColumn = async (
  { name, topAscending, topDescending },
  page
) => {
  await page.getByRole("link", { name, exact: true }).first().click();
  await assertFirstCard(topAscending, page);

  await page.getByRole("link", { name, exact: true }).first().click();
  await assertFirstCard(topDescending, page);
};

const assertFirstCard = async (expectedRepoName, page) => {
  const firstCard = page.locator(".grid > div").first();
  await expect(firstCard).toContainText(expectedRepoName);
};
