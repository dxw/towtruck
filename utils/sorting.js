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
  switch (sortBy) {
    case "openPrCount":
      return sortByNumericValue(repos, sortDirection, "openPrCount");

    case "openBotPrCount":
      return sortByNumericValue(repos, sortDirection, "openBotPrCount");

    case "openIssues":
      return sortByNumericValue(repos, sortDirection, "openIssues");

    case "updatedAt":
      return sortByISO8601Timestamp(repos, sortDirection, "updatedAtISO8601");
    default:
      return repos;
  }
};
