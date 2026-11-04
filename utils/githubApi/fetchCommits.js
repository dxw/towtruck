const NON_BOT_COMMIT_SAMPLE_SIZE = 100;
const MAX_PAGES = 5;
const PER_PAGE = 100;
// A commit this much older than the newest commit counts for half as much when finding the top committer
const COMMIT_WEIGHT_HALF_LIFE_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * @typedef {Object} TopCommitter
 * @property {string} name - The git author name from their most recent commit.
 * @property {string|null} login - Their GitHub username, if the commits are linked to a GitHub account.
 */

/**
 * @typedef {Object} CommitInfo
 * @property {Date|null} mostRecentNonBotCommitAt
 * @property {TopCommitter|null} topCommitter - The person with the most recent non-bot commits, weighted by recency.
 */

/**
 * Requests recent commits on the default branch of a given repository, paging back until enough non-bot commits
 * have been seen to work out who works on it most (or the page limit is reached).
 * @param {any} {octokit
 * @param {any} repository}
 * @returns {Promise<CommitInfo | {}>}
 */
export const getCommitsForRepo = async ({ octokit, repository }) => {
  const commits = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const pageQuery = page === 1 ? "" : `&page=${page}`;
    try {
      const commitsUrl = repository.commits_url.replace("{/sha}", "");
      const { data } = await octokit.request(`${commitsUrl}?per_page=${PER_PAGE}${pageQuery}`);
      commits.push(...data);
      if (data.length < PER_PAGE || commits.filter((commit) => !commitIsFromBot(commit)).length >= NON_BOT_COMMIT_SAMPLE_SIZE) {
        break;
      }
    } catch (error) {
      console.warn(`[${repository.name}] Commits: ${error.message}`);
      if (page === 1) {
        return {};
      }
      break;
    }
  }

  return handleCommitsApiResponse({ data: commits });
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
 * Finds the person with the most commits, with each commit's weight halving for every 90 days it is older than the
 * newest commit. Commits are grouped by GitHub account where possible so that commits made under different git
 * author names are counted together. Commits without a date are ignored. Ties go to whoever committed most recently.
 * @param {any[]} commits - Non-bot commits, most recent first.
 * @returns {TopCommitter|null}
 */
export const findTopCommitter = (commits) => {
  const datedCommits = commits
    .map((commit) => ({ commit, time: new Date(commit?.commit?.author?.date).getTime() }))
    .filter(({ time }) => !Number.isNaN(time));
  const newestTime = Math.max(...datedCommits.map(({ time }) => time));
  const committers = new Map();

  for (const { commit, time } of datedCommits) {
    const login = commit?.author?.login ?? null;
    const name = commit?.commit?.author?.name || login;
    if (!name) {
      continue;
    }

    const weight = 0.5 ** ((newestTime - time) / COMMIT_WEIGHT_HALF_LIFE_MS);
    const key = login ? `login:${login}` : `name:${name}`;
    const committer = committers.get(key);
    if (committer) {
      committer.score += weight;
    } else {
      committers.set(key, { name, login, score: weight });
    }
  }

  let top = null;
  for (const committer of committers.values()) {
    if (!top || committer.score > top.score) {
      top = committer;
    }
  }

  return top && { name: top.name, login: top.login };
};

/**
 * Transforms the response from the repo commits endpoint into data relevant to Towtruck.
 * @param {any} {data} - Commits, most recent first.
 * @returns {CommitInfo}
 */
export const handleCommitsApiResponse = ({ data }) => {
  const nonBotCommits = data.filter((commit) => !commitIsFromBot(commit));

  const mostRecentNonBotCommitAt = nonBotCommits.reduce((latestDate, commit) => {
    const authoredAt = commit?.commit?.author?.date;
    if (!authoredAt) {
      return latestDate;
    }

    const commitDate = new Date(authoredAt);
    if (!latestDate || latestDate < commitDate) {
      return commitDate;
    }
    return latestDate;
  }, null);

  const topCommitter = findTopCommitter(nonBotCommits.slice(0, NON_BOT_COMMIT_SAMPLE_SIZE));

  return { mostRecentNonBotCommitAt, topCommitter };
};
