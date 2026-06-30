import express from "express";
import session from "express-session";
import nunjucks from "nunjucks";
import { mapRepoFromStorageToUi } from "./utils/index.js";
import { sortByType } from "./utils/sorting.js";
import { TowtruckDatabase } from "./db/index.js";
import { handleWebhooks } from "./webhooks/index.js";
import { buildOidcConfig, registerAuthRoutes, requireAuth } from "./auth/index.js";

nunjucks.configure({
  autoescape: true,
  watch: true,
});

const httpServer = express();

httpServer.use(
  session({
    secret: process.env.SESSION_SECRET,
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

httpServer.get("/", requireAuth, (request, response) => {
  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositories();
  const persistedLifetimeData = db.getAllDependencies();

  const reposForUi = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData);

  const { sortDirection, sortBy } = request.query;

  const template = nunjucks.render("index.njk", {
    sortBy,
    sortDirection,
    ...reposForUi,
    repos: sortByType(reposForUi.repos, sortDirection, sortBy),
  });

  return response.end(template);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
});
