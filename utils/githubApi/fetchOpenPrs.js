/**
 * Requests the open PRs for a given repository
 * @param {any} {octokit
 * @param {any} repository}
 * @returns {Promise<number>}
 */
export const getOpenPRsForRepo = async ({ octokit, repository }) => {
  return octokit.request(repository.pulls_url).then(handlePrsApiResponse);
};

const depdencyUpdateBots = ["renovate[bot]", "dependabot[bot]"];

/**
 * Returns the length of the PRs array or 0 if there are no PRs
 * @param {any} {data}
 * @returns {number}
 */
export const handlePrsApiResponse = ({ data }) => {
  const openBotPrCount = data.reduce((acc, pr) => {
    if (depdencyUpdateBots.includes(pr?.user?.login)) {
      return acc + 1;
    }
    return acc;
  }, 0);

  return { openPrCount: data?.length || 0, openBotPrCount };
};
