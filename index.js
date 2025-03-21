import express from "express";
import nunjucks from "nunjucks";
import { mapRepoFromStorageToUi } from "./utils/index.js";
import { sortByType } from "./utils/sorting.js";
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
  const persistedLifetimeData = db.getAllDependencies();

  const reposForUi = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData);

  const { sortDirection, sortBy } = request.query;

  const template = nunjucks.render("index.njk", {
    sortBy,
    sortDirection,
    ...reposForUi,
    repos: sortByType(reposForUi.repos, sortDirection, sortBy),
  });

  return response.end(template);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
});
