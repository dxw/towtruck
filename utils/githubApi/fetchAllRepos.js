import { OctokitApp } from "../../octokitApp.js";
import { mapRepoFromApiForStorage } from "../index.js";
import { getDependenciesForRepo } from "../renovate/dependencyDashboard.js";
import { getOpenPRsForRepo } from "./fetchOpenPrs.js";
import { getOpenIssuesForRepo } from "./fetchOpenIssues.js";
import { getDependabotAlertsForRepo } from "./fetchDependabotAlerts.js";
import { TowtruckDatabase } from "../../db/index.js";

/**
 * @typedef {import('../index.js').StoredRepo} StoredRepo
 */

/**
 * Fetches all repos from the GitHub API.
 * Each repo is enriched with data fetched through further API calls
 * @returns {Promise<StoredRepo[]>}
 */
const fetchAllRepos = async () => {
  const repos = [];

  await OctokitApp.app.eachRepository(async ({ repository, octokit }) => {
    if (repository.archived) return;

    let repo = mapRepoFromApiForStorage(repository);

    await Promise.all([
      getDependenciesForRepo({
        repository,
        octokit,
      }),
      getOpenPRsForRepo({
        repository,
        octokit,
      }),
      getOpenIssuesForRepo({
        repository,
        octokit,
      }),
      getDependabotAlertsForRepo({
        repository,
        octokit,
      }),
    ]).then(([dependencies, prInfo, issueInfo, alerts]) => {
      repo = { repo, dependencies, prInfo, issueInfo, alerts };
    });

    repos.push(repo);
  });

  return repos;
};

/**
 * Saves all repos to a JSON file
 */
const saveAllRepos = async () => {
  console.info("Fetching all repos...");
  const allRepos = await fetchAllRepos();

  try {
    const db = new TowtruckDatabase();

    console.info("Saving all repos...");
    const saveAllRepos = db.transaction((repos) => {
      repos.forEach((repo) => {
        const name = repo.repo.name;
        const owner = repo.repo.owner;
        db.saveToRepository(name, "main", repo.repo);
        db.saveToRepository(name, "owner", owner);
        db.saveToRepository(name, "dependencies", repo.dependencies);
        db.saveToRepository(name, "pullRequests", repo.prInfo);
        db.saveToRepository(name, "issues", repo.issueInfo);
        db.saveToRepository(name, "dependabotAlerts", repo.alerts);
      });
    });

    saveAllRepos(allRepos);
  } catch (error) {
    console.error("Error saving all repos", error);
  }
};

await saveAllRepos();
