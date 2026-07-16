import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import nunjucks from "nunjucks";
import { mapRepoFromStorageToUi, getOrgs } from "./utils/index.js";
import { normalizeDateStyle } from "./utils/dateFormatting.js";
import { sortByType } from "./utils/sorting.js";
import { filterByAlerts } from "./utils/alertFiltering.js";
import { normalizeSelectedTags, filterByTags, excludeByTag } from "./utils/tagFiltering.js";
import { calculatePagination, ROW_PAGE_SIZE } from "./utils/pagination.js";
import { TowtruckDatabase } from "./db/index.js";
import { handleWebhooks } from "./webhooks/index.js";
import { buildOidcConfig, registerAuthRoutes, requireAuth } from "./auth/index.js";

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
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  }),
);

httpServer.use(handleWebhooks);

const oidcConfig = await buildOidcConfig();
if (oidcConfig) {
  registerAuthRoutes(httpServer, oidcConfig);
} else if (process.env.NODE_ENV !== "production") {
  // When OIDC is not configured (e.g. in test environments), provide a stub
  // /auth/login so that requireAuth redirects land somewhere valid (not 404).
  httpServer.get("/auth/login", (req, res) => res.status(200).send("Auth not configured"));
}

// Test-only endpoint: creates an authenticated session without going through Google SSO.
// Only available outside of production.
if (process.env.NODE_ENV !== "production") {
  httpServer.get("/health", (req, res) => res.status(200).send("ok"));

  httpServer.post("/test/session", express.json(), (req, res) => {
    const { email } = req.body ?? {};
    if (!email || !email.endsWith("@dxw.com")) {
      return res.status(400).json({ error: "A valid @dxw.com email is required." });
    }
    req.session.user = { email };
    return res.status(201).json({ email });
  });
}

httpServer.use(express.urlencoded({ extended: false }));

httpServer.get("/", requireAuth, (request, response) => {
  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositories();
  const orgs = getOrgs(persistedRepoData);

  const template = nunjucks.render("home.njk", { orgs });

  return response.end(template);
});

httpServer.get("/:org/d-plus", requireAuth, (request, response) => {
  const { org } = request.params;
  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositoriesForOrg(org);
  const persistedLifetimeData = db.getAllDependencies();

  // Resolve date format: query param takes precedence.
  // Only persist DD/MM/YY in the cookie; MM/DD/YYYY must be explicitly passed each navigation.
  const dateFormat = normalizeDateStyle(request.query.dateFormat ?? (request.cookies?.dateFormat === "DD/MM/YY" ? "DD/MM/YY" : undefined));
  if (request.cookies?.dateFormat !== dateFormat) {
    response.cookie("dateFormat", dateFormat, { httpOnly: false, sameSite: "lax" });
  }

  const reposForUi = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData, dateFormat);

  const { sortDirection, sortBy, page: pageParam, alertFilter } = request.query;

  const dPlusRepos = excludeByTag(filterByTags(reposForUi.repos, ["d-plus", "delivery-plus", "internal"]), "govpress");
  const filteredByAlerts = filterByAlerts(dPlusRepos, alertFilter);
  const sortedRepos = sortByType(filteredByAlerts, sortDirection, sortBy);
  const pageSize = request.query.view === "rows" ? ROW_PAGE_SIZE : undefined;
  const paginationData = calculatePagination(sortedRepos, pageParam, pageSize);

  const totalVulnerabilities = dPlusRepos.reduce((sum, repo) => sum + (repo.totalOpenAlerts ?? 0), 0);
  const totalCriticalVulnerabilities = dPlusRepos.reduce((sum, repo) => sum + (repo.criticalSeverityAlerts ?? 0), 0);

  const buildTopicFilterUrl = () => {
    const params = new URLSearchParams();
    if (sortBy) params.set("sortBy", sortBy);
    if (sortDirection) params.set("sortDirection", sortDirection);
    if (alertFilter) params.set("alertFilter", alertFilter);

    const queryString = params.toString();
    return queryString ? `/${org}/d-plus?${queryString}` : `/${org}/d-plus`;
  };

  const template = nunjucks.render("index.njk", {
    sortBy,
    sortDirection,
    tag: "",
    selectedTags: [],
    buildTopicFilterUrl,
    alertFilter,
    dateFormat,
    ...reposForUi,
    totalVulnerabilities,
    totalCriticalVulnerabilities,
    org,
    repos: paginationData.items,
    totalRepos: reposForUi.totalRepos,
    displayedRepos: filteredByAlerts.length,
    currentPage: paginationData.currentPage,
    totalPages: paginationData.totalPages,
    pageNumbers: paginationData.pageNumbers,
    hasPreviousPage: paginationData.hasPreviousPage,
    hasNextPage: paginationData.hasNextPage,
    savedConfigurations: [],
    activeConfigId: null,
    dPlusMode: true,
    govpressMode: false,
    opsMode: false,
    dPlusBaseUrl: `/${org}/d-plus`,
    govpressBaseUrl: `/${org}/govpress`,
    opsBaseUrl: `/${org}/ops`,
  });

  return response.end(template);
});

