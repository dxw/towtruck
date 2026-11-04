import { test, expect } from "@playwright/test";
import { filterQuery, hasTag, modeFilter, urlFilterModel } from "./filterUrl.js";

test("mode filters are shown alongside the other filters", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  for (const name of ["Only D+", "Only Publishing", "Only Ops"]) {
    await expect(page.getByTestId("filter-row").getByRole("button", { name, exact: true })).toBeVisible();
  }
});

test("the Only Publishing button toggles filtering to repos marked govpress", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  const grid = page.getByTestId("repo-grid");
  const repoNames = grid.locator("[col-id='name'].ag-cell");
  const publishingFilter = page.getByRole("button", { name: "Only Publishing" });

  await publishingFilter.click();
  await expect.poll(() => urlFilterModel(page)).toEqual({ tags: modeFilter("publishing") });
  await expect(publishingFilter).toHaveAttribute("aria-pressed", "true");
  await expect(grid.locator(".ag-header-cell[col-id='tags']")).toHaveClass(/ag-header-cell-filtered/);
  // Every seeded test repo is marked govpress
  await expect(repoNames).toHaveCount(3);

  await publishingFilter.click();
  await expect(page).not.toHaveURL(/filter=/);
  await expect(publishingFilter).toHaveAttribute("aria-pressed", "false");
  await expect(grid.locator(".ag-header-cell[col-id='tags']")).not.toHaveClass(/ag-header-cell-filtered/);
});

test("the Only D+ button filters to repos tagged dxw-delivery-plus", async ({ page, baseURL }) => {
  // None of the seeded test repos are D+ repos, so retag them in the served page
  await page.route(`${baseURL}/dxw`, async (route) => {
    const response = await route.fetch();
    const body = (await response.text())
      .replace('"tags":["govpress","wordpress-theme"]', '"tags":["dxw-delivery-plus"]')
      .replace('"tags":["composer","govpress","packagist","php"]', '"tags":["delivery-plus","internal"]');
    await route.fulfill({ response, body });
  });
  await page.goto(`${baseURL}/dxw`);

  const repoNames = page.getByTestId("repo-grid").locator("[col-id='name'].ag-cell");
  await expect(repoNames).toHaveCount(3);

  await page.getByRole("button", { name: "Only D+" }).click();
  await expect.poll(() => urlFilterModel(page)).toEqual({ tags: modeFilter("d-plus") });
  await expect(repoNames).toHaveText(["govuk-blogs"]);
});

test("choosing a mode replaces the other mode and tag filters", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw?${filterQuery({
    tags: { filterType: "text", operator: "OR", conditions: [modeFilter("publishing"), hasTag("wordpress-theme")] },
  })}`);

  const repoNames = page.getByTestId("repo-grid").locator("[col-id='name'].ag-cell");
  const publishingFilter = page.getByRole("button", { name: "Only Publishing" });
  const dPlusFilter = page.getByRole("button", { name: "Only D+" });
  await expect(publishingFilter).toHaveAttribute("aria-pressed", "true");

  // None of the seeded test repos are D+ repos
  await dPlusFilter.click();
  await expect.poll(() => urlFilterModel(page)).toEqual({ tags: modeFilter("d-plus") });
  await expect(publishingFilter).toHaveAttribute("aria-pressed", "false");
  await expect(dPlusFilter).toHaveAttribute("aria-pressed", "true");
  await expect(repoNames).toHaveCount(0);
});

test("choosing a tag replaces the mode filter", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw?${filterQuery({ tags: modeFilter("publishing") })}`);

  const repoNames = page.getByTestId("repo-grid").locator("[col-id='name'].ag-cell");
  await expect(repoNames).toHaveCount(3);

  await page.getByTestId("repo-grid").getByRole("button", { name: "wordpress-theme" }).click();
  await expect.poll(() => urlFilterModel(page)).toEqual({ tags: hasTag("wordpress-theme") });
  await expect(page.getByRole("button", { name: "Only Publishing" })).toHaveAttribute("aria-pressed", "false");
  await expect(repoNames).toHaveText(["govuk-blogs"]);
});
