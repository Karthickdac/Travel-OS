import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import seoFilesRouter from "./routes/seo_files";
import { createSeoHtmlMiddleware, resolveClientDist } from "./routes/seo_html";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(seoFilesRouter);
app.use("/api", router);

// Optional: serve the built frontend from the same server (self-hosting).
// Inactive on Replit dev (no dist present); on the VPS the built SPA is found
// automatically (or via CLIENT_DIST) and HTML pages are served with per-tenant
// SEO meta injected so crawlers see real titles/descriptions on first fetch.
const clientDist = resolveClientDist();
if (clientDist && fs.existsSync(clientDist)) {
  logger.info({ clientDist }, "serving SPA with SEO-injected HTML");
  // index:false so "/" falls through to the SEO-injecting handler below.
  app.use(express.static(clientDist, { index: false }));
  app.use(createSeoHtmlMiddleware(clientDist));
  // Fallback for any GET the injector declined (e.g. unreadable index.html).
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next();
    });
  });
}

export default app;
