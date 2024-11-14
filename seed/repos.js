import { TowtruckDatabase } from "../db/index.js";
import {
  fetchForRepo,
  saveAllRepos,
} from "../utils/githubApi/fetchAllRepos.js";
import { OctokitApp } from "../octokitApp.js";

/**
 * Fetches all repos from the GitHub API.
 * Each repo is enriched with data fetched through further API calls
 * @returns {Promise<StoredRepo[]>}
 */
const fetchAllRepos = async () => {
  const repos = [];

  await OctokitApp.app.eachRepository(async ({ repository, octokit }) => {
    const repo = await fetchForRepo(repository, octokit);

    if (repo) repos.push(repo);
  });

  return repos;
};

const seed = async () => {
  const db = new TowtruckDatabase();

  db.deleteAllRepositories();

  const allRepos = await fetchAllRepos();
  saveAllRepos(allRepos, db);
};

await seed();
