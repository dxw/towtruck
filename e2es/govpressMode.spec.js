import { test, expect } from "@playwright/test";

test("GovPress mode shows only repos marked govpress", async ({ page, baseURL }) => {
  await page.goto(baseURL);
  await page.getByRole("link", { name: "dxw" }).click();

  // Navigate to GovPress mode
  await page.getByRole("link", { name: "GovPress mode" }).click();

  // Should display the GovPress info banner
  await expect(page.getByText("This dashboard shows only repos marked GovPress.")).toBeVisible();

  // Should show an "Exit GovPress mode" button
  await expect(page.getByRole("link", { name: "Exit GovPress mode" })).toBeVisible();

  // Should show repos that are tagged "govpress"
  await expect(page.getByRole("link", { name: "govuk-blogs" })).toBeVisible();
});

test("GovPress mode can be exited back to normal view", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw/govpress`);

  await page.getByRole("link", { name: "Exit GovPress mode" }).click();

  // Should be back on the normal org page
  await expect(page.getByText("Towtruck is tracking for dxw")).toBeVisible();

  // Should show both D+ mode and GovPress mode buttons
  await expect(page.getByRole("link", { name: "D+ mode" })).toBeVisible();
  await expect(page.getByRole("link", { name: "GovPress mode" })).toBeVisible();
});

