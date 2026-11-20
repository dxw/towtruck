export const HAS_ALERTS = { filterType: "number", type: "greaterThan", filter: 0 };

export const hasTag = (tag) => ({ filterType: "text", type: "hasTag", filter: tag });

export const modeFilter = (mode) => ({ filterType: "text", type: mode });

/** The query string that applies the given grid filter model */
export const filterQuery = (filterModel) => `filter=${encodeURIComponent(JSON.stringify(filterModel))}`;

/** The grid filter model held in the page's URL, or null when there isn't one */
export const urlFilterModel = (page) => JSON.parse(new URL(page.url()).searchParams.get("filter"));

/** The query string that hides the given grid columns */
export const hiddenQuery = (colIds) => `hidden=${encodeURIComponent(colIds.join(","))}`;

/** The column IDs hidden by the page's URL, or an empty array when there aren't any */
export const urlHiddenColumns = (page) => new URL(page.url()).searchParams.get("hidden")?.split(",") ?? [];
