import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import nunjucks from "nunjucks";
import { mapRepoFromStorageToUi, getOrgs } from "./utils/index.js";
import { DEFAULT_DATE_STYLE, normalizeDateStyle } from "./utils/dateFormatting.js";
import { sortByType } from "./utils/sorting.js";
import { filterByAlerts } from "./utils/alertFiltering.js";
import { normalizeSelectedTags, filterByTags, excludeByTag } from "./utils/tagFiltering.js";
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

httpServer.get("/:org/d-plus", requireAuth, (request, response) => {
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

  const { sortDirection, sortBy, alertFilter } = request.query;

  const dPlusRepos = excludeByTag(filterByTags(reposForUi.repos, ["d-plus", "delivery-plus", "internal"]), "govpress");
  const filteredByAlerts = filterByAlerts(dPlusRepos, alertFilter);
  const sortedRepos = sortByType(filteredByAlerts, sortDirection, sortBy);

  const totalVulnerabilities = dPlusRepos.reduce((sum, repo) => sum + (repo.totalOpenAlerts ?? 0), 0);
  const totalCriticalVulnerabilities = dPlusRepos.reduce((sum, repo) => sum + (repo.criticalSeverityAlerts ?? 0), 0);
  const totalOpenBotPrs = dPlusRepos.reduce((sum, repo) => sum + (repo.openBotPrCount ?? 0), 0);

  const template = nunjucks.render("index.njk", {
    gridRows: serialiseGridRows(sortedRepos),
    sortBy,
    sortDirection,
    tag: "",
    selectedTags: [],
    alertFilter,
    dateFormat,
    ...reposForUi,
    totalVulnerabilities,
    totalCriticalVulnerabilities,
    totalOpenBotPrs,
    org,
    totalRepos: reposForUi.totalRepos,
    displayedRepos: filteredByAlerts.length,
    savedConfigurations: [],
    activeConfigId: null,
    dPlusMode: true,
    publishingMode: false,
    opsMode: false,
    dPlusBaseUrl: `/${org}/d-plus`,
    publishingBaseUrl: `/${org}/publishing`,
    opsBaseUrl: `/${org}/ops`,
  });

  return response.end(template);
});

httpServer.get("/:org/publishing", requireAuth, (request, response) => {
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

  const { sortDirection, sortBy, alertFilter } = request.query;

  const publishingOnly = filterByTags(reposForUi.repos, ["govpress"]);
  const filteredByAlerts = filterByAlerts(publishingOnly, alertFilter);
  const sortedRepos = sortByType(filteredByAlerts, sortDirection, sortBy);

  const totalVulnerabilities = publishingOnly.reduce((sum, repo) => sum + (repo.totalOpenAlerts ?? 0), 0);
  const totalCriticalVulnerabilities = publishingOnly.reduce((sum, repo) => sum + (repo.criticalSeverityAlerts ?? 0), 0);
  const totalOpenBotPrs = publishingOnly.reduce((sum, repo) => sum + (repo.openBotPrCount ?? 0), 0);

  const template = nunjucks.render("index.njk", {
    gridRows: serialiseGridRows(sortedRepos),
    sortBy,
    sortDirection,
    tag: "",
    selectedTags: [],
    alertFilter,
    dateFormat,
    ...reposForUi,
    totalVulnerabilities,
    totalCriticalVulnerabilities,
    totalOpenBotPrs,
    org,
    totalRepos: reposForUi.totalRepos,
    displayedRepos: filteredByAlerts.length,
    savedConfigurations: [],
    activeConfigId: null,
    dPlusMode: false,
    publishingMode: true,
    opsMode: false,
    dPlusBaseUrl: `/${org}/d-plus`,
    publishingBaseUrl: `/${org}/publishing`,
    opsBaseUrl: `/${org}/ops`,
  });

  return response.end(template);
});


