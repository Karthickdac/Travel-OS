import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import seoFilesRouter from "./routes/seo_files";
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
// Inactive on Replit (CLIENT_DIST unset); the frontend is a separate artifact there.
const clientDist = process.env.CLIENT_DIST;
if (clientDist && fs.existsSync(clientDist)) {
  logger.info({ clientDist }, "serving static client from CLIENT_DIST");
  app.use(express.static(clientDist));
  // SPA fallback: any non-API GET returns index.html so client-side routes work.
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next();
    });
  });
}

export default app;
