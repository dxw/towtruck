import { App, createNodeMiddleware } from "@octokit/app";

const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const privateKey = Buffer.from(PRIVATE_KEY, 'base64').toString('ascii');

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

app.webhooks.onAny(({ name }) => {
  console.log(name, "event received");
});

const middleware = createNodeMiddleware(app);

export const OctokitApp = { app, middleware };
