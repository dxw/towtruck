import { test as setup } from "@playwright/test";
import path from "path";

export const authFile = path.join(import.meta.dirname, ".auth", "user.json");

setup("authenticate", async ({ page }) => {
  await page.request.post("/test/session", {
    data: { email: "test@dxw.com" },
  });

  await page.context().storageState({ path: authFile });
});
