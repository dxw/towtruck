/**
 * @typedef {Object} GridDate
 * @property {string|null} iso - ISO8601 timestamp, used for sorting.
 * @property {string|null} display - Date formatted in the user's chosen style.
 */

/**
 * @typedef {Object} GridRow
 * @property {string} name
 * @property {string} htmlUrl
 * @property {string|null} description
 * @property {string|null} language
 * @property {"public"|"private"|"internal"|null} visibility
 * @property {number|null} openPrCount
 * @property {number|null} openBotPrCount
 * @property {GridDate} oldestOpenPrOpenedAt
 * @property {GridDate} updatedAt
 * @property {GridDate} mostRecentNonBotCommitAt
 * @property {GridDate} mostRecentPrOpenedAt
 * @property {GridDate} mostRecentIssueOpenedAt
 * @property {GridDate} oldestOpenIssueOpenedAt
 * @property {number|null} openIssues
 * @property {number|null} runtimeCritical
 * @property {number|null} runtimeHigh
 * @property {number|null} runtimeMedium
 * @property {number|null} runtimeLow
 * @property {number|null} runtimeTotal
 * @property {number|null} devCritical
 * @property {number|null} devHigh
 * @property {number|null} devMedium
 * @property {number|null} devLow
 * @property {number|null} devTotal
 * @property {string[]} tags
 * @property {string|null} responsibleTeam
 * @property {boolean|null} hasRuntimeAlertOlderThan14Days
 * @property {GridEndOfLifeDependency[]} endOfLifeDependencies
 */

/**
 * @typedef {Object} GridEndOfLifeDependency
 * @property {string} name
 * @property {string|null} version
 * @property {"ended"|"endingSoon"} status
 * @property {string|null} date - ISO8601 end-of-life date.
 * @property {string|null} relative - e.g. "in 3 months" or "2 years ago".
 */

const gridDate = (iso, display) => ({ iso: iso ?? null, display: display ?? null });

/**
 * @param {import("./index.js").UiDependency[]} [dependencies]
 * @returns {GridEndOfLifeDependency[]}
 */
const mapEndOfLifeDependencies = (dependencies = []) =>
  dependencies
    .filter((dependency) => dependency.isOutOfSupport || dependency.isEndOfLifeSoon)
    .map((dependency) => ({
      name: dependency.name,
      version: dependency.version ?? null,
      status: dependency.isOutOfSupport ? "ended" : "endingSoon",
      date: dependency.endOfLifeDate?.toISOString() ?? null,
      relative: dependency.endOfLifeRelative ?? null,
    }));

/**
 * Maps a UI repo (from `mapRepoFromStorageToUi`) to a flat row for the AG Grid table.
 * Vulnerability fields are null when Dependabot is disabled or the runtime/dev split hasn't been fetched yet.
 * @param {Object} repo
 * @returns {GridRow}
 */
export const mapRepoToGridRow = (repo) => {
  const { runtimeAlerts, devAlerts } = repo;

  return {
    name: repo.name,
    htmlUrl: repo.htmlUrl,
    description: repo.description || null,
    language: repo.language ?? null,
    visibility: repo.visibility ?? null,
    openPrCount: repo.openPrCount ?? null,
    openBotPrCount: repo.openBotPrCount ?? null,
    oldestOpenPrOpenedAt: gridDate(repo.oldestOpenPrOpenedAtISO8601, repo.oldestOpenPrOpenedAt),
    updatedAt: gridDate(repo.updatedAtISO8601, repo.updatedAt),
    mostRecentNonBotCommitAt: gridDate(repo.mostRecentNonBotCommitAtISO8601, repo.mostRecentNonBotCommitAt),
    mostRecentPrOpenedAt: gridDate(repo.mostRecentPrOpenedAtISO8601, repo.mostRecentPrOpenedAt),
    mostRecentIssueOpenedAt: gridDate(repo.mostRecentIssueOpenedAtISO8601, repo.mostRecentIssueOpenedAt),
    oldestOpenIssueOpenedAt: gridDate(repo.oldestOpenIssueOpenedAtISO8601, repo.oldestOpenIssueOpenedAt),
    openIssues: repo.openIssues ?? null,
    runtimeCritical: runtimeAlerts?.critical ?? null,
    runtimeHigh: runtimeAlerts?.high ?? null,
    runtimeMedium: runtimeAlerts?.medium ?? null,
    runtimeLow: runtimeAlerts?.low ?? null,
    runtimeTotal: runtimeAlerts?.total ?? null,
    devCritical: devAlerts?.critical ?? null,
    devHigh: devAlerts?.high ?? null,
    devMedium: devAlerts?.medium ?? null,
    devLow: devAlerts?.low ?? null,
    devTotal: devAlerts?.total ?? null,
    tags: repo.topics ?? [],
    responsibleTeam: null,
    hasRuntimeAlertOlderThan14Days: repo.hasOpenRuntimeAlertOlderThan14Days ?? null,
    endOfLifeDependencies: mapEndOfLifeDependencies(repo.dependencies),
  };
};

/**
 * Serialises repos as grid rows for embedding in an inline `<script>` element.
 * `<` is escaped so repo data can't close the script element early.
 * @param {Object[]} repos
 * @returns {string}
 */
export const serialiseGridRows = (repos) => JSON.stringify(repos.map(mapRepoToGridRow)).replace(/</g, "\\u003c");
