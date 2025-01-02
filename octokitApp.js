import { App } from "@octokit/app";

const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const REDIRECT_URL_BASE = process.env.REDIRECT_URL_BASE;

const privateKey = Buffer.from(PRIVATE_KEY, 'base64').toString('ascii');
const redirectUrl = `${REDIRECT_URL_BASE}/api/github/oauth/callback`;

const app = new App({
  appId: APP_ID,
  privateKey,
  oauth: {
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUrl,
    clientType: "github-app"
  },
  webhooks: {
    secret: WEBHOOK_SECRET,
  },
});

export const OctokitApp = { app };
