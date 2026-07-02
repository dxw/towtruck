/**
 * Filters repositories based on alert criteria
 * @param {Array} repos - Array of repository objects
 * @param {string} alertFilter - The alert filter to apply ('criticalOnly', 'anyAlerts', or falsy for no filter)
 * @returns {Array} Filtered repositories
 */
export function filterByAlerts(repos, alertFilter) {
  if (!alertFilter) return repos;

  if (alertFilter === "criticalOnly") {
    return repos.filter((repo) => repo.criticalSeverityAlerts && repo.criticalSeverityAlerts > 0);
  }

  if (alertFilter === "anyAlerts") {
    return repos.filter((repo) => repo.totalOpenAlerts && repo.totalOpenAlerts > 0);
  }

  return repos;
}

