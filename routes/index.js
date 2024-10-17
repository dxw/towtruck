import { index, org, logout } from "./handlers.js";
import { match } from "./match.js";

const pathHandlers = {
  "/": index,
  "/{org}": org,
  "/logout": logout,
};

export const handleRoutes = async (token, request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const [handler, params] = match(pathHandlers, url.pathname);

  if (!handler) {
    response.writeHead(404);
    return response.end();
  }

  return await handler(token, request, response, params);
};
