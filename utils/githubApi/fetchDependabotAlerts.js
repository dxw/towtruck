/**
 * Requests Dependabot alerts for a given repository
 * @param {any} {octokit
 * @param {any} repository}
 * @returns {Promise<number>}
 */
export const getDependabotAlertsForRepo = async ({ octokit, repository }) => {
  return octokit
    .request("/repos/{owner}/{repo}/dependabot/alerts", {
      owner: repository.owner.login,
      repo: repository.name,
    })
    .then(handleDependabotAlertsApiResponse)
    .catch((error) => {
      console.error(error);
      return {};
    });
};

/**
 * Transforms the response from the Dependabot alerts endpoint into data relevant to Towtruck.
 * @param {any} {data}
 * @returns
 */
export const handleDependabotAlertsApiResponse = ({ data }) => {
  const openAlerts = data.filter((alert) => alert.state === "open");
  const totalOpenAlerts = openAlerts.length;

  const lowSeverityAlerts = openAlerts.reduce((acc, alert) => {
    if (alert.security_vulnerability.severity === "low") {
      return acc + 1;
    }
    return acc;
  }, 0);

  const mediumSeverityAlerts = openAlerts.reduce((acc, alert) => {
    if (alert.security_vulnerability.severity === "medium") {
      return acc + 1;
    }
    return acc;
  }, 0);

  const highSeverityAlerts = openAlerts.reduce((acc, alert) => {
    if (alert.security_vulnerability.severity === "high") {
      return acc + 1;
    }
    return acc;
  }, 0);

  const criticalSeverityAlerts = openAlerts.reduce((acc, alert) => {
    if (alert.security_vulnerability.severity === "critical") {
      return acc + 1;
    }
    return acc;
  }, 0);

  const oldestOpenAlertCreatedAt = openAlerts.reduce((oldest, alert) => {
    if (!alert.created_at) return oldest;

    if (!oldest) return alert.created_at;

    return new Date(alert.created_at) < new Date(oldest) ? alert.created_at : oldest;
  }, null);

  const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
  const hasOpenAlertOlderThan14Days = oldestOpenAlertCreatedAt
    ? Date.now() - new Date(oldestOpenAlertCreatedAt).getTime() > fourteenDaysInMs
    : false;

  return {
    totalOpenAlerts,
    lowSeverityAlerts,
    mediumSeverityAlerts,
    highSeverityAlerts,
    criticalSeverityAlerts,
    oldestOpenAlertCreatedAt,
    hasOpenAlertOlderThan14Days,
  };
};
