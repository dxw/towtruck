import { test as setup } from '@playwright/test';
import { getAuthFile } from './auth.js';

const authenticate = async (page, baseURL, username, password) => {
  await page.goto(baseURL);
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);

  await page.locator('[type=submit]').click();

  await page.waitForURL(baseURL);

  await page.context().storageState({ path: getAuthFile(username) });
}

setup('authenticate as test-user-1', async ({ page, baseURL }) => {
  await authenticate(page, baseURL, 'test-user-1', 'mypassword');
});

setup('authenticate as test-user-2', async ({ page, baseURL }) => {
  await authenticate(page, baseURL, 'test-user-2', 'mypassword');
});

setup('authenticate as test-user-3', async ({ page, baseURL }) => {
  await authenticate(page, baseURL, 'test-user-3', 'someotherpassword');
});
