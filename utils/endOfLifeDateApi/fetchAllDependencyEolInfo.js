/**
 * @typedef {Object} DependencyLifetimes
 * @property {string} dependency - The name of the dependency
 * @property {import("./index.js").Cycle[]} lifetimes - The lifetimes of each release cycle for this dependency
 */

/**
 * Fetches all lifetime information for all repository dependencies from the endoflife.date
 * API.
 * Dependencies for which no information could be found are ignored.
 * @param {TowtruckDatabase} db
 * @param {EndOfLifeDateApiClient} apiClient
 * @returns {Promise<DependencyLifetimes[]>}
 */
export const fetchAllDependencyLifetimes = async (db, apiClient) => {
  const persistedRepoData = db.getAllRepositories();

  const dependencySet = new Set();
  Object.entries(persistedRepoData)
    .flatMap(([, repo]) => repo.dependencies)
    .forEach((dependency) => dependencySet.add(dependency.name));

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
 * @param {DependencyLifetimes[]} allLifetimes
 * @param {TowtruckDatabase} db
 */
export const saveAllDependencyLifetimes = async (allLifetimes, db) => {
  try {
    console.info("Saving all dependency EOL info...");
    const saveAllLifetimes = db.transaction((lifetimes) => {
      lifetimes.forEach((item) => db.saveToDependency(item.dependency, "lifetimes", item.lifetimes))
    });

    saveAllLifetimes(allLifetimes);
  } catch (error) {
    console.error("Error saving all dependency EOL info", error);
  }
};
