import { OctokitApp } from "../../octokitApp.js";
import { writeFile, mkdir } from "fs/promises";
import { mapRepoFromApiForStorage } from "../index.js";
import path from "path";
import {
  getDependenciesForRepo,
  getOpenPRsForRepo,
} from "../renovate/dependencyDashboard.js";

/**
 * Fetches all repos from the GitHub API.
 * Each repo is enriched with data fetched through further API calls
 * @returns {Promise<StoredRepo[]>}
 */
const fetchAllRepos = async () => {
  const repos = [];

  await OctokitApp.app.eachRepository(async ({ repository, octokit }) => {
    if (repository.archived) return;

    await Promise.all([
      await getDependenciesForRepo({
        repository,
        octokit,
      }),
      await getOpenPRsForRepo({
        repository,
        octokit,
      }),
    ]).then(([dependencies, openPrsCount]) => {
      repository.dependencies = dependencies;
      repository.openPrsCount = openPrsCount;
    });

    repos.push(mapRepoFromApiForStorage(repository));
  });

  return repos;
};

/**
 * Fetches installation data for the app from the GitHub API
 * @returns {Object}
 */
const installationOctokit = await OctokitApp.app.octokit.request(
  "GET /app/installations"
);

/**
 * Saves all repos to a JSON file
 */
const saveAllRepos = async () => {
  console.info("Fetching all repos...");
  const repos = await fetchAllRepos();

  try {
    const dir = path.dirname("./data/repos.json");
    await mkdir(dir, { recursive: true });

    console.info("Saving all repos...");
    const toSave = {
      org: installationOctokit.data[0].account.login,
      repos,
    };

    await writeFile("./data/repos.json", JSON.stringify(toSave), {
      encoding: "utf-8",
      flag: "w",
    });
  } catch (error) {
    console.error("Error saving all repos", error);
  }
};

await saveAllRepos();
