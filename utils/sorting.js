/**
 * @typedef {string} SortDirection
 * @enum {SortDirection}
 * @property {"asc"} ASC
 * @property {"desc"} DESC
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
 * Sorts repositories by the date they were last updated
 * @param {UiRepo[]} repos
 * @param {SortDirection} sortDirection
 * @returns {UiRepo[]}
 */
export const sortByUpdatedAt = (repos, sortDirection) => {
  if (!sortDirection) return repos;

  if (sortDirection === "asc") {
    return repos.sort((a, b) => {
      return a.updatedAtISO8601.localeCompare(b.updatedAtISO8601);
    });
  }
  return repos.sort((a, b) =>
    b.updatedAtISO8601.localeCompare(a.updatedAtISO8601)
  );
};

/**
 * Sorts repositories based on the specified type and direction.
 * @param {"openPrCount"|"openIssues"|} sortBy - The type of sorting to apply, either by open PRs count or open issues.
 * @param {SortDirection} sortDirection - The direction to sort, either "asc" for ascending or "desc" for descending.
 * @param {UiRepo[]} repos - An array of repository objects to sort.
 * @returns {UiRepo[]} The sorted array of repository objects.
 */
export const sortByType = (repos, sortDirection, sortBy) => {
  switch (sortBy) {
    case "openPrCount":
      return sortByNumericValue(repos, sortDirection, "openPrCount");

    case "openIssues":
      return sortByNumericValue(repos, sortDirection, "openIssues");

    case "updatedAt":
      return sortByUpdatedAt(repos, sortDirection);
    default:
      return repos;
  }
};
