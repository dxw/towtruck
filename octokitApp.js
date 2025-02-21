import { App } from "@octokit/app";
import { Config } from "./config.js";

const app = new App({
  appId: Config.gitHub.appId,
  privateKey: Config.privateKey,
  oauth: {
    clientId: Config.gitHub.clientId,
    clientSecret: Config.gitHub.clientSecret,
    redirectUrl: `${Config.redirectUrlBase}/login/github`,
    clientType: "github-app"
  },
  webhooks: {
    secret: Config.gitHub.webhookSecret,
  },
});

export const OctokitApp = { app };
