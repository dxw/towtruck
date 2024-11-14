import { test as setup } from '@playwright/test';

const USERNAME = process.env.PLAYWRIGHT_GITHUB_USERNAME;
const PASSWORD = process.env.PLAYWRIGHT_GITHUB_PASSWORD;

setup('authenticate', async ({ page, baseURL }, testInfo) => {
  await page.goto(baseURL);
  await page.getByRole('button', { name: 'Login with GitHub' }).click();

  await page.waitForURL(/https:\/\/github.com\/login/);

  await page.getByLabel('Username or email address').fill(USERNAME);
  await page.getByLabel('Password').fill(PASSWORD);

  await page.locator('[type=submit]').click();

  await page.waitForURL(baseURL);

  await page.context().storageState({ path: testInfo.outputPath('user.json') });
});
