import { createServer } from "http";
import { Octokit } from "@octokit/rest";
import nunjucks from "nunjucks";

nunjucks.configure({
  autoescape: true,
  watch: true,
});

const ACCESS_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

const octokit = new Octokit({
  auth: ACCESS_TOKEN,
});

const httpServer = createServer(async (_, response) => {
  const repos = await getRepos({ org: "dxw" });

  const template = nunjucks.render("index.njk", {
    repos,
  });

  return response.end(template);
});

const getRepos = async ({ org }) => {
  return octokit
    .request(`GET /orgs/${org}/repos`, {
      org,
    })
    .then(({ data }) => {
      return data.map((repo) => ({
        name: repo.name,
      }));
    })
    .catch((error) => {
      console.error(error);
    });
};

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
});
