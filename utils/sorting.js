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
