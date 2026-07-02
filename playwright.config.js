import { defineConfig, devices } from "@playwright/test";
import path from "path";

const authFile = path.join(import.meta.dirname, "e2es/.auth/user.json");

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2es",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://127.0.0.1:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "setup data",
      testMatch: /seed\.test\.data\.js/,
    },
    {
      name: "setup auth",
      testMatch: /auth\.setup\.js/,
      dependencies: ["setup data"],
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      dependencies: ["setup auth"],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "node ./e2es/seedTestData.js && node index.js",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    stdout: "inherit",
    stderr: "inherit",
    env: {
      NODE_ENV: "test",
    },
  },
});
