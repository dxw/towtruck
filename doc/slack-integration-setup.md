# Slack Integration Setup for Stale Bot PR Notifications

## Environment Variables

Add these to your `.env` file:

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#your-channel-name (optional — uses webhook default if not set)
```

## How to get a Slack Incoming Webhook URL

1. Go to https://api.slack.com/apps
2. Click **Create New App** → **From scratch**
3. Name it something like `Towtruck` and select your workspace
4. In the app settings, go to **Incoming Webhooks**
5. Toggle **Activate Incoming Webhooks** to On
6. Click **Add New Webhook to Workspace**
7. Select the channel you want notifications posted to
8. Click **Allow**
9. Copy the Webhook URL — this is your `SLACK_WEBHOOK_URL`

## Running the Slack notification

```
npm run notify:slack
```

This will check for repos with open bot PRs where no bot PR has been closed in the last 6 months, and post a summary to Slack.

## What gets posted

- If stale repos exist: ⚠️ warning with a list of repos, number of open bot PRs, and when the last one was closed
- If none: ✅ all-clear message

## Scheduling

Set up Heroku Scheduler or a cron job to run `npm run notify:slack` on your preferred cadence (e.g. daily).

