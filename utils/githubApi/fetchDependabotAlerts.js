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
      console.warn(`[${repository.name}] Dependabot alerts: ${error.message}`);
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

  const openAlertsOldestFirst = openAlerts
    .filter((alert) => Boolean(alert.created_at))
    .sort((first, second) => new Date(first.created_at) - new Date(second.created_at));

  const oldestOpenAlertCreatedAt = openAlertsOldestFirst[0]?.created_at ?? null;

  const otherOpenAlerts = openAlertsOldestFirst.slice(1).map((alert) => ({
    createdAt: alert.created_at,
    severity: alert.security_vulnerability.severity,
  }));

  // Keep this legacy shape for compatibility with existing mappings/tests.
  const otherOpenAlertsCreatedAt = otherOpenAlerts.map((alert) => alert.createdAt);

  const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
  const isOlderThan14Days = (createdAt) =>
    Boolean(createdAt) && Date.now() - new Date(createdAt).getTime() > fourteenDaysInMs;

  const hasOpenAlertOlderThan14Days = isOlderThan14Days(oldestOpenAlertCreatedAt);

  const runtimeOpenAlerts = openAlerts.filter(isRuntimeAlert);
  const devOpenAlerts = openAlerts.filter((alert) => !isRuntimeAlert(alert));

  return {
    totalOpenAlerts,
    lowSeverityAlerts,
    mediumSeverityAlerts,
    highSeverityAlerts,
    criticalSeverityAlerts,
    oldestOpenAlertCreatedAt,
    otherOpenAlerts,
    otherOpenAlertsCreatedAt,
    hasOpenAlertOlderThan14Days,
    runtimeAlerts: countAlertsBySeverity(runtimeOpenAlerts),
    devAlerts: countAlertsBySeverity(devOpenAlerts),
    hasOpenRuntimeAlertOlderThan14Days: runtimeOpenAlerts.some((alert) => isOlderThan14Days(alert.created_at)),
  };
};

/**
 * Dependabot reports `dependency.scope` as "runtime", "development" or null (unknown).
 * Unknown scopes are treated as runtime so they aren't under-reported.
 * @param {any} alert
 * @returns {boolean}
 */
const isRuntimeAlert = (alert) => alert.dependency?.scope !== "development";

/**
 * @typedef {Object} AlertCounts
 * @property {number} critical
 * @property {number} high
 * @property {number} medium
 * @property {number} low
 * @property {number} total
 */

/**
 * @param {any[]} alerts
 * @returns {AlertCounts}
 */
const countAlertsBySeverity = (alerts) => {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, total: alerts.length };
  for (const alert of alerts) {
    const severity = alert.security_vulnerability?.severity;
    if (SEVERITIES.includes(severity)) {
      counts[severity] += 1;
    }
  }
  return counts;
};

const SEVERITIES = ["critical", "high", "medium", "low"];
