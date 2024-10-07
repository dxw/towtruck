import { TowtruckDatabase } from "../db/index.js";
import { getOpenPRsForRepo } from "../utils/githubApi/fetchOpenPrs.js";

/**
 * @typedef {import("./index.js").Event<T>} Event<T>
 * @template {string} T
 */

/**
 * @param {Event<"pull_request">} event
 * @param {TowtruckDatabase} db
 */
export const handleEvent = async ({ payload, octokit }, db) => {
  const prInfo = await getOpenPRsForRepo({
    octokit,
    repository: payload.repository,
  });

  db.saveToRepository(payload.repository.name, "pullRequests", prInfo);
};

/**
 * Handles the `"pull_request.opened"` webhook event.
 * @param {Event<"pull_request.opened">} event
 */
export const onPullRequestOpened = async (event) => {
  console.log(
    `New PR #${event.payload.number} opened in ${event.payload.repository.name}: ${event.payload.pull_request.title}`,
  );
  return await handleEvent(event, new TowtruckDatabase());
};

/**
 * Handles the `"pull_request.closed"` webhook event.
 * @param {Event<"pull_request.closed">} event
 */
export const onPullRequestClosed = async (event) => {
  console.log(
    `PR #${event.payload.number} closed in ${event.payload.repository.name}: ${event.payload.pull_request.title}`,
  );
  return await handleEvent(event, new TowtruckDatabase());
};
