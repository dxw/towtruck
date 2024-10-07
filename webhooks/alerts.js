import { TowtruckDatabase } from "../db/index.js";
import { getDependabotAlertsForRepo } from "../utils/githubApi/fetchDependabotAlerts.js";

/**
 * @typedef {import("./index.js").Event<T>} Event<T>
 * @template {string} T
 */

/**
 * @param {Event<"dependabot_alert">} event
 * @param {TowtruckDatabase} db
 */
export const handleEvent = async ({ payload, octokit }, db) => {
  const alerts = await getDependabotAlertsForRepo({
    octokit,
    repository: payload.repository,
  });

  db.saveToRepository(payload.repository.name, "dependabotAlerts", alerts);
};

/**
 * Handles the `"dependabot_alert"` webhook event.
 * @param {Event<"dependabot_alert">} event
 */
export const onDependabotAlert = async (event) => {
  console.log(
    `Dependabot alert #${event.payload.alert.number} in ${event.payload.repository.name} updated: ${event.payload.action}`,
  );
  handleEvent(event, new TowtruckDatabase());
};
