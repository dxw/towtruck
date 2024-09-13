export const getOpenPRsForRepo = ({ octokit, repository }) => {
  return octokit.request(repository.pulls_url).then(handlePrsApiResponse);
};

export const handlePrsApiResponse = ({ data }) => data?.length || 0;