httpServer.get("/:org/govpress", requireAuth, (request, response) => {
  const { org } = request.params;
  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositoriesForOrg(org);
  const persistedLifetimeData = db.getAllDependencies();

  // Resolve date format: query param takes precedence.
  // Only persist DD/MM/YY in the cookie; MM/DD/YYYY must be explicitly passed each navigation.
  const dateFormat = normalizeDateStyle(request.query.dateFormat ?? (request.cookies?.dateFormat === "DD/MM/YY" ? "DD/MM/YY" : undefined));
  if (request.cookies?.dateFormat !== dateFormat) {
    response.cookie("dateFormat", dateFormat, { httpOnly: false, sameSite: "lax" });
  }

  const reposForUi = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData, dateFormat);

  const { sortDirection, sortBy, page: pageParam, alertFilter } = request.query;

  const govpressOnly = filterByTags(reposForUi.repos, ["govpress"]);
  const filteredByAlerts = filterByAlerts(govpressOnly, alertFilter);
  const sortedRepos = sortByType(filteredByAlerts, sortDirection, sortBy);
  const pageSize = request.query.view === "rows" ? ROW_PAGE_SIZE : undefined;
  const paginationData = calculatePagination(sortedRepos, pageParam, pageSize);

  const totalVulnerabilities = govpressOnly.reduce((sum, repo) => sum + (repo.totalOpenAlerts ?? 0), 0);
  const totalCriticalVulnerabilities = govpressOnly.reduce((sum, repo) => sum + (repo.criticalSeverityAlerts ?? 0), 0);

  const buildTopicFilterUrl = () => {
    const params = new URLSearchParams();
    if (sortBy) params.set("sortBy", sortBy);
    if (sortDirection) params.set("sortDirection", sortDirection);
    if (alertFilter) params.set("alertFilter", alertFilter);

    const queryString = params.toString();
    return queryString ? `/${org}/govpress?${queryString}` : `/${org}/govpress`;
  };

  const template = nunjucks.render("index.njk", {
    sortBy,
    sortDirection,
    tag: "",
    selectedTags: [],
    buildTopicFilterUrl,
    alertFilter,
    dateFormat,
    ...reposForUi,
    totalVulnerabilities,
    totalCriticalVulnerabilities,
    org,
    repos: paginationData.items,
    totalRepos: reposForUi.totalRepos,
    displayedRepos: filteredByAlerts.length,
    currentPage: paginationData.currentPage,
    totalPages: paginationData.totalPages,
    pageNumbers: paginationData.pageNumbers,
    hasPreviousPage: paginationData.hasPreviousPage,
    hasNextPage: paginationData.hasNextPage,
    savedConfigurations: [],
    activeConfigId: null,
    dPlusMode: false,
    govpressMode: true,
    opsMode: false,
    dPlusBaseUrl: `/${org}/d-plus`,
    govpressBaseUrl: `/${org}/govpress`,
    opsBaseUrl: `/${org}/ops`,
  });

  return response.end(template);
});


