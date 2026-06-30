const PAGE_SIZE = 5;

/**
 * Calculates pagination data for a given page
 * @param {Array} items - The array of items to paginate
 * @param {number} page - The current page number (1-indexed)
 * @returns {Object} Pagination data including paginated items, total pages, and page numbers to display
 */
export function calculatePagination(items, page = 1) {
  const validPage = Math.max(1, parseInt(page) || 1);
  let totalPages = Math.ceil(items.length / PAGE_SIZE);
  if (totalPages === 0) {
    totalPages = 1;
  }
  const validPageNumber = Math.min(validPage, totalPages);

  const startIndex = (validPageNumber - 1) * PAGE_SIZE;
  const paginatedItems = items.slice(startIndex, startIndex + PAGE_SIZE);

  // Calculate page numbers to display (current ± 2)
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
    pageSize: PAGE_SIZE,
  };
}

export { PAGE_SIZE };


