import { TowtruckDatabase } from "../db/index.js";
import { getCommitsForRepo } from "../utils/githubApi/fetchCommits.js";

/**
 * @typedef {import("./index.js").Event<T>} Event<T>
 * @template {string} T
 */

/**
 * @param {Event<"push">} event
 * @param {TowtruckDatabase} db
 */
export const handleEvent = async ({ payload, octokit }, db) => {
  const commitInfo = await getCommitsForRepo({
    octokit,
    repository: payload.repository,
  });

  db.saveToRepository(payload.repository.full_name, "commits", commitInfo);
};

/**
 * Handles the `"push"` webhook event for commit information.
 * @param {Event<"push">} event
 */
export const onPush = async (event) => {
  if (event.payload.ref === `refs/heads/${event.payload.repository.default_branch}`) {
    return await handleEvent(event, new TowtruckDatabase());
  }
};
