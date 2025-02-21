import express from "express";
import nunjucks from "nunjucks";
import { mapRepoFromStorageToUi } from "./utils/index.js";
import { sortByType } from "./utils/sorting.js";
import { TowtruckDatabase } from "./db/index.js";
import { handleWebhooks } from "./webhooks/index.js";
import { expressjwt } from "express-jwt";
import jwt from "jsonwebtoken";
import { OctokitApp } from "./octokitApp.js";
import { Config } from "./config.js";
import { getUser } from "./auth/index.js";

nunjucks.configure({
  autoescape: true,
  watch: true,
});

const httpServer = express();
httpServer.use(handleWebhooks);
httpServer.use(express.urlencoded());
httpServer.use(expressjwt({
  secret: Config.privateKey,
  algorithms: ["RS256"],
  credentialsRequired: false,
  getToken: (request) => {
    const match = request.headers?.cookie?.match(/Token=([^;]*)/);
    return match?.[1];
  },
}));

httpServer.engine("njk", nunjucks.render);

httpServer.set("views", "./views");
httpServer.set("view engine", "njk");

httpServer.get("/", (request, response) => {
  if (!request.auth) {
    return response.render("login", {
      loginMethods: Config.loginMethods,
    });
  }

  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositories();
  const persistedLifetimeData = db.getAllDependencies();

  const reposForUi = mapRepoFromStorageToUi(persistedRepoData, persistedLifetimeData);

  const { sortDirection, sortBy } = request.query;

  return response.render("org-dashboard", {
    sortBy,
    sortDirection,
    ...reposForUi,
    repos: sortByType(reposForUi.repos, sortDirection, sortBy),
  });
});

httpServer.post("/login", (request, response) => {
  if (!Config.loginMethods.usernamePassword) {
    return response.status(404).render("404", { url: request.path });
  }

  const db = new TowtruckDatabase();

  const user = getUser(db, request.body.username);

  if (!user || !user.passwordMatches(request.body.password)) {
    return response.render("login", {
      loginMethods: Config.loginMethods,
      errors: [ "The username or password is incorrect." ]
    });
  }

  const token = jwt.sign({ username: user.username }, Config.privateKey, { algorithm: 'RS256', expiresIn: Config.tokenExpiry });
  const { exp } = jwt.decode(token);

  return response
    .setHeader("set-cookie", `Token=${token}; Expires=${new Date(exp * 1000).toUTCString()}; SameSite=Strict; HttpOnly; Path=/;`)
    .render("login-refresh");
});

httpServer.get("/login/github", async (request, response) => {
  if (!Config.loginMethods.github) {
    return response.status(404).render("404", { url: request.path });
  }

  const { authentication: { token: githubApiToken } } = await OctokitApp.app.oauth.createToken({ code: request.query.code });
  const data = await OctokitApp.app.oauth.checkToken({ token: githubApiToken });

  const token = jwt.sign({ username: data.data.user.login }, Config.privateKey, { algorithm: 'RS256', expiresIn: Config.tokenExpiry });
  const { exp } = jwt.decode(token);

  return response
    .setHeader("set-cookie", `Token=${token}; Expires=${new Date(exp * 1000).toUTCString()}; SameSite=Strict; HttpOnly; Path=/;`)
    .render("login-refresh");
})

httpServer.all("*path", (request, response) => {
  return response.status(404).render("404", { url: request.path });
});

httpServer.listen(Config.port, () => {
  console.info(`Server is running on port ${Config.port}`);
});
