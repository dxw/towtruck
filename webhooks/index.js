import { createNodeMiddleware } from "@octokit/app";
import { OctokitApp } from "../octokitApp.js";
import { onPullRequestClosed, onPullRequestOpened } from "./pullRequests.js";
import { onIssueClosed, onIssueOpened } from "./issues.js";
import { onIssueEdited, onPush } from "./dependencies.js";
import { onDependabotAlert } from "./alerts.js";
import { onRepository } from "./repository.js";

/**
 * @typedef {import("@octokit/webhooks/dist-types/index").EmitterWebhookEvent<T>} EmitterWebhookEvent<T>
 * @template {string} T
 */

/**
 * @typedef {import("@octokit/core/dist-types/index").Octokit} Octokit
 */

/**
 * @typedef {EmitterWebhookEvent<T> & { octokit: Octokit; }} Event<T>
 * @template {string} T
 */

const registerWebhook = OctokitApp.app.webhooks.on;

registerWebhook("pull_request.opened", onPullRequestOpened);
registerWebhook("pull_request.closed", onPullRequestClosed);

registerWebhook("issues.opened", onIssueOpened);
registerWebhook("issues.closed", onIssueClosed);

registerWebhook("push", onPush);
registerWebhook("issues.edited", onIssueEdited);

registerWebhook("dependabot_alert", onDependabotAlert);

registerWebhook("repository", onRepository);

export const handleWebhooks = createNodeMiddleware(OctokitApp.app);
