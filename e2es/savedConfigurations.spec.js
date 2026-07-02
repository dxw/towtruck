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
  const aliceContext = await browser.newContext({ storageState: authFile });
  const bobContext = await browser.newContext({ storageState: authFile });

  // Sign in as Alice and save a configuration
  const alicePage = await signInAs("alice@dxw.com", aliceContext, baseURL);
  await alicePage.getByTestId("sort-controls").getByRole("link", { name: "Open issues" }).click();
  await alicePage.getByText("Save current configuration").click();
  await alicePage.locator('input[name="name"]').fill("Alice's config");
  await alicePage.getByRole("button", { name: "Save" }).click();

  // Alice should see her own saved configuration
  await expect(alicePage.getByRole("link", { name: "Alice's config" }).first()).toBeVisible();

  // Sign in as Bob and save a configuration
  const bobPage = await signInAs("bob@dxw.com", bobContext, baseURL);
  await bobPage.getByTestId("sort-controls").getByRole("link", { name: "Open PRs" }).click();
  await bobPage.getByText("Save current configuration").click();
  await bobPage.locator('input[name="name"]').fill("Bob's config");
  await bobPage.getByRole("button", { name: "Save" }).click();

  // Bob should see his own saved configuration but NOT Alice's
  await expect(bobPage.getByRole("link", { name: "Bob's config" }).first()).toBeVisible();
  await expect(bobPage.getByRole("link", { name: "Alice's config" })).not.toBeVisible();

  // Alice should still only see her own configuration, not Bob's, when she navigates back
  // Re-authenticate Alice to ensure her session is still valid, then navigate
  await aliceContext.request.post(`${baseURL}/test/session`, { data: { email: "alice@dxw.com" } });
  await alicePage.goto(`${baseURL}/dxw`);
  await expect(alicePage.getByRole("link", { name: "Alice's config" }).first()).toBeVisible();
  await expect(alicePage.getByRole("link", { name: "Bob's config" })).not.toBeVisible();

  // Clean up: delete all Alice's configs (there may be leftovers from prior test runs)
  while (await alicePage.getByRole("button", { name: "Delete" }).first().isVisible()) {
    await alicePage.getByRole("button", { name: "Delete" }).first().click();
  }

  // Clean up: delete Bob's config
  await bobContext.request.post(`${baseURL}/test/session`, { data: { email: "bob@dxw.com" } });
  await bobPage.goto(`${baseURL}/dxw`);
  while (await bobPage.getByRole("button", { name: "Delete" }).first().isVisible()) {
    await bobPage.getByRole("button", { name: "Delete" }).first().click();
  }

  await aliceContext.close();
  await bobContext.close();
});
