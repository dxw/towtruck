import express from "express";
import nunjucks from "nunjucks";
import { mapRepoFromStorageToUi, getOrgs } from "./utils/index.js";
import { sortByType } from "./utils/sorting.js";
import { filterByAlerts } from "./utils/alertFiltering.js";
import { calculatePagination } from "./utils/pagination.js";
import { TowtruckDatabase } from "./db/index.js";
import { handleWebhooks } from "./webhooks/index.js";

nunjucks.configure({
  autoescape: true,
  watch: true,
});

const httpServer = express();
httpServer.use(handleWebhooks);

httpServer.get("/", (request, response) => {
  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositories();
  const orgs = getOrgs(persistedRepoData);

  const template = nunjucks.render("home.njk", { orgs });

  return response.end(template);
});

httpServer.get("/:org", (request, response) => {
  const { org } = request.params;
  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositoriesForOrg(org);
  const persistedLifetimeData = db.getAllDependencies();

  const reposForUi = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData);

  const { sortDirection, sortBy, tag, page: pageParam, alertFilter } = request.query;

  const filteredByTag = tag
    ? reposForUi.repos.filter((repo) => repo.topics && repo.topics.includes(tag))
    : reposForUi.repos;

  const filteredByAlerts = filterByAlerts(filteredByTag, alertFilter);
  const sortedRepos = sortByType(filteredByAlerts, sortDirection, sortBy);
  const paginationData = calculatePagination(sortedRepos, pageParam);

  const template = nunjucks.render("index.njk", {
    sortBy,
    sortDirection,
    tag,
    alertFilter,
    ...reposForUi,
    org,
    repos: paginationData.items,
    totalRepos: reposForUi.totalRepos,
    displayedRepos: filteredByAlerts.length,
    currentPage: paginationData.currentPage,
    totalPages: paginationData.totalPages,
    pageNumbers: paginationData.pageNumbers,
    hasPreviousPage: paginationData.hasPreviousPage,
    hasNextPage: paginationData.hasNextPage,
  });

  return response.end(template);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
});
