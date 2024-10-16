import nunjucks from "nunjucks";
import { mapRepoFromStorageToUi } from "../utils/index.js";
import { getQueryParams } from "../utils/queryParams.js";
import { sortByType } from "../utils/sorting.js";
import { TowtruckDatabase } from "../db/index.js";

export const index = async (_, request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositories();
  const persistedLifetimeData = db.getAllDependencies();

  const reposForUi = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData);

  const { sortDirection, sortBy } = getQueryParams(url);

  const template = nunjucks.render("index.njk", {
    sortBy,
    sortDirection,
    ...reposForUi,
    repos: sortByType(reposForUi.repos, sortDirection, sortBy),
  });

  return response.end(template);
};
