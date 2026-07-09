import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const authFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  ".auth/user.json"
);

/**
 * Signs in as the given email using the test session endpoint and navigates
 * to the dxw org page, returning the page ready for interaction.
 */
const signInAs = async (email, context, baseURL) => {
  // Use an API request context that shares cookies with the browser context
  await context.request.post(`${baseURL}/test/session`, {
    data: { email },
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/dxw`);
  return page;
};

test("saved configurations are only visible to the user who created them", async ({
  browser,
  baseURL,
}) => {
  const user1 = `${Math.floor(Math.random() * 1e10)}`;
  const user2 = `${Math.floor(Math.random() * 1e10)}`;

  const aliceContext = await browser.newContext({ storageState: authFile });
  const bobContext = await browser.newContext({ storageState: authFile });

  // Sign in as user1 and save a configuration
  const alicePage = await signInAs(`${user1}@dxw.com`, aliceContext, baseURL);
  const aliceSortSelect = alicePage.getByTestId("sort-controls").locator("select");
  const aliceSortUrl = await aliceSortSelect.locator('option[value*="sortBy=openIssues"]').first().getAttribute("value");
  await Promise.all([
    alicePage.waitForURL(/sortBy=openIssues/),
    aliceSortSelect.selectOption(aliceSortUrl),
  ]);
  await alicePage.getByText("Save configuration").click();
  await alicePage.locator('input[name="name"]').fill("User 1 config");
  await alicePage.getByRole("button", { name: "Save" }).click();

  // User 1 should see their own saved configuration
  await expect(alicePage.getByRole("link", { name: "User 1 config" }).first()).toBeVisible();

  // Sign in as user2 and save a configuration
  const bobPage = await signInAs(`${user2}@dxw.com`, bobContext, baseURL);
  const bobSortSelect = bobPage.getByTestId("sort-controls").locator("select");
  const bobSortUrl = await bobSortSelect.locator('option[value*="sortBy=openPrCount"]').first().getAttribute("value");
  await Promise.all([
    bobPage.waitForURL(/sortBy=openPrCount/),
    bobSortSelect.selectOption(bobSortUrl),
  ]);
  await bobPage.getByText("Save configuration").click();
  await bobPage.locator('input[name="name"]').fill("User 2 config");
  await bobPage.getByRole("button", { name: "Save" }).click();

  // User 2 should see their own saved configuration but NOT user 1's
  await expect(bobPage.getByRole("link", { name: "User 2 config" }).first()).toBeVisible();
  await expect(bobPage.getByRole("link", { name: "User 1 config" })).not.toBeVisible();

  // User 1 should still only see their own configuration, not user 2's, when they navigate back
  // Re-authenticate user 1 to ensure their session is still valid, then navigate
  await aliceContext.request.post(`${baseURL}/test/session`, { data: { email: `${user1}@dxw.com` } });
  await alicePage.goto(`${baseURL}/dxw`);
  await expect(alicePage.getByRole("link", { name: "User 1 config" }).first()).toBeVisible();
  await expect(alicePage.getByRole("link", { name: "User 2 config" })).not.toBeVisible();

  // Clean up: delete user 1's config
  while (await alicePage.getByRole("button", { name: "Delete" }).first().isVisible()) {
    await alicePage.getByRole("button", { name: "Delete" }).first().click();
  }

  // Clean up: delete user 2's config
  await bobContext.request.post(`${baseURL}/test/session`, { data: { email: `${user2}@dxw.com` } });
  await bobPage.goto(`${baseURL}/dxw`);
  while (await bobPage.getByRole("button", { name: "Delete" }).first().isVisible()) {
    await bobPage.getByRole("button", { name: "Delete" }).first().click();
  }

  await aliceContext.close();
  await bobContext.close();
});
