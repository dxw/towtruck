import { test as setup } from "@playwright/test";
import path from "path";

export const authFile = path.join(import.meta.dirname, ".auth", "user.json");

setup("authenticate", async ({ request, context }) => {
  await request.post("/test/session", {
    data: { email: "test@dxw.com" },
  });

  await context.storageState({ path: authFile });
});

