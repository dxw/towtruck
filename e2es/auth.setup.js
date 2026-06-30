import { test as setup } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const AUTH_STATE_PATH = "./e2es/.auth/session.json";

setup("authenticate", async ({ request }) => {
  const response = await request.post("/test/session", {
    data: { email: "e2e@dxw.com" },
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to create test session: ${response.status()} ${await response.text()}`
    );
  }

  // Save the cookies so all tests can reuse them.
  const storageState = await request.storageState();
  await mkdir(dirname(AUTH_STATE_PATH), { recursive: true });
  await writeFile(AUTH_STATE_PATH, JSON.stringify(storageState, null, 2));
});
