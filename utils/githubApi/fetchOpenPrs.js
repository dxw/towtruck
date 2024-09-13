/**
 * Requests the open PRs for a given repository
 * @param {any} {octokit
 * @param {any} repository}
 * @returns {Promise<number>}
 */
export const getOpenPRsForRepo = async ({ octokit, repository }) => {
  return octokit.request(repository.pulls_url).then(handlePrsApiResponse);
};

/**
 * Returns the length of the PRs array or 0 if there are no PRs
 * @param {any} {data}
 * @returns {number}
 */
export const handlePrsApiResponse = ({ data }) => data?.length || 0;
