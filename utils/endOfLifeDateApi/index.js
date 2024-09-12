const END_OF_LIFE_DATE_BASE_URL = "https://endoflife.date/api";
const DEFAULT_OPTIONS = {
  method: "GET",
  headers: {
    Accept: "application/json",
  },
};

/**
 * @typedef {Object} Cycle
 * @property {number|string} cycle - Release cycle
 * @property {string} releaseDate - Release date for the first release in this cycle
 * @property {string} eol - End-of-life date for this release cycle
 * @property {string} latest - Latest release in this cycle
 * @property {string|null} link - Link to the changelog for the latest release, if available
 * @property {string|boolean|null} lts - Whether this release cycle has long-term support (LTS).
 *                                Can be a date instead if the release enters LTS on a
 *                                given date.
 * @property {string|boolean|null} support - Whether this release cycle has active support
 * @property {string|boolean|null} discontinued - Whether this cycle is now discontinued
 */

/**
 * Provides a way to interact with the endoflife.data API.
 */
export class EndOfLifeDateApiClient {
  /**
   * Gets information for all cycles of a given product.
   * @param {string} product
   * @returns {Promise<Cycle[]>}
   */
  async getAllCycles(product) {
    const url = `${END_OF_LIFE_DATE_BASE_URL}/${product}.json`;

    return await fetch(url, DEFAULT_OPTIONS)
      .then((response) => response.json())
      .catch((error) => {
        console.error(error);
        return [];
      });
  }

  /**
   * Gets information about a specific cycle of a given product.
   * @param {string} product
   * @param {number|string} cycle 
   * @returns {Promise<Cycle?>}
   */
  async getCycle(product, cycle) {
    const url = `${END_OF_LIFE_DATE_BASE_URL}/${product}/${cycle}.json`;

    return await fetch(url, DEFAULT_OPTIONS)
      .then((response) => response.json())
      .catch((error) => {
        console.error(error);
        return null;
      });
  }
}

/**
 * @typedef {"unknown"|"upToDate"|"minorUpdateAvailable"|"majorUpdateAvailable"|"endOfLife"} DependencyState
 * @
 */

/**
 * Gets the state of the given dependency according to the specified list of release cycles
 * @param {Dependency} dependency 
 * @param {Cycle[]} cycles 
 * @returns {DependencyState}
 */
export const getDependencyState = (dependency, cycles) => {
  const cycle = cycles.find((cycle) => cycle.cycle === dependency.major?.toString())
    ?? cycles.find((cycle) => cycle.cycle === dependency.major?.toString() + "." + dependency.minor?.toString())
    ?? cycles.find((cycle) => cycle.codename?.toLowerCase()?.includes(dependency.tag?.toLowerCase()));

  if (!cycle) return "unknown";

  if (new Date(cycle.eol) < Date.now()) return "endOfLife";

  if (cycle !== cycles[0]) return "majorUpdateAvailable";

  if (cycle.latest !== dependency.version) return "minorUpdateAvailable";

  return "upToDate";
};
