import { mapRepoFromApiForStorage } from "../index.js";
import { getDependenciesForRepo } from "../renovate/dependencyDashboard.js";
import { getOpenPRsForRepo } from "./fetchOpenPrs.js";
import { getOpenIssuesForRepo } from "./fetchOpenIssues.js";
import { getDependabotAlertsForRepo } from "./fetchDependabotAlerts.js";

/**
 * @typedef {import('../index.js').StoredRepo} StoredRepo
 * @typedef {import("../../model/Dependency.js").Dependency} Dependency
 * @typedef {import("../../db/index.js").TowtruckDatabase} TowtruckDatabase
 * @typedef {import("@octokit/types/dist-types/index.js").Endpoints["GET /installation/repositories"]["response"]["data"]["repositories"][0]} Repository
 * @typedef {import("@octokit/core/dist-types/index.js").Octokit} Octokit
 */

/**
 * @typedef {Object} RepoData
 * @property {StoredRepo} repo
 * @property {Dependency[]} dependencies
 * @property {Object} prInfo
 * @property {Object} issueInfo
 * @property {Object} alerts
 */

/**
 *
 * @param {Repository} repository
 * @param {Octokit} octokit
 * @returns {Promise<RepoData>}
 */
export const fetchForRepo = async (repository, octokit) => {
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

  return repo;
};

/**
 *
 * @param {RepoData[]} allRepos
 * @param {TowtruckDatabase} db
 */
export const saveAllRepos = async (allRepos, db) => {
  try {
    console.info("Saving all repos...");
    const saveAllRepos = db.transaction((repos) => {
      repos.forEach((repo) => {
        const repoName = repo.repo.name;
        const owner = repo.repo.owner;

        const name = `${owner}/${repoName}`;
        
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
