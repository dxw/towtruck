import { test, expect } from "@playwright/test";

test("has dependency info", async ({ page, baseURL }) => {
  await page.goto(baseURL);

  await expect(page).toHaveTitle(/Towtruck/);

  expect(await page.getByText("There is 1 organisation using Towtruck that you are a member of.").count()).toBe(1);

  await page.getByRole("link", { name: "dxw", exact: true }).click();

  expect(await page.getByText("There are 3 repositories that Towtruck is tracking for dxw.").count()).toBe(1);

  const tableHeadings = [
    "Name",
    "Description",
    "Language",
    "Last Updated",
    "Open issues count",
    "Open PR count",
    "Dependencies",
  ];
  tableHeadings.forEach((heading) => {
    expect(page.getByRole("columnheader", { name: heading })).toBeTruthy();
  });

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
