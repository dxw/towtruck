import { EndOfLifeDateApiClient } from "./index.js";
import { readFromJsonFile } from "../index.js";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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
  const pathToRepos = "./data/repos.json";
  const persistedRepoData = await readFromJsonFile(pathToRepos);

  const dependencySet = new Set();
  persistedRepoData.repos
    .flatMap((repo) => repo.dependencies)
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
const saveAllDependencyLifetimes = async () => {
  console.info("Fetching all dependency EOL info...");
  const lifetimes = await fetchAllDependencyLifetimes();

  try {
    const dir = path.dirname("./data/lifetimes.json");
    await mkdir(dir, { recursive: true });

    console.info("Saving all dependency EOL info...");
    const toSave = {
      lifetimes,
    };

    await writeFile("./data/lifetimes.json", JSON.stringify(toSave), {
      encoding: "utf-8",
      flag: "w",
    });
  } catch (error) {
    console.error("Error saving all dependency EOL info", error);
  }
};

await saveAllDependencyLifetimes();
