import { readFile } from "fs/promises";
import { getDependencyState } from "./endOfLifeDateApi/index.js";

/**
 * @typedef {Object} PersistedData
 * @property {StoredRepo[]} repos - An array of repos.
 * @property {number} totalRepos - The total number of repos.
 * @property {string} org - The name of the Github organisation the repos belong to.
 */

/**
 * @typedef {PersistedData} RepoData
 * @property {UiRepo[]} repos - An array of repos.
 * @property {number} totalRepos - The total number of repos.
 * @property {string} org - The name of the Github organisation the repos belong to.
 */

/**
 * @typedef {Object} UiDependency
 * @property {string} name
 * @property {string?} version
 * @property {string?} tag
 * @property {string} color
 */

/**
 * Maps the persisted dependency data from storage to a format suitable for the UI
 * @param {import("../model/Dependency").Dependency} dependency 
 * @param {import("./endOfLifeDateApi/fetchAllDependencyEolInfo").DependencyLifetimes[]} persistedLifetimes
 * @returns {UiDependency} 
 */
export const mapDependencyFromStorageToUi = (dependency, persistedLifetimes) => {
  const lifetimes = persistedLifetimes.lifetimes.find((item) => item.dependency === dependency.name);

  const state = lifetimes === undefined ? "unknown" : getDependencyState(dependency, lifetimes.lifetimes);
  const latestVersion = lifetimes?.lifetimes[0]?.latest;

  let color;
  switch (state) {
    case "unknown":
      color = "stone";
      break;
    case "upToDate":
      color = "sky";
      break;
    case "minorUpdateAvailable":
      color = "amber";
      break;
    case "majorUpdateAvailable":
      color = "orange";
      break;
    case "endOfLife":
      color = "red";
      break;
  }

  let icon;
  switch (state) {
    case "unknown":
      icon = "bx-question-mark";
      break;
    case "upToDate":
      icon = "bx-check-circle";
      break;
    case "minorUpdateAvailable":
      icon = "bx-up-arrow-circle";
      break;
    case "majorUpdateAvailable":
      icon = "bxs-up-arrow-circle";
      break;
    case "endOfLife":
      icon = "bxs-x-circle";
      break;
  }

  return {
    name: dependency.name,
    version: dependency.version,
    tag: dependency.tag,
    color,
    icon,
    isOutdated: state !== "upToDate" && state !== "unknown",
    latestVersion,
  }
}

/**
 * Maps the persisted repo data from storage to a format suitable for the UI
 * @param {PersistedData} persistedData
 * @param {import("./endOfLifeDateApi/fetchAllDependencyEolInfo").DependencyLifetimes[]} persistedLifetimes
 * @returns {RepoData}
 */
export const mapRepoFromStorageToUi = (persistedData, persistedLifetimes) => {
  const mappedRepos = persistedData.repos.map((repo) => {
    const newDate = new Date(repo.updatedAt).toLocaleDateString();
    const dependencies = repo.dependencies.map((dependency) => mapDependencyFromStorageToUi(dependency, persistedLifetimes));

    return {
      ...repo,
      updatedAt: newDate,
      updatedAtISO8601: repo.updatedAt,
      dependencies,
    };
  });

  const totalRepos = mappedRepos.length;

  return { ...persistedData, repos: mappedRepos, totalRepos };
};

/**
 * Reads data from a JSON file
 * @param {string} filePath - The path to the file to read from
 * @returns {any}
 */
export const readFromJsonFile = async (filePath) => {
  const json = await readFile(filePath, { encoding: "utf-8" });
  const persistedData = JSON.parse(json);

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
 * @property {import("../model/Dependency").Dependency[]} dependencies - An array of dependencies used by the repo.
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
 * @property {import("../model/Dependency").Dependency[]} dependencies - An array of dependencies used by the repo.
 */

/**
 * @typedef {StoredRepo} UiRepo
 * @property {Date} date - The date the repo was last updated in JS date format.
 * @property {string} updatedAtISO8601 - The date the repo was last updated in ISO8601 format for sorting.
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
});