httpServer.get("/:org/ops", requireAuth, (request, response) => {
  const { org } = request.params;
  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositoriesForOrg(org);
  const persistedLifetimeData = db.getAllDependencies();

  const dateFormat = normalizeDateStyle(request.query.dateFormat ?? (request.cookies?.dateFormat === DEFAULT_DATE_STYLE ? DEFAULT_DATE_STYLE : undefined));
  if (request.cookies?.dateFormat !== dateFormat) {
    response.cookie("dateFormat", dateFormat, { httpOnly: false, sameSite: "lax" });
  }

  const reposForUi = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData, dateFormat);

  const { sortDirection, sortBy, alertFilter } = request.query;

  const opsRepos = filterByTags(reposForUi.repos, ["dalmatian", "tech-ops"]);
  const filteredByAlerts = filterByAlerts(opsRepos, alertFilter);
  const sortedRepos = sortByType(filteredByAlerts, sortDirection, sortBy);

  const totalVulnerabilities = opsRepos.reduce((sum, repo) => sum + (repo.totalOpenAlerts ?? 0), 0);
  const totalCriticalVulnerabilities = opsRepos.reduce((sum, repo) => sum + (repo.criticalSeverityAlerts ?? 0), 0);
  const totalOpenBotPrs = opsRepos.reduce((sum, repo) => sum + (repo.openBotPrCount ?? 0), 0);

  const template = nunjucks.render("index.njk", {
    gridRows: serialiseGridRows(sortedRepos),
    sortBy,
    sortDirection,
    tag: "",
    selectedTags: [],
    alertFilter,
    dateFormat,
    ...reposForUi,
    totalVulnerabilities,
    totalCriticalVulnerabilities,
    totalOpenBotPrs,
    org,
    totalRepos: reposForUi.totalRepos,
    displayedRepos: filteredByAlerts.length,
    savedConfigurations: [],
    activeConfigId: null,
    dPlusMode: false,
    publishingMode: false,
    opsMode: true,
    dPlusBaseUrl: `/${org}/d-plus`,
    publishingBaseUrl: `/${org}/publishing`,
    opsBaseUrl: `/${org}/ops`,
  });

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

  const { sortDirection, sortBy, tag, alertFilter } = request.query;
  const selectedTags = normalizeSelectedTags(tag);

  const filteredByTag = filterByTags(reposForUi.repos, selectedTags);

  const filteredByAlerts = filterByAlerts(filteredByTag, alertFilter);
  const sortedRepos = sortByType(filteredByAlerts, sortDirection, sortBy);

  const savedConfigurations = db.getAllSavedConfigurationsForUser(org, request.session.user.email).map((config) => {
    const params = new URLSearchParams(config.query || {});
    const qs = params.toString();
    return { ...config, applyUrl: qs ? `/${org}?${qs}` : `/${org}` };
  });

  const normalizeQuery = (query) => {
    const params = new URLSearchParams(query || {});
    return [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&");
  };

  const currentQs = normalizeQuery({
    ...(sortBy ? { sortBy } : {}),
    ...(sortDirection ? { sortDirection } : {}),
    ...(alertFilter ? { alertFilter } : {}),
    ...(selectedTags.length ? { tag: selectedTags.join(",") } : {}),
  });

  const activeConfigId = savedConfigurations.find(
    (config) => normalizeQuery(config.query) === currentQs
  )?.id ?? null;

  const template = nunjucks.render("index.njk", {
    gridRows: serialiseGridRows(sortedRepos),
    sortBy,
    sortDirection,
    tag: selectedTags.join(","),
    selectedTags,
    alertFilter,
    dateFormat,
    ...reposForUi,
    org,
    totalRepos: reposForUi.totalRepos,
    displayedRepos: filteredByAlerts.length,
    savedConfigurations,
    activeConfigId,
    dPlusMode: false,
    publishingMode: false,
    opsMode: false,
    dPlusBaseUrl: `/${org}/d-plus`,
    publishingBaseUrl: `/${org}/publishing`,
    opsBaseUrl: `/${org}/ops`,
  });

  return response.end(template);
});



httpServer.post("/:org/saved-configurations", requireAuth, (request, response) => {
  const { org } = request.params;
  const { name, sortBy, sortDirection, tag, alertFilter } = request.body;

  const query = {};
  if (sortBy) query.sortBy = sortBy;
  if (sortDirection) query.sortDirection = sortDirection;
  if (tag) query.tag = tag;
  if (alertFilter) query.alertFilter = alertFilter;

  const db = new TowtruckDatabase();
  db.saveConfiguration(org, name || `Config ${new Date().toLocaleString()}`, query, request.session.user.email);

  return response.redirect(`/${org}?${new URLSearchParams(query).toString()}`);
});

httpServer.post("/:org/saved-configurations/:id/delete", requireAuth, (request, response) => {
  const { org, id } = request.params;
  const { sortBy, sortDirection, tag, alertFilter } = request.body;

  const db = new TowtruckDatabase();
  db.deleteSavedConfiguration(org, id, request.session.user.email);

  const params = new URLSearchParams();
  if (sortBy) params.set("sortBy", sortBy);
  if (sortDirection) params.set("sortDirection", sortDirection);
  if (tag) params.set("tag", tag);
  if (alertFilter) params.set("alertFilter", alertFilter);

  const qs = params.toString();
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

