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

test("save configuration button is on the filter row", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/dxw`);

  const filterRow = page.getByTestId("filter-row");
  await expect(filterRow.getByRole("button", { name: "Runtime critical only" })).toBeVisible();
  await expect(filterRow.getByText("Save configuration")).toBeVisible();
});

test("saving a configuration keeps the table's filters and highlights it while they match", async ({
  browser,
  baseURL,
}) => {
  // An empty storage state gives this page its own session, so other tests signing in can't change its user
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await signInAs(`${Math.floor(Math.random() * 1e10)}@dxw.com`, context, baseURL);
  const publishingFilter = page.getByRole("button", { name: "Only Publishing" });
  const savedConfiguration = page.getByRole("link", { name: "Publishing config" });
  const clear = page.getByRole("link", { name: "Clear" });

  await publishingFilter.click();
  await page.getByText("Save configuration").click();
  await page.locator('input[name="name"]').fill("Publishing config");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL(/mode=publishing/);
  await expect(publishingFilter).toHaveAttribute("aria-pressed", "true");
  await expect(savedConfiguration).toHaveAttribute("aria-current", "true");
  await expect(clear).toBeVisible();

  await publishingFilter.click();
  await expect(savedConfiguration).toHaveAttribute("aria-current", "false");
  await expect(clear).toBeHidden();

  await savedConfiguration.click();
  await expect(publishingFilter).toHaveAttribute("aria-pressed", "true");

  await page.getByTitle("Delete").click();
  await expect(savedConfiguration).toHaveCount(0);
  await expect(page).toHaveURL(/mode=publishing/);

  await context.close();
});

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
  await alicePage.goto(`${baseURL}/dxw?sortBy=openIssues&sortDirection=asc`);
  await alicePage.getByText("Save configuration").click();
  await alicePage.locator('input[name="name"]').fill("User 1 config");
  await alicePage.getByRole("button", { name: "Save" }).click();

  // User 1 should see their own saved configuration
  await expect(alicePage.getByRole("link", { name: "User 1 config" }).first()).toBeVisible();

  // Sign in as user2 and save a configuration
  const bobPage = await signInAs(`${user2}@dxw.com`, bobContext, baseURL);
  await bobPage.goto(`${baseURL}/dxw?sortBy=openPrCount&sortDirection=asc`);
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
