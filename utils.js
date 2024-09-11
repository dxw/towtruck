export const mapRepoFromStorageToUi = (persistedData) => {
  const mappedRepos = persistedData.repos.map((repo) => {
    const newDate = new Date(repo.updatedAt).toLocaleDateString();
    return {
      ...repo,
      updatedAt: newDate,
    };
  });

  const totalRepos = mappedRepos.length;

  return { ...persistedData, repos: mappedRepos, totalRepos };
};

export const mapRepoFromApiForStorage = (repo) => ({
  name: repo.name,
  description: repo.description,
  htmlUrl: repo.html_url,
  apiUrl: repo.url,
  pullsUrl: repo.pulls_url,
  issuesUrl: repo.issues_url,
  updatedAt: repo.updated_at,
  language: repo.language,
  topics: repo.topics,
  openIssues: repo.open_issues,
});
