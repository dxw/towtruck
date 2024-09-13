import { createServer } from "http";
import nunjucks from "nunjucks";
import { getReposFromJson, mapRepoFromStorageToUi } from "./utils/index.js";
import { OctokitApp } from "./octokitApp.js";

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
