import { TowtruckDatabase } from "../db/index.js";
import {
  fetchAllDependencyLifetimes,
  saveAllDependencyLifetimes,
} from "../utils/endOfLifeDateApi/fetchAllDependencyEolInfo.js";
import { EndOfLifeDateApiClient } from "../utils/endOfLifeDateApi/index.js";
import { getDependenciesForRepo } from "../utils/renovate/dependencyDashboard.js";

/**
 * @typedef {import("./index.js").Event<T>} Event<T>
 * @template {string} T
 */

/**
 * @param {Event<"push" | "issues.edited">} event
 * @param {TowtruckDatabase} db
 * @param {EndOfLifeDateApiClient} apiClient
 */
export const handleEvent = async ({ payload, octokit }, db, apiClient) => {
  const dependencies = await getDependenciesForRepo({
    octokit,
    repository: payload.repository,
  });

  db.saveToRepository(payload.repository.name, "dependencies", dependencies);

  const allLifetimes = await fetchAllDependencyLifetimes(db, apiClient);
  await saveAllDependencyLifetimes(allLifetimes, db);
};

/**
 * Handles the `"push"` webhook event.
 * @param {Event<"push">} event
 */
export const onPush = async (event) => {
  console.log(`Push to ${event.payload.repository.name}: ${event.payload.ref}`);
  if (event.payload.ref === "refs/heads/main") {
    return await handleEvent(
      event,
      new TowtruckDatabase(),
      new EndOfLifeDateApiClient(),
    );
  }
};

/**
 * Handles the `"issues.edited"` webhook event.
 * @param {Event<"issues.edited">} event
 */
export const onIssueEdited = async (event) => {
  console.log(
    `Issue #${event.payload.issue.number} updated in ${event.payload.repository.name}: ${event.payload.issue.title}`,
  );
  if (
    event.payload.issue.user.login === "renovate[bot]" &&
    event.payload.issue.pull_request === undefined
  ) {
    return await handleEvent(
      event,
      new TowtruckDatabase(),
      new EndOfLifeDateApiClient(),
    );
  }
};
