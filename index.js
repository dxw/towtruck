import { createServer } from "http";
import nunjucks from "nunjucks";
import { getReposFromJson, mapRepoFromStorageToUi } from "./utils/index.js";
import { getQueryParams } from "./utils/queryParams.js";
import { OctokitApp } from "./octokitApp.js";
import { sortByType } from "./utils/sorting.js";

nunjucks.configure({
  autoescape: true,
  watch: true,
});

const httpServer = createServer(async (request, response) => {
  if (await OctokitApp.middleware(request, response)) return;

  let url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname !== "/") {
    response.writeHead(404);
    return response.end();
  }

  const persistedData = await getReposFromJson("./data/repos.json");
  const reposForUi = mapRepoFromStorageToUi(persistedData);

  const { sortDirection, sortBy } = getQueryParams(url);

  const template = nunjucks.render("index.njk", {
    sortBy,
    sortDirection,
    ...reposForUi,
    repos: sortByType(reposForUi.repos, sortDirection, sortBy),
  });

  return response.end(template);
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
});
