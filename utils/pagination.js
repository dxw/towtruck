const PAGE_SIZE = 12;

/**
 * Calculates pagination data for a given page
 * @param {Array} items - The array of items to paginate
 * @param {number} page - The current page number (1-indexed)
 * @param {number} [pageSize] - Optional custom page size
 * @returns {Object} Pagination data including paginated items, total pages, and page numbers to display
 */
export function calculatePagination(items, page = 1, pageSize = PAGE_SIZE) {
  const validPage = Math.max(1, parseInt(page) || 1);
  let totalPages = Math.ceil(items.length / pageSize);
  if (totalPages === 0) {
    totalPages = 1;
  }
  const validPageNumber = Math.min(validPage, totalPages);

  const startIndex = (validPageNumber - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  // Calculate page numbers to display (current  2)
  const pageNumbers = [];
  for (let i = Math.max(1, validPageNumber - 2); i <= Math.min(totalPages, validPageNumber + 2); i++) {
    pageNumbers.push(i);
  }

  return {
    items: paginatedItems,
    currentPage: validPageNumber,
    totalPages: totalPages,
    pageNumbers,
    hasPreviousPage: validPageNumber > 1,
    hasNextPage: validPageNumber < totalPages,
    pageSize,
  };
}

/**
 * Paginates items for the selected view. The row view is an AG Grid table that
 * paginates client-side, so it receives every item on a single page.
 * @param {Array} items
 * @param {number|string} page
 * @param {string} [view] - "rows" for the grid view, anything else for cards
 * @returns {Object} Pagination data as returned by `calculatePagination`
 */
export function paginateForView(items, page, view) {
  if (view === "rows") {
    return calculatePagination(items, 1, Math.max(items.length, 1));
  }
  return calculatePagination(items, page);
}

export { PAGE_SIZE };

