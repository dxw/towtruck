import { test, expect } from "@playwright/test";

const MARKUP_ORG = '"><b id="injected">x</b>';

test("escapes the org in saved configuration links", async ({ page }) => {
  const orgPath = `/${encodeURIComponent(MARKUP_ORG)}`;
  await page.request.post(`${orgPath}/saved-configurations`, { form: { name: "Escaping check" } });

  await page.goto(orgPath);
  const link = page.getByRole("link", { name: "Escaping check" });
  await expect(link).toHaveAttribute("href", orgPath);
  await expect(page.locator("#injected")).toHaveCount(0);

  await page.getByTitle("Delete").click();
  await expect(link).toHaveCount(0);
});

test("saving a configuration can't redirect off-site", async ({ page }) => {
  const response = await page.request.post("/%2Fevil.example/saved-configurations", {
    form: { name: "Redirect check" },
    maxRedirects: 0,
  });
  expect(response.headers().location).toMatch(/^\/%2Fevil\.example/);

  const deleteResponse = await page.request.post("/%2Fevil.example/saved-configurations/missing/delete", {
    form: {},
    maxRedirects: 0,
  });
  expect(deleteResponse.headers().location).toMatch(/^\/%2Fevil\.example/);
});
