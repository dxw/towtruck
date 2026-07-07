import { TowtruckDatabase } from "../db/index.js";
import { mapRepoFromStorageToUi } from "../utils/index.js";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

/**
 * Collects all repos with stale bot PRs (open bot PRs with no closed bot PR in last 6 months)
 * @returns {{ org: string, name: string, openBotPrCount: number, mostRecentBotPrClosedAt: string | null }[]}
 */
const getStaleRepos = () => {
  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositories();
  const persistedLifetimeData = db.getAllDependencies();
  const { repos } = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData);

  return repos
    .filter((repo) => repo.botPrStale)
    .map((repo) => ({
      name: repo.name,
      openBotPrCount: repo.openBotPrCount,
      mostRecentBotPrClosedAt: repo.mostRecentBotPrClosedAt,
      htmlUrl: repo.htmlUrl,
    }));
};

/**
 * Builds a Slack message payload from the stale repos
 * @param {{ name: string, mostRecentBotPrClosedAt: string | null, htmlUrl: string }[]} staleRepos
 * @returns {object | null}
 */
export const buildSlackPayload = (staleRepos) => {
  if (!staleRepos.length) {
    return null;
  }

  const repoLines = staleRepos.map((repo) => {
    const lastClosed = repo.mostRecentBotPrClosedAt || "never";
    return `• <${repo.htmlUrl}|${repo.name}> — last bot PR closed: ${lastClosed}`;
  });

  const payload = {
    text: `⚠️ *Stale Bot PRs Report*\n\n${staleRepos.length} repo${staleRepos.length === 1 ? " has" : "s have"} not had a bot PR closed in over 6 months:\n\n${repoLines.join("\n")}`,
  };
  if (SLACK_CHANNEL) payload.channel = SLACK_CHANNEL;
  return payload;
};

/**
 * Posts a message to Slack via Incoming Webhook
 * @param {object} payload
 */
const postToSlack = async (payload) => {
  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Slack webhook failed (${response.status}): ${body}`);
  }
};

const main = async () => {
  if (!SLACK_WEBHOOK_URL) {
    console.error("Error: SLACK_WEBHOOK_URL environment variable is required.");
    process.exit(1);
  }

  console.info("Checking for stale bot PRs...");
  const staleRepos = getStaleRepos();
  console.info(`Found ${staleRepos.length} repo(s) with stale bot PRs.`);

  const payload = buildSlackPayload(staleRepos);
  if (!payload) {
    console.info("Nothing to report. Skipping Slack post.");
    return;
  }

  console.info("Posting to Slack...");
  await postToSlack(payload);
  console.info("Done!");
};

const isDirectExecution = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*\//, ""));

if (isDirectExecution) {
  await main();
}
