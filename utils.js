import { readFile } from "fs/promises";

/**
 * @typedef {Object} PersistedData
 * @property {StoredRepo[]} repos - An array of repos.
 * @property {number} totalRepos - The total number of repos.
 * @property {string} org - The name of the Github organisation the repos belong to.
 */

/**
 * @typedef {PersistedData} RepoData
 * @property {UiRepo[]} repos - An array of repos.
 */

/**
 * Maps the persisted repo data from storage to a format suitable for the UI
 * @param {PersistedData} persistedData
 * @returns {RepoData}
 */
export const mapRepoFromStorageToUi = (persistedData) => {
  const mappedRepos = persistedData.repos.map((repo) => {
    const newDate = new Date(repo.updatedAt).toLocaleDateString();
    return {
      ...repo,
      updatedAt: newDate,
    };
  });

  const totalRepos = mappedRepos.length;

  return { ...persistedData, repos: mappedRepos, totalRepos };
};

/**
 * Reads the persisted repo data from a JSON file
 * @param {string} filePath - The path to the file to read from
 * @returns {PersistedData}
 */
export const getReposFromJson = async (filePath) => {
  const reposJson = await readFile(filePath, { encoding: "utf-8" });
  const persistedData = JSON.parse(reposJson);

  return persistedData;
};

/**
 * @typedef {Object} ApiRepo
 * @property {string} name - The name of the repo Eg "dalmation".
 * @property {string} description - A brief description of the repo.
 * @property {string} html_url - The URL to the repo on GitHub for humans.
 * @property {string} pulls_url - The API url to get more info on pull requests for this repo.
 * @property {string} issues_url - The API url to get more info on issues for this repo.
 * @property {string} updated_at - The date the repo was last updated in ISO8601 format.
 * @property {string} language - The primary language the repo is written in.
 * @property {string[]} topics - An array of topics associated with the repo - conventially in dxw this is used to list the owners of the repo (EG govpress, delivery-plus).
 * @property {number} open_issues - The number of open issues on the repo.
 * @property {string[]} dependencies - An array of dependencies used by the repo.
 */

/**
 * @typedef {Object} StoredRepo
 * @property {string} name - The name of the repo Eg "dalmation".
 * @property {string} description - A brief description of the repo.
 * @property {string} htmlUrl - The URL to the repo on GitHub for humans.
 * @property {string} apiUrl - The URL to the repo on GitHub for computers.
 * @property {string} pullsUrl - The API url to get more info on pull requests for this repo.
 * @property {string} issuesUrl - The API url to get more info on issues for this repo.
 * @property {string} updatedAt - The date the repo was last updated in ISO8601 format.
 * @property {string} language - The primary language the repo is written in.
 * @property {string[]} topics - An array of topics associated with the repo - conventially in dxw this is used to list the owners of the repo (EG govpress, delivery-plus).
 * @property {number} openIssues - The number of open issues on the repo.
 * @property {string[]} dependencies - An array of dependencies used by the repo.
 */

/**
 * @typedef {StoredRepo} UiRepo
 * @property {Date} date - The date the repo was last updated in JS date format.
 */

/**
 * Maps from an API repo to a StoredRepo
 * @param {ApiRepo} repo
 * @returns {StoredRepo}
 */
export const mapRepoFromApiForStorage = (repo) => ({
  name: repo.name,
  description: repo.description,
  htmlUrl: repo.html_url,
  apiUrl: repo.url,
  pullsUrl: repo.pulls_url,
  issuesUrl: repo.issues_url,
  updatedAt: repo.updated_at,
  language: repo.language,
  topics: repo.topics,
  openIssues: repo.open_issues,
  dependencies: repo.dependencies,
});
