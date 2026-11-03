/**
 * @typedef {Object} GridDate
 * @property {string|null} iso - ISO8601 timestamp, used for sorting.
 * @property {string|null} display - Date formatted in the user's chosen style.
 */

/**
 * @typedef {Object} GridRow
 * @property {string} name
 * @property {string} htmlUrl
 * @property {string|null} language
 * @property {number|null} openPrCount
 * @property {number|null} openBotPrCount
 * @property {GridDate} oldestOpenPrOpenedAt
 * @property {GridDate} updatedAt
 * @property {GridDate} mostRecentPrOpenedAt
 * @property {GridDate} mostRecentIssueOpenedAt
 * @property {GridDate} oldestOpenIssueOpenedAt
 * @property {number|null} openIssues
 * @property {number|null} prodCritical
 * @property {number|null} prodHigh
 * @property {number|null} prodMedium
 * @property {number|null} prodLow
 * @property {number|null} prodTotal
 * @property {number|null} devCritical
 * @property {number|null} devHigh
 * @property {number|null} devMedium
 * @property {number|null} devLow
 * @property {number|null} devTotal
 * @property {string[]} tags
 * @property {string|null} responsibleTeam
 * @property {boolean|null} hasProdAlertOlderThan14Days
 */

const gridDate = (iso, display) => ({ iso: iso ?? null, display: display ?? null });

/**
 * Maps a UI repo (from `mapRepoFromStorageToUi`) to a flat row for the AG Grid table.
 * Vulnerability fields are null when Dependabot is disabled or the prod/dev split hasn't been fetched yet.
 * @param {Object} repo
 * @returns {GridRow}
 */
export const mapRepoToGridRow = (repo) => {
  const { prodAlerts, devAlerts } = repo;

  return {
    name: repo.name,
    htmlUrl: repo.htmlUrl,
    language: repo.language ?? null,
    openPrCount: repo.openPrCount ?? null,
    openBotPrCount: repo.openBotPrCount ?? null,
    oldestOpenPrOpenedAt: gridDate(repo.oldestOpenPrOpenedAtISO8601, repo.oldestOpenPrOpenedAt),
    updatedAt: gridDate(repo.updatedAtISO8601, repo.updatedAt),
    mostRecentPrOpenedAt: gridDate(repo.mostRecentPrOpenedAtISO8601, repo.mostRecentPrOpenedAt),
    mostRecentIssueOpenedAt: gridDate(repo.mostRecentIssueOpenedAtISO8601, repo.mostRecentIssueOpenedAt),
    oldestOpenIssueOpenedAt: gridDate(repo.oldestOpenIssueOpenedAtISO8601, repo.oldestOpenIssueOpenedAt),
    openIssues: repo.openIssues ?? null,
    prodCritical: prodAlerts?.critical ?? null,
    prodHigh: prodAlerts?.high ?? null,
    prodMedium: prodAlerts?.medium ?? null,
    prodLow: prodAlerts?.low ?? null,
    prodTotal: prodAlerts?.total ?? null,
    devCritical: devAlerts?.critical ?? null,
    devHigh: devAlerts?.high ?? null,
    devMedium: devAlerts?.medium ?? null,
    devLow: devAlerts?.low ?? null,
    devTotal: devAlerts?.total ?? null,
    tags: repo.topics ?? [],
    responsibleTeam: null,
    hasProdAlertOlderThan14Days: repo.hasOpenProdAlertOlderThan14Days ?? null,
  };
};

/**
 * Serialises repos as grid rows for embedding in an inline `<script>` element.
 * `<` is escaped so repo data can't close the script element early.
 * @param {Object[]} repos
 * @returns {string}
 */
export const serialiseGridRows = (repos) => JSON.stringify(repos.map(mapRepoToGridRow)).replace(/</g, "\\u003c");
