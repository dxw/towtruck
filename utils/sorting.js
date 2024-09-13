/**
 * @typedef {string} SortDirection
 * @enum {SortDirection}
 * @property {"asc"} ASC
 * @property {"desc"} DESC
 */

/**
 * Sorts repos by the number of open PRs
 * @param {UiRepo[]} repos
 * @param {SortDirection} sortDirection
 * @returns {UiRepo[]}
 */
export const sortByOpenPrs = (repos, sortDirection) => {
  if (!sortDirection) return repos;
  if (sortDirection === "asc") {
    return repos.sort((a, b) => a.openPrsCount - b.openPrsCount);
  }
  return repos.sort((a, b) => b.openPrsCount - a.openPrsCount);
};

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
