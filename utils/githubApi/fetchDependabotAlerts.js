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
  const totalOpenAlerts = data.reduce((acc, alert) => {
    if (alert.state === "open") {
      return acc + 1;
    }
    return acc;
  }, 0);

  const lowSeverityAlerts = data.reduce((acc, alert) => {
    if (alert.state === "open" && alert.security_vulnerability.severity === "low") {
      return acc + 1;
    }
    return acc;
  }, 0);

  const mediumSeverityAlerts = data.reduce((acc, alert) => {
    if (alert.state === "open" && alert.security_vulnerability.severity === "medium") {
      return acc + 1;
    }
    return acc;
  }, 0);

  const highSeverityAlerts = data.reduce((acc, alert) => {
    if (alert.state === "open" && alert.security_vulnerability.severity === "high") {
      return acc + 1;
    }
    return acc;
  }, 0);

  const criticalSeverityAlerts = data.reduce((acc, alert) => {
    if (alert.state === "open" && alert.security_vulnerability.severity === "critical") {
      return acc + 1;
    }
    return acc;
  }, 0);

  return {
    totalOpenAlerts,
    lowSeverityAlerts,
    mediumSeverityAlerts,
    highSeverityAlerts,
    criticalSeverityAlerts,
  };
};
