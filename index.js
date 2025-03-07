import express from "express";
import nunjucks from "nunjucks";
import { mapRepoFromStorageToUi } from "./utils/index.js";
import { sortByType } from "./utils/sorting.js";
import { TowtruckDatabase } from "./db/index.js";
import { handleWebhooks } from "./webhooks/index.js";
import { Config } from "./config.js";

nunjucks.configure({
  autoescape: true,
  watch: true,
});

const httpServer = express();
httpServer.use(handleWebhooks);

httpServer.engine("njk", nunjucks.render);

httpServer.set("views", "./views");
httpServer.set("view engine", "njk");

httpServer.get("/", (request, response) => {
  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositories();
  const persistedLifetimeData = db.getAllDependencies();

  const reposForUi = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData);

  const { sortDirection, sortBy } = request.query;

  return response.render("org-dashboard", {
    sortBy,
    sortDirection,
    ...reposForUi,
    repos: sortByType(reposForUi.repos, sortDirection, sortBy),
  });
});

httpServer.all("*path", (request, response) => {
  return response.status(404).render("404", { url: request.path });
});

httpServer.listen(Config.port, () => {
  console.info(`Server is running on port ${Config.port}`);
});
