import { TowtruckDatabase } from "../db/index.js";
import { getOpenIssuesForRepo } from "../utils/githubApi/fetchOpenIssues.js";

/**
 * @typedef {import("./index.js").Event<T>} Event<T>
 * @template {string} T
 */

/**
 * @param {Event<"issues">} event
 * @param {TowtruckDatabase} db
 */
export const handleEvent = async ({ payload, octokit }, db) => {
  const issueInfo = await getOpenIssuesForRepo({
    octokit,
    repository: payload.repository,
  });

  db.saveToRepository(payload.repository.name, "issues", issueInfo);
};

/**
 * Handles the `"issues.opened"` webhook event.
 * @param {Event<"issues.opened">} event
 */
export const onIssueOpened = async (event) => {
  console.log(
    `New issue #${event.payload.issue.number} opened in ${event.payload.repository.name}: ${event.payload.issue.title}`,
  );
  return await handleEvent(event, new TowtruckDatabase());
};

/**
 * Handles the `"issues.closed"` webhook event.
 * @param {Event<"issues.closed">} event
 */
export const onIssueClosed = async (event) => {
  console.log(
    `Issue #${event.payload.issue.number} closed in ${event.payload.repository.name}: ${event.payload.issue.title}`,
  );
  return await handleEvent(event, new TowtruckDatabase());
};
