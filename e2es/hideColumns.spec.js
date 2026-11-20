import { test, expect } from "@playwright/test";
import { filterQuery, hasTag, hiddenQuery, urlHiddenColumns } from "./filterUrl.js";

const RUNTIME_COLUMNS = ["runtimeCritical", "runtimeHigh", "runtimeMedium", "runtimeLow", "runtimeTotal"];

const header = (page, colId) => page.getByTestId("repo-grid").locator(`.ag-header-cell[col-id='${colId}']`);

const openColumns = async (page) => {
  await page.getByText("Columns", { exact: true }).click();
  return page.locator("[data-column-chooser]");
};

test("unticking a column hides it and records it in the URL", async ({ page }) => {
  await page.goto("/dxw");
  await expect(header(page, "language")).toHaveCount(1);

  const chooser = await openColumns(page);
  await chooser.getByRole("checkbox", { name: "Language", exact: true }).uncheck();

  await expect(header(page, "language")).toHaveCount(0);
  await expect.poll(() => urlHiddenColumns(page)).toEqual(["language"]);

  await page.reload();
  await expect(header(page, "name")).toHaveCount(1);
  await expect(header(page, "language")).toHaveCount(0);
  await expect((await openColumns(page)).getByRole("checkbox", { name: "Language", exact: true })).not.toBeChecked();
});

test("Show all restores every column and drops hidden from the URL", async ({ page }) => {
  await page.goto(`/dxw?${hiddenQuery(["language", "owner"])}`);
  await expect(header(page, "language")).toHaveCount(0);
  await expect(header(page, "owner")).toHaveCount(0);

  const chooser = await openColumns(page);
  await chooser.getByRole("button", { name: "Show all" }).click();

  await expect(header(page, "language")).toHaveCount(1);
  await expect(header(page, "owner")).toHaveCount(1);
  await expect(page).not.toHaveURL(/hidden=/);
});

test("ignores unknown and unhideable IDs in hidden", async ({ page }) => {
  await page.goto("/dxw?hidden=name,bogus,language");

  await expect(header(page, "name")).toHaveCount(1);
  await expect(header(page, "language")).toHaveCount(0);
  await expect.poll(() => urlHiddenColumns(page)).toEqual(["language"]);
});

test("empty hidden shows every column", async ({ page }) => {
  await page.goto("/dxw?hidden=");

  await expect(header(page, "name")).toHaveCount(1);
  await expect(header(page, "language")).toHaveCount(1);
  await expect(page).not.toHaveURL(/hidden=/);
});

test("hiding a whole vulnerability group removes its header and survives reload", async ({ page }) => {
  const runtimeGroup = page.locator(".ag-header-group-cell", { hasText: "Runtime vulnerabilities" });
  await page.goto("/dxw");
  await expect(runtimeGroup).toHaveCount(1);

  const chooser = await openColumns(page);
  for (const severity of ["Critical", "High", "Medium", "Low", "Total"]) {
    await chooser.getByRole("checkbox", { name: `Runtime vulnerabilities ${severity}`, exact: true }).uncheck();
  }

  await expect(runtimeGroup).toHaveCount(0);
  await expect.poll(() => urlHiddenColumns(page).sort()).toEqual([...RUNTIME_COLUMNS].sort());

  await page.reload();
  await expect(header(page, "name")).toHaveCount(1);
  await expect(runtimeGroup).toHaveCount(0);
});

test("hidden and filter coexist; Reset filters keeps hidden", async ({ page }) => {
  await page.goto(`/dxw?${filterQuery({ tags: hasTag("wordpress-theme") })}&${hiddenQuery(["language"])}`);
  await expect(page.getByTestId("repo-grid").locator("[col-id='name'].ag-cell")).toHaveText(["govuk-blogs"]);
  await expect(header(page, "language")).toHaveCount(0);

  await page.getByRole("button", { name: "Reset filters" }).click();

  await expect(page).not.toHaveURL(/filter=/);
  await expect.poll(() => urlHiddenColumns(page)).toEqual(["language"]);
  await expect(header(page, "language")).toHaveCount(0);
});

test("Repo is not offered in the column chooser", async ({ page }) => {
  await page.goto("/dxw");

  const chooser = await openColumns(page);
  await expect(chooser.getByRole("checkbox", { name: "Language", exact: true })).toBeVisible();
  await expect(chooser.getByRole("checkbox", { name: "Repo", exact: true })).toHaveCount(0);
});

test("Repo stays pinned to the left when columns are hidden", async ({ page }) => {
  await page.goto(`/dxw?${hiddenQuery(["language"])}`);

  const repo = await header(page, "name").boundingBox();
  const description = await header(page, "description").boundingBox();
  expect(description.x).toBeGreaterThanOrEqual(repo.x + repo.width);
});
