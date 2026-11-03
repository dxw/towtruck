import { test, expect } from "@playwright/test";

test("Publishing mode shows only repos marked govpress", async ({ page, baseURL }) => {
  await page.goto(baseURL);
  await expect(page).toHaveURL(`${baseURL}/dxw`);

  // Navigate to Publishing mode
  await page.getByRole("link", { name: "Only Publishing" }).click();
  await expect(page).toHaveURL(`${baseURL}/dxw/publishing`);

  // Should display the Publishing info banner
  await expect(page.getByText("This dashboard shows only repos marked Publishing.")).toBeVisible();

  // Should show repos that are tagged "govpress"
  await expect(page.getByRole("link", { name: "govuk-blogs" })).toBeVisible();
});

test("Publishing mode can be toggled off back to normal view", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw/publishing`);

  await page.getByRole("link", { name: "Only Publishing" }).click();

  // Should be back on the normal org page
  await expect(page).toHaveURL(`${baseURL}/dxw`);
  await expect(page.getByText("This dashboard shows only repos marked Publishing.")).toBeHidden();
});

test("mode filters are shown alongside the other filters", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  for (const name of ["Only D+", "Only Publishing", "Only Ops"]) {
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  }
});
