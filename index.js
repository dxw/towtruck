import { createServer } from "http";
import nunjucks from "nunjucks";
import { getReposFromJson, mapRepoFromStorageToUi } from "./utils/index.js";

nunjucks.configure({
  autoescape: true,
  watch: true,
});

const httpServer = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname !== "/") {
    response.writeHead(404);
    return response.end();
  }

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
