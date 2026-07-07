import nodemailer from "nodemailer";
import { TowtruckDatabase } from "../db/index.js";
import { mapRepoFromStorageToUi } from "../utils/index.js";
import { filterByTags } from "../utils/tagFiltering.js";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || "towtruck@dxw.com";

/**
 * Creates a nodemailer transport
 */
const createTransport = () => {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

/**
 * Gets repos matching a subscription's criteria
 * @param {object} subscription
 * @param {object[]} allRepos
 * @returns {object[]}
 */
export const getMatchingRepos = (subscription, allRepos) => {
  let matchedRepos = [];

  // Filter by tags
  if (subscription.tags && subscription.tags.length) {
    const tagMatched = filterByTags(allRepos, subscription.tags);
    matchedRepos.push(...tagMatched);
  }

  // Filter by critical alerts
  if (subscription.criticalAlerts) {
    const criticalRepos = allRepos.filter((repo) => (repo.criticalSeverityAlerts ?? 0) > 0);
    criticalRepos.forEach((repo) => {
      if (!matchedRepos.some((r) => r.name === repo.name)) {
        matchedRepos.push(repo);
      }
    });
  }

  return matchedRepos;
};

/**
 * Builds an HTML email body from the matched repos
 * @param {object} subscription
 * @param {object[]} repos
 * @returns {string}
 */
export const buildEmailBody = (subscription, repos) => {
  if (!repos.length) {
    return `<p>No repos currently match your subscription criteria for <strong>${subscription.org}</strong>.</p>
<p>Your settings: ${subscription.tags.length ? `Tags: ${subscription.tags.join(", ")}` : ""}${subscription.criticalAlerts ? " | Critical alerts: enabled" : ""}</p>`;
  }

  const repoRows = repos.map((repo) => {
    const alerts = repo.criticalSeverityAlerts
      ? `<span style="color: #dc2626; font-weight: bold;">${repo.criticalSeverityAlerts} critical</span>`
      : "<span style=\"color: #6b7280;\">0 critical</span>";

    const tags = (repo.topics || []).join(", ");

    return `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="${repo.htmlUrl}">${repo.name}</a></td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${alerts} / ${repo.totalOpenAlerts ?? 0} total</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${repo.openBotPrCount ?? 0} bot PRs, ${repo.openPrCount ?? 0} total</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${tags}</td>
    </tr>`;
  });

  return `<h2>Weekly Towtruck Report — ${subscription.org}</h2>
<p>Here are the repos matching your subscription (${repos.length} repo${repos.length === 1 ? "" : "s"}):</p>
<table style="border-collapse: collapse; width: 100%; font-size: 14px;">
  <thead>
    <tr style="background: #f1f5f9;">
      <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1;">Repo</th>
      <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1;">Alerts</th>
      <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1;">PRs</th>
      <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1;">Tags</th>
    </tr>
  </thead>
  <tbody>
    ${repoRows.join("\n    ")}
  </tbody>
</table>
<p style="margin-top: 16px; font-size: 12px; color: #6b7280;">
  Your settings: ${subscription.tags.length ? `Tags: ${subscription.tags.join(", ")}` : "No tag filter"}${subscription.criticalAlerts ? " | Critical alerts: enabled" : ""}
</p>`;
};

/**
 * Sends email updates for all subscriptions
 */
const main = async () => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error("Error: SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables are required.");
    process.exit(1);
  }

  const db = new TowtruckDatabase();
  const allSubscriptions = db.getAllEmailSubscriptions();

  const subscriptionList = Object.values(allSubscriptions)
    .map((sub) => sub.preferences)
    .filter(Boolean);

  if (!subscriptionList.length) {
    console.info("No email subscriptions found. Nothing to send.");
    return;
  }

  console.info(`Processing ${subscriptionList.length} email subscription(s)...`);

  const transport = createTransport();

  for (const subscription of subscriptionList) {
    const persistedRepoData = db.getAllRepositoriesForOrg(subscription.org);
    const persistedLifetimeData = db.getAllDependencies();
    const { repos } = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData);

    const matchedRepos = getMatchingRepos(subscription, repos);

    // Skip sending if no criteria matched and no repos found
    if (!subscription.tags.length && !subscription.criticalAlerts) {
      console.info(`  Skipping ${subscription.userEmail} — no criteria configured.`);
      continue;
    }

    const html = buildEmailBody(subscription, matchedRepos);
    const subject = matchedRepos.length
      ? `Towtruck: ${matchedRepos.length} repo${matchedRepos.length === 1 ? "" : "s"} need attention (${subscription.org})`
      : `Towtruck: All clear for ${subscription.org}`;

    try {
      await transport.sendMail({
        from: EMAIL_FROM,
        to: subscription.userEmail,
        subject,
        html,
      });
      console.info(`  ✓ Sent to ${subscription.userEmail} (${matchedRepos.length} repos)`);
    } catch (error) {
      console.error(`  ✗ Failed to send to ${subscription.userEmail}:`, error.message);
    }
  }

  console.info("Done!");
};

const isDirectExecution = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*\//, ""));

if (isDirectExecution) {
  await main();
}

