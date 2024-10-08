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

  const mostRecentPrOpenedAt = data.reduce((latestDate, pr) => {
    const prOpenedAt = new Date(pr.created_at);
    if (latestDate < prOpenedAt) {
      return prOpenedAt;
    }
    return latestDate;
  }, null);

  const oldestOpenPrOpenedAt = data.reduce((oldestDate, pr) => {
    if (pr.state !== "open") {
      return oldestDate;
    }

    const prOpenedAt = new Date(pr.created_at);
    if (!oldestDate || oldestDate > prOpenedAt) {
      return prOpenedAt;
    }

    return oldestDate;
  }, null);

  return { openPrCount: data?.length || 0, openBotPrCount, mostRecentPrOpenedAt, oldestOpenPrOpenedAt };
};
