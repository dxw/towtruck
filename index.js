import { createServer } from "http";
import nunjucks from "nunjucks";
import { OctokitApp } from "./octokitApp.js";
import { orgRespositoriesToUiRepositories } from "./utils.js";
import { getDependenciesForRepo } from "./renovate/dependencyDashboard.js";

nunjucks.configure({
  autoescape: true,
  watch: true,
});

const httpServer = createServer(async (request, response) => {
  if (await OctokitApp.middleware(request, response)) return;

  // Currently we only want to support single-account installations.
  // There doesn't seem to be a neat way to get the installation ID from an account name,
  // so we will use `eachInstallation` to loop (hopefully once) and just take the first (hopefully only)
  // element from `installations` so that we can have more meaningful template names in Nunjucks.
  //
  // We can enforce this one-installation approach through GitHub by configuring the app to be
  // "Only on this account" when registering the app.

  const installations = [];
  await OctokitApp.app.eachInstallation(async (octokit) => {
    const name = octokit.installation.account.login;

    const { repos, totalRepos } = await getReposForInstallation(octokit);

    for (const repo of repos) {
      repo.dependencies = await getDependenciesForRepo(octokit, repo);
    }

    installations.push({
      name,
      repos,
      totalRepos,
    });
  });

  const template = nunjucks.render("index.njk", installations[0]);

  return response.end(template);
});

const getReposForInstallation = async ({ octokit, installation }) => {
  return octokit
    .request(installation.repositories_url)
    .then(({ data }) => {
      return orgRespositoriesToUiRepositories(data);
    })
    .catch((error) => {
      console.error(error);
    });
};

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
});
