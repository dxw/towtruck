import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import nunjucks from "nunjucks";
import { mapRepoFromStorageToUi, getOrgs } from "./utils/index.js";
import { DEFAULT_DATE_STYLE, normalizeDateStyle } from "./utils/dateFormatting.js";
import { sortByType } from "./utils/sorting.js";
import { serialiseGridRows } from "./utils/repoGrid.js";
import { TowtruckDatabase } from "./db/index.js";
import { handleWebhooks } from "./webhooks/index.js";
import { buildOidcConfig, registerAuthRoutes, registerDevAuthRoutes, requireAuth } from "./auth/index.js";
import { SqliteSessionStore } from "./auth/sessionStore.js";

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

nunjucks.configure({
  autoescape: true,
  watch: process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test",
});

// Filters are applied client-side by the grid; these are kept in the URL so they can be saved.
// `filter` holds the grid's filter model as JSON.
const CONFIGURATION_QUERY_KEYS = ["sortBy", "sortDirection", "filter"];

const pickConfigurationQuery = (source) =>
  Object.fromEntries(CONFIGURATION_QUERY_KEYS.filter((key) => source[key]).map((key) => [key, source[key]]));

const httpServer = express();

httpServer.use(cookieParser());

const sessionSecret = process.env.SESSION_SECRET ?? (process.env.NODE_ENV !== "production" ? "dev-session-secret" : undefined);

if (!sessionSecret) {
  console.error("FATAL: SESSION_SECRET environment variable is required in production.");
  process.exit(1);
}

httpServer.use(
  session({
    secret: sessionSecret,
    store: new SqliteSessionStore(),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS,
    },
  }),
);

httpServer.use(handleWebhooks);

httpServer.use(express.urlencoded({ extended: false }));

const oidcConfig = await buildOidcConfig();
if (oidcConfig) {
  registerAuthRoutes(httpServer, oidcConfig);
} else if (process.env.NODE_ENV !== "production") {
  registerDevAuthRoutes(httpServer);
}

httpServer.get("/", requireAuth, (request, response) => {
  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositories();
  const orgs = getOrgs(persistedRepoData);

  if (orgs.length === 1) {
    return response.redirect(`/${encodeURIComponent(orgs[0])}`);
  }

  const template = nunjucks.render("home.njk", { orgs });

  return response.end(template);
});

httpServer.get("/:org", requireAuth, (request, response) => {
  const { org } = request.params;
  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositoriesForOrg(org);
  const persistedLifetimeData = db.getAllDependencies();

  // Resolve date format: query param takes precedence.
  // Only persist the default date style in the cookie; MM/DD/YYYY must be explicitly passed each navigation.
  const dateFormat = normalizeDateStyle(request.query.dateFormat ?? (request.cookies?.dateFormat === DEFAULT_DATE_STYLE ? DEFAULT_DATE_STYLE : undefined));
  if (request.cookies?.dateFormat !== dateFormat) {
    response.cookie("dateFormat", dateFormat, { httpOnly: false, sameSite: "lax" });
  }

  const reposForUi = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData, dateFormat);

  const { sortDirection, sortBy } = request.query;
  const sortedRepos = sortByType(reposForUi.repos, sortDirection, sortBy);

  const savedConfigurations = db.getAllSavedConfigurationsForUser(org, request.session.user.email).map((config) => {
    const params = new URLSearchParams(config.query || {});
    const qs = params.toString();
    return { ...config, applyUrl: qs ? `/${org}?${qs}` : `/${org}` };
  });

  const template = nunjucks.render("index.njk", {
    gridRows: serialiseGridRows(sortedRepos),
    configurationQueryKeys: CONFIGURATION_QUERY_KEYS,
    dateFormat,
    ...reposForUi,
    org,
    totalRepos: reposForUi.totalRepos,
    savedConfigurations,
  });

  return response.end(template);
});



httpServer.post("/:org/saved-configurations", requireAuth, (request, response) => {
  const { org } = request.params;
  const { name } = request.body;
  const query = pickConfigurationQuery(request.body);

  const db = new TowtruckDatabase();
  db.saveConfiguration(org, name || `Config ${new Date().toLocaleString()}`, query, request.session.user.email);

  return response.redirect(`/${org}?${new URLSearchParams(query).toString()}`);
});

httpServer.post("/:org/saved-configurations/:id/delete", requireAuth, (request, response) => {
  const { org, id } = request.params;

  const db = new TowtruckDatabase();
  db.deleteSavedConfiguration(org, id, request.session.user.email);

  const qs = new URLSearchParams(pickConfigurationQuery(request.body)).toString();
  return response.redirect(qs ? `/${org}?${qs}` : `/${org}`);
});

import { spawn } from "node:child_process";

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, (listeningError) => {
  if (listeningError !== undefined) {
    console.log(`Unable to listen on port ${PORT}: ${listeningError}`);
    process.exit(1);
  }

  console.info(`Server is running on port ${PORT}`);

  // Run the seed in the background after the server is listening.
  // This ensures Heroku's boot timeout is not exceeded while seeding.
  if (process.env.RUN_SEED_ON_START?.trim().toLowerCase() === "true") {
    console.info("Starting background seed...");
    const seedProc = spawn("npm", ["run", "seed"], {
      stdio: "inherit",
      shell: true,
    });
    seedProc.on("error", (err) => {
      console.error("Failed to start seed process:", err.message);
    });
    seedProc.on("close", (code) => {
      if (code === 0) {
        console.info("Background seed completed successfully.");
      } else {
        console.error(`Background seed exited with code ${code}`);
      }
    });
  } else {
    console.info("Seed on start is disabled (RUN_SEED_ON_START=%s)", process.env.RUN_SEED_ON_START);
  }
});

