export const orgRespositoriesToUiRepositories = (apiResponse) => {
  const repos = apiResponse.repositories.map((repo) => ({
    name: repo.name,
    updatedAt: new Date(repo.updated_at).toLocaleDateString(),
    url: repo.html_url,
    issuesUrl: repo.issues_url,
    description: repo.description,
  }));
  const totalRepos = apiResponse.total_count;

  return { repos, totalRepos };
};
