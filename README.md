# Towtruck

Towtruck is an application to aid maintenence of dxw's repos. It aims to make it
easier to keep on top of which repos need updates applying.

Be sure to the [High Level Design document](/doc/high-level-design.md) if you're
new to the project.

## Developing locally

### Prerequisites

1. You must have [nvm](https://github.com/nvm-sh/nvm) or
   [nodenv](https://github.com/nodenv/nodenv) installed. Both are available via
   Homebrew.
1. You'll need to be able to access the [GitHub App settings][]. Ask a member of
   dxw's tech ops team for access if you get a 404 when trying to access the
   settings page.

   > Towtruck is set up as a [GitHub App](https://docs.github.com/en/apps).

### Setup

1. Run `script/setup` to set up the app for the first time, including
   installation of dependencies.

1. Set environment variables in order for Towtruck to communicate with the
   GitHub API.

   1. Open the [GitHub App settings][].
   1. Copy the app ID and client ID from the "About" section into your local
      `.env` file.
   1. Generate a private key in the "Private keys" section. Download the
      generated file, move it to your local repository root folder, rename it to
      `towtruck.private-key.pem` (per the `.gitignore` file), then run
      `script/encode-key towtruck.private-key.pem` from the repository root
      folder. Copy the output of this command as the private key in your local
      `.env` file.

   > The `REDIRECT_URL_BASE`, `CLIENT_SECRET`, and `WEBHOOK_SECRET` can remain
   > as their default values.

### Seeding

Run `script/seed` to seed the database using live data from dxw's repositories.
You can also seed the databse as a final step while bootstrapping using
`script/bootstrap --seed`.

> This will call the Github API. Requests to this API are rate limited so take
> care not to to run the script too often.

[GitHub App settings]:
  https://github.com/organizations/dxw/settings/apps/dxw-towtruck
