import nunjucks from "nunjucks";
import { OctokitApp } from "../octokitApp.js";
import { handleOAuthCallback as handleOAuthCallbackImpl } from "./callback.js";
import { parseToken, isTokenValid } from "./token.js";
import { cookie } from "./cookie.js";

export const handleOAuthCallback = async (request, response) => handleOAuthCallbackImpl(OctokitApp.app, request, response);

export const getTokenOrPromptForLogin = async (request, response) => {
  const token = parseToken(request);

  if (!token || !(await isTokenValid(OctokitApp.app, token))) {
    response.writeHead(200, {
      ...cookie("Token", "", "/", new Date(0)),
    });

    const template = nunjucks.render("login.njk");

    response.end(template);

    return undefined;
  }

  return token;
}
