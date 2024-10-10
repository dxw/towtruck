import { TowtruckDatabase } from "../db/index.js";
import { mapRepoFromApiForStorage } from "../utils/index.js";

/**
 * @typedef {import("./index.js").Event<T>} Event<T>
 * @template {string} T
 */

/**
 * @param {Event<"repository">} event
 * @param {TowtruckDatabase} db
 */
export const handleEvent = async ({ payload }, db) => {
  if (payload.repository.archived) return;

  let repo = mapRepoFromApiForStorage(payload.repository);

  db.saveToRepository(payload.repository.name, "main", repo);
};

/**
 * Handles the `"repository"` webhook event.
 * @param {Event<"repository">} event
 */
export const onRepository = async (event) => {
  console.log(
    `${event.payload.repository.name} updated: ${event.payload.action}`,
  );
  handleEvent(event, new TowtruckDatabase());
};
