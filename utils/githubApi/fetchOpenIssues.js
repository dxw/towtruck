/**
 * Requests the open issues for a given repository
 * @param {any} {octokit
 * @param {any} repository}
 * @returns {Issueomise<number>}
 */
export const getOpenIssuesForRepo = async ({ octokit, repository }) => {
  return octokit.request(repository.issues_url).then(handleIssuesApiResponse);
};

const issueIsPullRequest = (issue) => issue.pull_request !== undefined;
const issueIsBotIssue = (issue) => issue.user.login === "renovate[bot]"

/**
 * Transforms the response from the repo issues endpoint into data relevant to Towtruck.
 * @param {any} {data} 
 * @returns
 */
export const handleIssuesApiResponse = ({ data }) => {
  const mostRecentIssueOpenedAt = data.reduce((latestDate, issue) => {
    if (issueIsPullRequest(issue) || issueIsBotIssue(issue)) {
      return latestDate;
    }

    const issueOpenedAt = new Date(issue.created_at);
    if (latestDate < issueOpenedAt) {
      return issueOpenedAt;
    }

    return latestDate;
  }, null);

  const oldestOpenIssueOpenedAt = data.reduce((oldestDate, issue) => {
    if (issue.state !== "open" || issueIsPullRequest(issue) || issueIsBotIssue(issue)) {
      return oldestDate;
    }

    const issueOpenedAt = new Date(issue.created_at);
    if (!oldestDate || oldestDate > issueOpenedAt) {
      return issueOpenedAt;
    }

    return oldestDate;
  }, null);

  return { mostRecentIssueOpenedAt, oldestOpenIssueOpenedAt };
};
