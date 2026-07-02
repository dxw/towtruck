import { TowtruckDatabase } from '../db/index.js';

const db = new TowtruckDatabase('./e2es/testData/towtruck.db');

const now = new Date('2026-07-02T00:00:00Z');
const sixteenDaysAgo = new Date(now.getTime() - (16 * 24 * 60 * 60 * 1000)).toISOString();
const tenDaysAgo = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000)).toISOString();
const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)).toISOString();
const oneDayAgo = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString();

// govuk-blogs: stale critical alert (16 days old) + 2 more
db.saveToRepository('govuk-blogs', 'dependabotAlerts', {
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
});

// optionparser: 1 recent critical alert, not stale
db.saveToRepository('optionparser', 'dependabotAlerts', {
  totalOpenAlerts: 1,
  lowSeverityAlerts: 0,
  mediumSeverityAlerts: 0,
  highSeverityAlerts: 0,
  criticalSeverityAlerts: 1,
  oldestOpenAlertCreatedAt: oneDayAgo,
  hasOpenAlertOlderThan14Days: false,
  otherOpenAlerts: [],
  otherOpenAlertsCreatedAt: [],
});

// php-missing: no alerts
db.saveToRepository('php-missing', 'dependabotAlerts', {
  totalOpenAlerts: 0,
  lowSeverityAlerts: 0,
  mediumSeverityAlerts: 0,
  highSeverityAlerts: 0,
  criticalSeverityAlerts: 0,
  oldestOpenAlertCreatedAt: null,
  hasOpenAlertOlderThan14Days: false,
  otherOpenAlerts: [],
  otherOpenAlertsCreatedAt: [],
});

console.log('Test DB updated successfully');
const repos = db.getAllRepositories();
Object.entries(repos).forEach(([key, repo]) => {
  console.log(key, JSON.stringify(repo.dependabotAlerts));
});

