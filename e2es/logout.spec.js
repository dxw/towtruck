import { test, expect } from "@playwright/test";
import { getAuthFile } from "./auth.js";

test.describe(() => {
  test.use({ storageState: getAuthFile('test-user-1') });

  test("pressing the logout link logs the user out", async ({ page, baseURL }) => {
    await page.goto(baseURL);
  
    expect(await page.getByRole("link", { name: "Logout", exact: true }).count()).toBe(1);
    await page.getByRole("link", { name: "Logout", exact: true }).click();

    await page.waitForURL(baseURL);

    expect(await page.getByText("To use Towtruck, you must login.").count()).toBe(1);
  });
});

test.describe(() => {
  test("there is no logout link when no user is logged in", async ({ page, baseURL }) => {
    await page.goto(baseURL);

    expect(await page.getByRole("link", { name: "Logout", exact: true }).count()).toBe(0);
  });
});
