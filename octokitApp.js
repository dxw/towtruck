import { readFileSync } from "fs";
import { App, createNodeMiddleware } from "@octokit/app";

const APP_ID = process.env.APP_ID;
const PRIVATE_KEY_PATH = process.env.PRIVATE_KEY_PATH;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const privateKey = readFileSync(PRIVATE_KEY_PATH).toString();

const app = new App({
  appId: APP_ID,
  privateKey,
  oauth: {
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  },
  webhooks: {
    secret: WEBHOOK_SECRET,
  },
});

// eslint-disable-next-line no-unused-vars
app.webhooks.onAny(({ id, name, payload }) => {
  console.log(name, "event received");
});

const middleware = createNodeMiddleware(app);

export const OctokitApp = { app, middleware };
