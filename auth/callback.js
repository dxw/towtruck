import { cookie } from "./cookie.js";

export const handleOAuthCallback = async (app, request, response) => {
  if (request.url.startsWith("/api/github/oauth/callback?code=")) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const { authentication: { token, expiresAt } } = await app.oauth.createToken({ code: url.searchParams.get("code") });

    response.writeHead(302, {
      "Location": "/",
      ...cookie("Token", token, "/", expiresAt)
    });
    return response.end();
  }
};
