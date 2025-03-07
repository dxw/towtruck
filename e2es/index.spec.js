import { test, expect } from "@playwright/test";
import { getAuthFile } from "./auth.js";

test.describe(() => {
  test.use({ storageState: getAuthFile('test-user-1') });

  test("displays expected list of orgs for test-user-1 (member of one org using Towtruck)", async ({ page, baseURL }) => {
    await page.goto(baseURL);

    await expect(page).toHaveTitle(/Towtruck/);
  
    expect(await page.getByText("There is 1 organisation using Towtruck that you are a member of.").count()).toBe(1);

    expect(await page.getByRole("link", { name: "test-org", exact: true }).count()).toBe(1);
  });
});

test.describe(() => {
  test.use({ storageState: getAuthFile('test-user-2') });

  test("displays expected list of orgs for test-user-2 (not a member of any orgs)", async ({ page, baseURL }) => {
    await page.goto(baseURL);

    await expect(page).toHaveTitle(/Towtruck/);
  
    expect(await page.getByText("You are not a member of any organisations that are using Towtruck.").count()).toBe(1);

    expect(await page.getByRole("link", { name: "test-org", exact: true }).count()).toBe(0);
  });
});

test.describe(() => {
  test.use({ storageState: getAuthFile('test-user-3') });

  test("displays expected list of orgs for test-user-3 (member of multiple orgs, but only one using Towtruck)", async ({ page, baseURL }) => {
    await page.goto(baseURL);

    await expect(page).toHaveTitle(/Towtruck/);
  
    expect(await page.getByText("There is 1 organisation using Towtruck that you are a member of.").count()).toBe(1);

    expect(await page.getByRole("link", { name: "test-org", exact: true }).count()).toBe(1);
    expect(await page.getByRole("link", { name: "another-org", exact: true }).count()).toBe(0);
  });
});
