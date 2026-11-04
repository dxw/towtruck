/**
 * Requests the recent commits on the default branch of a given repository
 * @param {any} {octokit
 * @param {any} repository}
 * @returns {Promise<{ mostRecentNonBotCommitAt: Date | null } | {}>}
 */
export const getCommitsForRepo = async ({ octokit, repository }) => {
  try {
    const commitsUrl = repository.commits_url.replace("{/sha}", "");
    const response = await octokit.request(`${commitsUrl}?per_page=100`);
    return handleCommitsApiResponse(response);
  } catch (error) {
    console.warn(`[${repository.name}] Commits: ${error.message}`);
    return {};
  }
};

/**
 * Commits are attributed to a GitHub account when possible, but fall back to the git author name otherwise.
 * @param {any} commit
 * @returns {boolean}
 */
export const commitIsFromBot = (commit) =>
  commit?.author?.type === "Bot" ||
  !!commit?.author?.login?.endsWith("[bot]") ||
  !!commit?.commit?.author?.name?.endsWith("[bot]");

/**
 * Transforms the response from the repo commits endpoint into data relevant to Towtruck.
 * @param {any} {data}
 * @returns {{ mostRecentNonBotCommitAt: Date | null }}
 */
export const handleCommitsApiResponse = ({ data }) => {
  const mostRecentNonBotCommitAt = data.reduce((latestDate, commit) => {
    const authoredAt = commit?.commit?.author?.date;
    if (commitIsFromBot(commit) || !authoredAt) {
      return latestDate;
    }

    const commitDate = new Date(authoredAt);
    if (!latestDate || latestDate < commitDate) {
      return commitDate;
    }
    return latestDate;
  }, null);

  return { mostRecentNonBotCommitAt };
};