httpServer.get("/:org/ops", requireAuth, (request, response) => {
  const { org } = request.params;
  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositoriesForOrg(org);
  const persistedLifetimeData = db.getAllDependencies();

  const dateFormat = normalizeDateStyle(request.query.dateFormat ?? (request.cookies?.dateFormat === "DD/MM/YY" ? "DD/MM/YY" : undefined));
  if (request.cookies?.dateFormat !== dateFormat) {
    response.cookie("dateFormat", dateFormat, { httpOnly: false, sameSite: "lax" });
  }

  const reposForUi = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData, dateFormat);

  const { sortDirection, sortBy, page: pageParam, alertFilter } = request.query;

  const opsRepos = filterByTags(reposForUi.repos, ["dalmatian", "tech-ops"]);
  const filteredByAlerts = filterByAlerts(opsRepos, alertFilter);
  const sortedRepos = sortByType(filteredByAlerts, sortDirection, sortBy);
  const pageSize = request.query.view === "rows" ? ROW_PAGE_SIZE : undefined;
  const paginationData = calculatePagination(sortedRepos, pageParam, pageSize);

  const totalVulnerabilities = opsRepos.reduce((sum, repo) => sum + (repo.totalOpenAlerts ?? 0), 0);
  const totalCriticalVulnerabilities = opsRepos.reduce((sum, repo) => sum + (repo.criticalSeverityAlerts ?? 0), 0);

  const buildTopicFilterUrl = () => {
    const params = new URLSearchParams();
    if (sortBy) params.set("sortBy", sortBy);
    if (sortDirection) params.set("sortDirection", sortDirection);
    if (alertFilter) params.set("alertFilter", alertFilter);

    const queryString = params.toString();
    return queryString ? `/${org}/ops?${queryString}` : `/${org}/ops`;
  };

  const template = nunjucks.render("index.njk", {
    sortBy,
    sortDirection,
    tag: "",
    selectedTags: [],
    buildTopicFilterUrl,
    alertFilter,
    dateFormat,
    ...reposForUi,
    totalVulnerabilities,
    totalCriticalVulnerabilities,
    org,
    repos: paginationData.items,
    totalRepos: reposForUi.totalRepos,
    displayedRepos: filteredByAlerts.length,
    currentPage: paginationData.currentPage,
    totalPages: paginationData.totalPages,
    pageNumbers: paginationData.pageNumbers,
    hasPreviousPage: paginationData.hasPreviousPage,
    hasNextPage: paginationData.hasNextPage,
    savedConfigurations: [],
    activeConfigId: null,
    dPlusMode: false,
    govpressMode: false,
    opsMode: true,
    dPlusBaseUrl: `/${org}/d-plus`,
    govpressBaseUrl: `/${org}/govpress`,
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
  // Only persist DD/MM/YY in the cookie; MM/DD/YYYY must be explicitly passed each navigation.
  const dateFormat = normalizeDateStyle(request.query.dateFormat ?? (request.cookies?.dateFormat === "DD/MM/YY" ? "DD/MM/YY" : undefined));
  if (request.cookies?.dateFormat !== dateFormat) {
    response.cookie("dateFormat", dateFormat, { httpOnly: false, sameSite: "lax" });
  }

  const reposForUi = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData, dateFormat);

  const { sortDirection, sortBy, tag, page: pageParam, alertFilter } = request.query;
  const selectedTags = normalizeSelectedTags(tag);

  const filteredByTag = filterByTags(reposForUi.repos, selectedTags);

  const filteredByAlerts = filterByAlerts(filteredByTag, alertFilter);
  const sortedRepos = sortByType(filteredByAlerts, sortDirection, sortBy);
  const pageSize = request.query.view === "rows" ? ROW_PAGE_SIZE : undefined;
  const paginationData = calculatePagination(sortedRepos, pageParam, pageSize);

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

  const buildTopicFilterUrl = (topic) => {
    const toggledTags = selectedTags.includes(topic)
      ? selectedTags.filter((selectedTag) => selectedTag !== topic)
      : [...selectedTags, topic];

    const params = new URLSearchParams();
    if (toggledTags.length) params.set("tag", toggledTags.join(","));
    if (sortBy) params.set("sortBy", sortBy);
    if (sortDirection) params.set("sortDirection", sortDirection);
    if (alertFilter) params.set("alertFilter", alertFilter);

    const queryString = params.toString();
    return queryString ? `/${org}?${queryString}` : `/${org}`;
  };

  const template = nunjucks.render("index.njk", {
    sortBy,
    sortDirection,
    tag: selectedTags.join(","),
    selectedTags,
    buildTopicFilterUrl,
    alertFilter,
    dateFormat,
    ...reposForUi,
    org,
    repos: paginationData.items,
    totalRepos: reposForUi.totalRepos,
    displayedRepos: filteredByAlerts.length,
    currentPage: paginationData.currentPage,
    totalPages: paginationData.totalPages,
    pageNumbers: paginationData.pageNumbers,
    hasPreviousPage: paginationData.hasPreviousPage,
    hasNextPage: paginationData.hasNextPage,
    savedConfigurations,
    activeConfigId,
    dPlusMode: false,
    govpressMode: false,
    opsMode: false,
    dPlusBaseUrl: `/${org}/d-plus`,
    govpressBaseUrl: `/${org}/govpress`,
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
httpServer.listen(PORT, () => {
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

