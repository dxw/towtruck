/**
 * Requests the open PRs for a given repository
 * @param {any} {octokit
 * @param {any} repository}
 * @returns {Promise<number>}
 */
export const getOpenPRsForRepo = async ({ octokit, repository }) => {
  const pullsUrl = repository.pulls_url.replace("{/number}", "");

  return Promise.all([
    octokit.request(repository.pulls_url).then(handlePrsApiResponse),
    octokit.request(`${pullsUrl}?state=closed&sort=updated&direction=desc&per_page=100`)
      .then(({ data }) => handleClosedBotPrsResponse(data)),
  ]).then(([openPrInfo, closedBotPrInfo]) => ({
    ...openPrInfo,
    ...closedBotPrInfo,
  })).catch((error) => {
    console.error(error);
    return {};
  });
};

const depdencyUpdateBots = ["renovate[bot]", "dependabot[bot]"];

/**
 * Returns the most recent closed_at date among PRs authored by dependency update bots
 * @param {any[]} data
 * @returns {{ mostRecentBotPrClosedAt: Date | null }}
 */
export const handleClosedBotPrsResponse = (data) => {
  const mostRecentBotPrClosedAt = data.reduce((latestDate, pr) => {
    if (!depdencyUpdateBots.includes(pr?.user?.login)) {
      return latestDate;
    }

    const closedAt = new Date(pr.closed_at);
    if (!latestDate || latestDate < closedAt) {
      return closedAt;
    }
    return latestDate;
  }, null);

  return { mostRecentBotPrClosedAt };
};

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
