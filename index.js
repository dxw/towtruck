import { createServer } from "http";
import nunjucks from "nunjucks";
import { getReposFromJson, mapRepoFromStorageToUi } from "./utils.js";
import { OctokitApp } from "./octokitApp.js";

nunjucks.configure({
  autoescape: true,
  watch: true,
});

const httpServer = createServer(async (request, response) => {
  if (await OctokitApp.middleware(request, response)) return;

  const pathToRepos = "./data/repos.json";
  const persistedData = await getReposFromJson(pathToRepos);

  const template = nunjucks.render(
    "index.njk",
    mapRepoFromStorageToUi(persistedData)
  );

  return response.end(template);
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
});
