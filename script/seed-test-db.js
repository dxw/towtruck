import { TowtruckDatabase } from '../db/index.js';
import { unlink } from 'fs/promises';

// Rebuild the test database from scratch with correct key format (org/repo-name)
await unlink('./e2es/testData/towtruck.db').catch(() => {});

const db = new TowtruckDatabase('./e2es/testData/towtruck.db');

const now = new Date('2026-07-02T00:00:00Z');
const sixteenDaysAgo = new Date(now.getTime() - (16 * 24 * 60 * 60 * 1000)).toISOString();
const tenDaysAgo = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000)).toISOString();
const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)).toISOString();
const oneDayAgo = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString();

const repos = [
  {
    name: 'govuk-blogs',
    main: {
      name: 'govuk-blogs',
      owner: 'dxw',
      description: 'This is the theme in use for the blogs hosted at blog.gov.uk.',
      htmlUrl: 'https://github.com/dxw/govuk-blogs',
      apiUrl: 'https://api.github.com/repos/dxw/govuk-blogs',
      pullsUrl: 'https://api.github.com/repos/dxw/govuk-blogs/pulls{/number}',
      issuesUrl: 'https://api.github.com/repos/dxw/govuk-blogs/issues{/number}',
      updatedAt: '2024-09-04T09:02:48Z',
      language: 'PHP',
      topics: ['govpress', 'wordpress-theme'],
      openIssues: 1,
    },
    pullRequests: {
      openPrCount: 20,
      openBotPrCount: 10,
      mostRecentPrOpenedAt: '2024-04-04T12:34:56.000Z',
      oldestOpenPrOpenedAt: '2021-01-01T12:34:56.000Z',
    },
    issues: {
      mostRecentIssueOpenedAt: '2024-04-04T12:34:56.000Z',
      oldestOpenIssueOpenedAt: '2021-01-01T12:34:56.000Z',
    },
    dependabotAlerts: {
      totalOpenAlerts: 3,
      lowSeverityAlerts: 1,
      mediumSeverityAlerts: 0,
      highSeverityAlerts: 1,
      criticalSeverityAlerts: 1,
      oldestOpenAlertCreatedAt: sixteenDaysAgo,
      hasOpenAlertOlderThan14Days: true,
      otherOpenAlerts: [
        { createdAt: tenDaysAgo, severity: 'high' },
        { createdAt: twoDaysAgo, severity: 'low' },
      ],
      otherOpenAlertsCreatedAt: [tenDaysAgo, twoDaysAgo],
    },
    dependencies: [],
  },
  {
    name: 'optionparser',
    main: {
      name: 'optionparser',
      owner: 'dxw',
      description: 'Command-line option parser for PHP (forked with a `v1.0.0`)',
      htmlUrl: 'https://github.com/dxw/optionparser',
      apiUrl: 'https://api.github.com/repos/dxw/optionparser',
      pullsUrl: 'https://api.github.com/repos/dxw/optionparser/pulls{/number}',
      issuesUrl: 'https://api.github.com/repos/dxw/optionparser/issues{/number}',
      updatedAt: '2024-07-08T12:39:14Z',
      language: 'PHP',
      topics: ['composer', 'govpress', 'packagist', 'php'],
      openIssues: 10,
    },
    pullRequests: {
      openPrCount: 0,
      openBotPrCount: 0,
      mostRecentPrOpenedAt: null,
      oldestOpenPrOpenedAt: null,
    },
    issues: {
      mostRecentIssueOpenedAt: '2024-04-04T12:34:56.000Z',
      oldestOpenIssueOpenedAt: '2021-01-01T12:34:56.000Z',
    },
    dependabotAlerts: {
      totalOpenAlerts: 1,
      lowSeverityAlerts: 0,
      mediumSeverityAlerts: 0,
      highSeverityAlerts: 0,
      criticalSeverityAlerts: 1,
      oldestOpenAlertCreatedAt: oneDayAgo,
      hasOpenAlertOlderThan14Days: false,
      otherOpenAlerts: [],
      otherOpenAlertsCreatedAt: [],
    },
    dependencies: [],
  },
  {
    name: 'php-missing',
    main: {
      name: 'php-missing',
      owner: 'dxw',
      description: "Some functions missing from PHP's stdlib",
      htmlUrl: 'https://github.com/dxw/php-missing',
      apiUrl: 'https://api.github.com/repos/dxw/php-missing',
      pullsUrl: 'https://api.github.com/repos/dxw/php-missing/pulls{/number}',
      issuesUrl: 'https://api.github.com/repos/dxw/php-missing/issues{/number}',
      updatedAt: '2024-07-18T18:12:43Z',
      language: 'PHP',
      topics: ['composer', 'govpress', 'packagist', 'php'],
      openIssues: 7,
    },
    pullRequests: {
      openPrCount: 200,
      openBotPrCount: 3,
      mostRecentPrOpenedAt: '2024-04-04T12:34:56.000Z',
      oldestOpenPrOpenedAt: '2021-01-01T12:34:56.000Z',
    },
    issues: {
      mostRecentIssueOpenedAt: '2024-04-04T12:34:56.000Z',
      oldestOpenIssueOpenedAt: '2021-01-01T12:34:56.000Z',
    },
    dependabotAlerts: {
      totalOpenAlerts: 0,
      lowSeverityAlerts: 0,
      mediumSeverityAlerts: 0,
      highSeverityAlerts: 0,
      criticalSeverityAlerts: 0,
      oldestOpenAlertCreatedAt: null,
      hasOpenAlertOlderThan14Days: false,
      otherOpenAlerts: [],
      otherOpenAlertsCreatedAt: [],
    },
    dependencies: [],
  },
];

for (const repo of repos) {
  const key = `dxw/${repo.name}`;
  db.saveToRepository(key, 'main', repo.main);
  db.saveToRepository(key, 'owner', repo.main.owner);
  db.saveToRepository(key, 'pullRequests', repo.pullRequests);
  db.saveToRepository(key, 'issues', repo.issues);
  db.saveToRepository(key, 'dependabotAlerts', repo.dependabotAlerts);
  db.saveToRepository(key, 'dependencies', repo.dependencies);
}

console.log('Test DB rebuilt successfully');
const allRepos = db.getAllRepositories();
console.log('All keys:', Object.keys(allRepos));
const dxwRepos = db.getAllRepositoriesForOrg('dxw');
console.log('dxw repos:', Object.keys(dxwRepos));
