import { createServer } from "http";
import nunjucks from "nunjucks";
import { handleWebhooks } from "./webhooks/index.js";
import { handleOAuthCallback, getTokenOrPromptForLogin } from "./auth/index.js";
import { handleRoutes } from "./routes/index.js";

nunjucks.configure({
  autoescape: true,
  watch: true,
});

const httpServer = createServer(async (request, response) => {
  if (await handleOAuthCallback(request, response)) return;
  if (await handleWebhooks(request, response)) return;

  const token = await getTokenOrPromptForLogin(request, response);

  if (!token) return;

  return await handleRoutes(token, request, response);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
});
