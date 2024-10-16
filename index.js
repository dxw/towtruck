import { createServer } from "http";
import nunjucks from "nunjucks";
import { mapRepoFromStorageToUi } from "./utils/index.js";
import { getQueryParams } from "./utils/queryParams.js";
import { sortByType } from "./utils/sorting.js";
import { TowtruckDatabase } from "./db/index.js";
import { handleWebhooks } from "./webhooks/index.js";
import { handleOAuthCallback, getTokenOrPromptForLogin } from "./auth/index.js";

nunjucks.configure({
  autoescape: true,
  watch: true,
});

const httpServer = createServer(async (request, response) => {
  if (await handleOAuthCallback(request, response)) return;
  if (await handleWebhooks(request, response)) return;

  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname !== "/") {
    response.writeHead(404);
    return response.end();
  }

  const token = await getTokenOrPromptForLogin(request, response);

  if (!token) return;

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
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
});
