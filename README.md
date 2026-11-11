# Towtruck

Towtruck is an application to aid maintenence of dxw's repos. 
It aims to make it easier to keep on top of which repos need updates applying.

Please review the [High Level Design document](/doc/high-level-design.md) if this is your first time in the project

## Prerequisites

You must have [nvm](https://github.com/nvm-sh/nvm), [nodenv](https://github.com/nodenv/nodenv), or [asdf](https://github.com/asdf-vm/asdf) installed. All are available via Homebrew.

> [!note]
> If you want to use asdf to manage Node, you'll need to install the [nodejs plugin](https://github.com/asdf-vm/asdf-nodejs). You'll also need to turn on the [`legacy_version_file`](https://asdf-vm.com/manage/configuration.html#legacy-version-file) option in your `~/.asdfrc` to make asdf read this repository's `.node-version` file.

With any of them installed you should be able to run `script/setup` followed by `script/server` to run the application.

## Local development

To get Towtruck working in a local development environment:

1. [Log in using the non-production login form](#logging-in-using-the-non-production-login-form).
2. Follow the [general configuration instructions](#configuration).

### Logging in using the non-production login form

In production, Towtruck uses Google single sign-on as its authentication mechanism.

If you're running in a non-production environment and Google single sign-on is not configured, you can instead access a login form that allows you to log in to Towtruck with any `@dxw.com` email address. To do this, once the server is running, visit http://localhost:3000 and enter a `@dxw.com` email address.

## Configuration

Towtruck is set up as a [GitHub App](https://docs.github.com/en/apps).


### GitHub App settings


#### Using a test Github App

The first step is to register a new app as described [here](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app):
- For **9**, no callback URL is currently required, so this step can be skipped.
- For **11**, no user authentication is currently required, so this step can be skipped.
- Skip **12** as Towtruck does not use device flow authentication.
- For **13** and **14**, there is no additional in-app setup performed by Towtruck, so these steps can be skipped.
- For **15**, leave **Active** selected: Towtruck needs GitHub webhooks to keep its stored data up to date.
- For **16**, the webhook URL should be configured to `https://<base Towtruck URL>/api/github/webhooks`.
  Alternatively, for development, a [Smee.io](https://smee.io/) channel can be used.
- For **17**, a strong, randomly-generated secret should be used.
- For **18**, SSL verification should be used.
- For **19**, see the **Permissions** section below for a list of required permissions.
- For **20**, see the **Webhooks** section below for a list of required webhooks to listen to.
- For **21**, **Any account** should be used in production when Towtruck is used to monitor multiple organisations.
  Otherwise, **Only this account** should be used.

Once the app is registered, it should be installed to an account to allow Towtruck to track it.
GitHub have instructions to do this [here](https://docs.github.com/en/apps/using-github-apps/installing-your-own-github-app).


##### Permissions

Towtruck is still in early development so the exact set of needed permissions has not been finalised.


##### Webhooks

Configure webhooks in the GitHub App's own settings, not its installation settings. For the dxw app, use https://github.com/organizations/dxw/settings/apps/dxw-towtruck.

1. Under **General → Webhook**, ensure **Active** is selected.
2. Set **Webhook URL** to `https://<base Towtruck URL>/api/github/webhooks` and **Webhook secret** to the same value as Towtruck's `WEBHOOK_SECRET` environment variable. Keep SSL verification enabled, then save the changes.
3. Open **Permissions & events** and scroll to **Subscribe to events**. This section is only available when the webhook is active; the events offered also depend on the app's permissions.
4. Subscribe to **Repository**, **Pull request**, **Issues**, **Push**, and **Dependabot alert**, then save the changes.

The **Repository** subscription lets Towtruck remove repositories when they are archived or deleted. Towtruck reads its repository list from its local database, rather than checking GitHub each time the page loads. After a successful archive webhook, refresh the page to see the updated list.

To troubleshoot updates, check **Advanced → Recent Deliveries** in the app settings for the event and its response. Towtruck logs repository events as `<repository name> updated: <action>`.

Enabling webhooks does not replay events missed while they were inactive. To refresh existing stale entries, follow [Refreshing repository data](#refreshing-repository-data).


#### Using the dxw Github App

This will use the live data from dxw's repos. Any testing to configuration should be performed using a personal test app first
The environment variables are available here: https://github.com/organizations/dxw/settings/apps/dxw-towtruck. You may need to ask permission from an owner of the dxw organisation.


### Environment variables

In order for Towtruck to communicate with the GitHub API, it needs several pieces of information, configured through environment variables:
- `APP_ID`: The unique numeric ID assigned to the GitHub App. This can be found in the dxw-towtruck app settings.
- `PRIVATE_KEY`: The private key used to sign access token requests.
  Towtruck expects this to be a `.pem` file generated by GitHub in the app settings and encoded using Base64.
  This can be generated from the `.pem` file by running `script/encode-key <path-to-pem-file>` in the terminal and copying the output.
- `CLIENT_ID`: A unique alphanumeric ID assigned to the GitHub App. This can be found in the dxw-towtruck app settings
- `CLIENT_SECRET`: A token used to authenticate API requests. These are generated by GitHub in the dxw-towtruck app settings.
- `WEBHOOK_SECRET`: A user-defined secret used to authenticate GitHub to Towtruck for receiving webhooks. This must be exactly the same as it is entered in the app settings on GitHub.

Optionally, `DB_PATH` sets where the SQLite database is stored. It defaults to `./data/towtruck.db`. The Playwright tests set it to `./data/e2e.db` so they don't overwrite your seeded data.


### Seeding

Once all the other setup steps have been completed run `script/seed` or `script/bootstrap --seed` to seed the data. 
This will call the Github API which is rate limit so take care not to to run the script too often. 

#### Refreshing repository data

To rebuild the repository list after missed webhook events, run `npm run seed:repos` in the environment whose data needs updating. For production, run it against the production database with the production GitHub App credentials, not on your local development machine.

This deletes all stored repository data before fetching the current repositories from GitHub, excluding archived repositories. The list may be empty while the seed runs, and a failed fetch can leave it empty until a successful rerun. The seed makes additional GitHub API calls for each repository, so avoid running it frequently because of rate limits.
