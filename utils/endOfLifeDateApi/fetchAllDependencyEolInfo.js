import { EndOfLifeDateApiClient } from "./index.js";
import { TowtruckDatabase } from "../../db/index.js";

/**
 * @typedef {Object} DependencyLifetimes
 * @property {string} dependency - The name of the dependency
 * @property {import("./index.js").Cycle[]} lifetimes - The lifetimes of each release cycle for this dependency
 */

/**
 * Fetches all lifetime information for all repository dependencies from the endoflife.date
 * API.
 * Dependencies for which no information could be found are ignored.
 * @returns {Promise<DependencyLifetimes[]>}
 */
const fetchAllDependencyLifetimes = async () => {
  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositories();

  const dependencySet = new Set();
  Object.entries(persistedRepoData)
    .flatMap(([, repo]) => repo.dependencies)
    .forEach((dependency) => dependencySet.add(dependency.name));

  const apiClient = new EndOfLifeDateApiClient();

  const lifetimes = await Promise.all(
    dependencySet.values().map(async (dependency) => {
      const response = await apiClient.getAllCycles(dependency);
      if (response.message === "Product not found" || (Array.isArray(response) && response.length === 0)) {
        return;
      }

      return {
        dependency,
        lifetimes: response,
      };
    })
  );

  return lifetimes.filter((lifetime) => lifetime !== undefined);
};

/**
 * Saves all lifetime information for all repository dependencies to a JSON file.
 */
export const saveAllDependencyLifetimes = async () => {
  console.info("Fetching all dependency EOL info...");
  const allLifetimes = await fetchAllDependencyLifetimes();

  try {
    const db = new TowtruckDatabase();

    console.info("Saving all dependency EOL info...");
    const saveAllLifetimes = db.transaction((lifetimes) => {
      lifetimes.forEach((item) => db.saveToDependency(item.dependency, "lifetimes", item.lifetimes))
    });

    saveAllLifetimes(allLifetimes);
  } catch (error) {
    console.error("Error saving all dependency EOL info", error);
  }
};

await saveAllDependencyLifetimes();
