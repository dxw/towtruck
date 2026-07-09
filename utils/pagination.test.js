import { describe, it } from "node:test";
import assert from "node:assert";
import { calculatePagination, PAGE_SIZE } from "./pagination.js";

describe("calculatePagination", () => {
  it("returns the first page when no page parameter is provided", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const result = calculatePagination(items);

    assert.deepStrictEqual(result.items, Array.from({ length: 12 }, (_, i) => i + 1));
    assert.strictEqual(result.currentPage, 1);
    assert.strictEqual(result.totalPages, 3);
    assert.strictEqual(result.hasPreviousPage, false);
    assert.strictEqual(result.hasNextPage, true);
  });

  it("returns the correct page when a valid page number is provided", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const result = calculatePagination(items, 2);

    assert.deepStrictEqual(result.items, Array.from({ length: 12 }, (_, i) => i + 13));
    assert.strictEqual(result.currentPage, 2);
    assert.strictEqual(result.totalPages, 3);
    assert.strictEqual(result.hasPreviousPage, true);
    assert.strictEqual(result.hasNextPage, true);
  });

  it("returns the last page when requesting a page beyond the total", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const result = calculatePagination(items, 10);

    assert.deepStrictEqual(result.items, [25]);
    assert.strictEqual(result.currentPage, 3);
    assert.strictEqual(result.totalPages, 3);
    assert.strictEqual(result.hasPreviousPage, true);
    assert.strictEqual(result.hasNextPage, false);
  });

  it("returns page 1 when given a negative page number", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const result = calculatePagination(items, -5);

    assert.deepStrictEqual(result.items, Array.from({ length: 12 }, (_, i) => i + 1));
    assert.strictEqual(result.currentPage, 1);
    assert.strictEqual(result.hasPreviousPage, false);
  });

  it("correctly calculates page numbers to display (current page  2)", () => {
    const items = Array.from({ length: 60 }, (_, i) => i + 1);

    // Page 1: should show [1, 2, 3]
    let result = calculatePagination(items, 1);
    assert.deepStrictEqual(result.pageNumbers, [1, 2, 3]);

    // Page 3: should show [1, 2, 3, 4, 5]
    result = calculatePagination(items, 3);
    assert.deepStrictEqual(result.pageNumbers, [1, 2, 3, 4, 5]);

    // Page 5: should show [3, 4, 5]
    result = calculatePagination(items, 5);
    assert.deepStrictEqual(result.pageNumbers, [3, 4, 5]);
  });

  it("handles empty arrays", () => {
    const result = calculatePagination([], 1);

    assert.deepStrictEqual(result.items, []);
    assert.strictEqual(result.currentPage, 1);
    assert.strictEqual(result.totalPages, 1);
    assert.deepStrictEqual(result.pageNumbers, [1]);
    assert.strictEqual(result.hasPreviousPage, false);
    assert.strictEqual(result.hasNextPage, false);
  });

  it("handles single page of items", () => {
    const items = Array.from({ length: 3 }, (_, i) => i + 1);
    const result = calculatePagination(items);

    assert.deepStrictEqual(result.items, [1, 2, 3]);
    assert.strictEqual(result.currentPage, 1);
    assert.strictEqual(result.totalPages, 1);
    assert.strictEqual(result.hasPreviousPage, false);
    assert.strictEqual(result.hasNextPage, false);
  });

  it("handles exactly one page worth of items", () => {
    const items = Array.from({ length: PAGE_SIZE }, (_, i) => i + 1);
    const result = calculatePagination(items);

    assert.deepStrictEqual(result.items, Array.from({ length: PAGE_SIZE }, (_, i) => i + 1));
    assert.strictEqual(result.currentPage, 1);
    assert.strictEqual(result.totalPages, 1);
    assert.strictEqual(result.hasNextPage, false);
  });

  it("handles non-numeric page parameter", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const result = calculatePagination(items, "abc");

    assert.deepStrictEqual(result.items, Array.from({ length: 12 }, (_, i) => i + 1));
    assert.strictEqual(result.currentPage, 1);
  });

  it("handles string page numbers", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const result = calculatePagination(items, "2");

    assert.deepStrictEqual(result.items, Array.from({ length: 12 }, (_, i) => i + 13));
    assert.strictEqual(result.currentPage, 2);
  });

  it("returns correct total pages calculation", () => {
    // 25 items should give 3 pages (12 + 12 + 1)
    let result = calculatePagination(Array.from({ length: 25 }, (_, i) => i + 1));
    assert.strictEqual(result.totalPages, 3);

    // 12 items should give 1 page
    result = calculatePagination(Array.from({ length: 12 }, (_, i) => i + 1));
    assert.strictEqual(result.totalPages, 1);

    // 13 items should give 2 pages (12 + 1)
    result = calculatePagination(Array.from({ length: 13 }, (_, i) => i + 1));
    assert.strictEqual(result.totalPages, 2);
  });
});
