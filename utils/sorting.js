/**
 * @typedef {string} SortDirection
 * @enum {SortDirection}
 * @property {"asc"} ASC
 * @property {"desc"} DESC
 */
/**
 * @typedef {import('./index').UiRepo} UiRepo
 */

/**
 * Sorts repos by the a numeric value
 * @param {UiRepo[]} repos
 * @param {SortDirection} sortDirection
 * @param {string} key - The key to sort by
 * @returns {UiRepo[]}
 */
export const sortByNumericValue = (repos, sortDirection, key) => {
  if (!sortDirection) return repos;
  if (sortDirection === "asc") {
    return repos.sort((a, b) => a[key] - b[key]);
  }
  return repos.sort((a, b) => b[key] - a[key]);
};

/**
 * Compares two strings in lexicographical order.
 * @param {string?} first 
 * @param {string?} second 
 * @returns {number}
 */
const lexicographicalSort = (first, second, ascending) => {
  if (!first) return 1;
  if (!second) return -1;

  if (ascending) return first.localeCompare(second);
  return second.localeCompare(first);
}

/**
 * Sorts repos by a timestamp value in ISO 8601 (`YYYY-MM-DDThh:mm:ssZ`) format
 * @param {UiRepo[]} repos 
 * @param {SortDirection} sortDirection 
 * @param {string} key 
 * @returns {UiRepo[]}
 */
export const sortByISO8601Timestamp = (repos, sortDirection, key) => {
  if (!sortDirection) return repos;

  return repos.sort((a, b) => lexicographicalSort(a[key], b[key], sortDirection === "asc"));
}

/**
 * Sorts repositories based on the specified type and direction.
 * @param {"openPrCount"|"openBotPrCount"|"openIssues"|} sortBy - The type of sorting to apply, either by open PRs count or open issues.
 * @param {SortDirection} sortDirection - The direction to sort, either "asc" for ascending or "desc" for descending.
 * @param {UiRepo[]} repos - An array of repository objects to sort.
 * @returns {UiRepo[]} The sorted array of repository objects.
 */
export const sortByType = (repos, sortDirection, sortBy) => {
  if (!sortBy) {
    return sortByNumericValue(repos, "desc", "openBotPrCount");
  }

  const safeSortDirection = sortDirection || "desc";

  switch (sortBy) {
    case "openPrCount":
      return sortByNumericValue(repos, safeSortDirection, "openPrCount");

    case "openBotPrCount":
      return sortByNumericValue(repos, safeSortDirection, "openBotPrCount");

    case "openIssues":
      return sortByNumericValue(repos, safeSortDirection, "openIssues");

    case "updatedAt":
      return sortByISO8601Timestamp(repos, safeSortDirection, "updatedAtISO8601");

    case "mostRecentPrOpenedAt":
      return sortByISO8601Timestamp(repos, safeSortDirection, "mostRecentPrOpenedAtISO8601");

    case "oldestOpenPrOpenedAt":
      return sortByISO8601Timestamp(repos, safeSortDirection, "oldestOpenPrOpenedAtISO8601");

    case "mostRecentIssueOpenedAt":
      return sortByISO8601Timestamp(repos, safeSortDirection, "mostRecentIssueOpenedAtISO8601");

    case "oldestOpenIssueOpenedAt":
      return sortByISO8601Timestamp(repos, safeSortDirection, "oldestOpenIssueOpenedAtISO8601");

    default:
      return sortByNumericValue(repos, "desc", "openBotPrCount");
  }
};
