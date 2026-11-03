import { test, expect } from "@playwright/test";

test("Publishing mode shows only repos marked govpress", async ({ page, baseURL }) => {
  await page.goto(baseURL);
  await expect(page).toHaveURL(`${baseURL}/dxw`);

  // Navigate to Publishing mode
  await page.getByRole("link", { name: "Publishing mode" }).click();

  // Should display the Publishing info banner
  await expect(page.getByText("This dashboard shows only repos marked Publishing.")).toBeVisible();

  // Should show an "Exit Publishing mode" button
  await expect(page.getByRole("link", { name: "Exit Publishing mode" })).toBeVisible();

  // Should show repos that are tagged "govpress"
  await expect(page.getByRole("link", { name: "govuk-blogs" })).toBeVisible();
});

test("Publishing mode can be exited back to normal view", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw/publishing`);

  await page.getByRole("link", { name: "Exit Publishing mode" }).click();

  // Should be back on the normal org page
  await expect(page.getByText("repos tracked")).toBeVisible();

  // Should show both D+ mode and Publishing mode buttons
  await expect(page.getByRole("link", { name: "D+ mode" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Publishing mode" })).toBeVisible();
});

