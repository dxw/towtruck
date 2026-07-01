import express from "express";
import nunjucks from "nunjucks";
import { mapRepoFromStorageToUi, getOrgs } from "./utils/index.js";
import { sortByType } from "./utils/sorting.js";
import { filterByAlerts } from "./utils/alertFiltering.js";
import { normalizeSelectedTags, filterByTags } from "./utils/tagFiltering.js";
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
  const selectedTags = normalizeSelectedTags(tag);

  const filteredByTag = filterByTags(reposForUi.repos, selectedTags);

  const filteredByAlerts = filterByAlerts(filteredByTag, alertFilter);
  const sortedRepos = sortByType(filteredByAlerts, sortDirection, sortBy);
  const paginationData = calculatePagination(sortedRepos, pageParam);

  const buildTopicFilterUrl = (topic) => {
    const toggledTags = selectedTags.includes(topic)
      ? selectedTags.filter((selectedTag) => selectedTag !== topic)
      : [...selectedTags, topic];

    const params = new URLSearchParams();
    if (toggledTags.length) params.set("tag", toggledTags.join(","));
    if (sortBy) params.set("sortBy", sortBy);
    if (sortDirection) params.set("sortDirection", sortDirection);
    if (alertFilter) params.set("alertFilter", alertFilter);

    const queryString = params.toString();
    return queryString ? `/${org}?${queryString}` : `/${org}`;
  };

  const template = nunjucks.render("index.njk", {
    sortBy,
    sortDirection,
    tag: selectedTags.join(","),
    selectedTags,
    buildTopicFilterUrl,
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
