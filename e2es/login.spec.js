import { test, expect } from "@playwright/test";

test.describe(() => {
  test("displays the login page when no user is logged in", async ({ page, baseURL }) => {
    await page.goto(baseURL);

    await expect(page).toHaveTitle(/Towtruck/);

    expect(await page.getByText("To use Towtruck, you must login.").count()).toBe(1);

    expect(await page.getByRole('button', { name: 'Login with GitHub' }).count()).toBe(1);
    expect(await page.getByLabel("Username").count()).toBe(1);
    expect(await page.getByLabel("Password").count()).toBe(1);

    expect(await page.getByRole("link", { name: "test-org", exact: true }).count()).toBe(0);
  });

  test("a GitHub user cannot login through the username and password form", async ({ page, baseURL }) => {
    await page.goto(baseURL);

    await page.getByLabel('Username').fill('github-user');
    await page.getByLabel('Password').fill('');

    await page.locator('[type=submit]').click();

    expect(await page.getByText('The username or password is incorrect.').count()).toBe(1);
  });

  test("a non-existent user cannot login", async ({ page, baseURL }) => {
    await page.goto(baseURL);

    await page.getByLabel('Username').fill('unknown-user');
    await page.getByLabel('Password').fill('mypassword');

    await page.locator('[type=submit]').click();

    expect(await page.getByText('The username or password is incorrect.').count()).toBe(1);
  });

  test("a user cannot login with the wrong password", async ({ page, baseURL }) => {
    await page.goto(baseURL);

    await page.getByLabel('Username').fill('test-user-1');
    await page.getByLabel('Password').fill('thewrongpassword');

    await page.locator('[type=submit]').click();

    expect(await page.getByText('The username or password is incorrect.').count()).toBe(1);
  });
});
