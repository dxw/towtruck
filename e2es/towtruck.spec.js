import { test, expect } from "@playwright/test";

test("has dependency info", async ({ page, baseURL }) => {
  await page.goto(baseURL);

  await expect(page).toHaveTitle(/Towtruck/);

  page.getByText("There are 3 repositories that Towtruck is tracking for dxw.");

  const tableHeadings = [
    "Name",
    "Description",
    "Language",
    "Last Updated",
    "Open issues count",
    "Open PRs count",
    "Dependencies",
  ];
  tableHeadings.forEach((heading) => {
    page.getByRole("columnheader", { name: heading });
  });
});
