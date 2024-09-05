import { createServer } from "http";
import { Octokit } from "@octokit/rest";

const ACCESS_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

const octokit = new Octokit({
  auth: ACCESS_TOKEN,
});

const httpServer = createServer(async (_, response) => {
  const repos = await getRepos({ org: "dxw" });

  return response.end(JSON.stringify(repos));
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
