/**
 * Returns the sortDirection and sortBy query parameters from the request
 * @param {URL} url
 * @returns {Object} - Object containing the sortDirection and sortBy query parameters, they will be null if they aren't present
 */
export const getQueryParams = (url) => {
  const [sortBy, sortDirection] = ["sortBy", "sortDirection"].map((param) => {
    return url.searchParams.get(param);
  });

  return { sortBy, sortDirection };
};
