import nunjucks from "nunjucks";
import { cookie } from "../auth/cookie.js";
import { mapRepoFromStorageToUi } from "../utils/index.js";
import { getQueryParams } from "../utils/queryParams.js";
import { sortByType } from "../utils/sorting.js";
import { TowtruckDatabase } from "../db/index.js";
import { OctokitApp } from "../octokitApp.js";

const getOrgsForUser = async (token) => {
  const octokit = await OctokitApp.app.oauth.getUserOctokit({ token });

  const { data } = await octokit.request("GET /user/memberships/orgs");

  return data
    .filter(membership => membership.state === "active")
    .map(membership => membership.organization.login);
}

export const index = async (token, request, response) => {
  const orgs = await getOrgsForUser(token);
  
  const template = nunjucks.render("index.njk", {
    orgs,
    loggedIn: true
  });

  return response.end(template);
};

export const org = async (token, request, response, {org}) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  const orgs = await getOrgsForUser(token);

  if (!orgs.includes(org)) {
    response.writeHead(302, {
      "Location": "/",
    });
    return response.end();
  }

  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositoriesForOrg(org);
  const persistedLifetimeData = db.getAllDependencies();

  const reposForUi = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData);

  const { sortDirection, sortBy } = getQueryParams(url);

  const template = nunjucks.render("dashboard.njk", {
    sortBy,
    sortDirection,
    org,
    ...reposForUi,
    repos: sortByType(reposForUi.repos, sortDirection, sortBy),
    loggedIn: true,
  });

  return response.end(template);
}

export const logout = async (token, request, response) => {
  response.writeHead(302, {
    "Location": "/",
    ...cookie("Token", "", "/", new Date(0)),
  });

  return response.end();
};
