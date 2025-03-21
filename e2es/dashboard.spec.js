import { test, expect } from "@playwright/test";
import { getAuthFile } from "./auth.js";

test.describe(() => {
  test.use({ storageState: getAuthFile('test-user-1') });

  test("shows expected info for a user with access", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/orgs/test-org`);
  
    await expect(page).toHaveTitle(/Towtruck/);

    expect(await page.getByText("There are 3 repositories that Towtruck is tracking for test-org.").count()).toBe(1);
  
    const tableHeadings = [
      "Repository",
      "Open issues count",
      "Open bot PR count",
      "Open PR count",
      "Updated at",
      "Most recent PR opened",
      "Oldest open PR opened",
      "Most recent issue opened",
      "Oldest open issue opened"
    ];

    for (const heading of tableHeadings) {
      expect(await page.getByRole("columnheader", { name: heading }).count()).toBe(1);
    }
  });

  test("sorting by column works as expected", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/orgs/test-org`);
  
    await testSortingForColumn(
      {
        name: "Open issues count",
        topAscending: "govuk-blogs",
        topDescending: "optionparser",
      },
      page
    );
  
    await testSortingForColumn(
      {
        name: "Open bot PR count",
        topAscending: "optionparse",
        topDescending: "govuk-blogs",
      },
      page
    );
  
    await testSortingForColumn(
      {
        name: "Open PR count",
        topAscending: "optionparser",
        topDescending: "php-missing",
      },
      page
    );
  
    await testSortingForColumn(
      {
        name: "Updated at",
        topAscending: "optionparser",
        topDescending: "govuk-blogs ",
      },
      page
    );
  });

  const testSortingForColumn = async (
    { name, topAscending, topDescending },
    page
  ) => {
    await page.getByRole("link", { name, exact: true }).click();
    await assertFirstDependencyRow(topAscending, page);
  
    await page.getByRole("link", { name, exact: true }).click();
    await assertFirstDependencyRow(topDescending, page);
  };
  
  const assertFirstDependencyRow = async (expectedFirstDependency, page) => {
    const firstDependencyRow = page.getByRole("row").nth(1);
    await expect(firstDependencyRow).toContainText(expectedFirstDependency);
  };
});

test.describe(() => {
  test.use({ storageState: getAuthFile('test-user-2') });

  test("displays a 404 page for an unauthorised user", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/orgs/test-org`);
  
    await expect(page).toHaveTitle(/Towtruck/);

    expect(await page.getByText(/The requested page .* could not be found./).count()).toBe(1);

    expect(await page.getByText("There are 3 repositories that Towtruck is tracking for test-org.").count()).toBe(0);
  });
});
