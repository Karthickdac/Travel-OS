// ─── PM2 process config for the TravelOS API server ────────────────
// Alternative to systemd. From the repo root on your VPS:
//   npm i -g pm2
//   set -a; . ./.env; set +a          # load .env into the shell
//   pm2 start deploy/ecosystem.config.cjs
//   pm2 save && pm2 startup           # survive reboots
//   pm2 logs travelos-api
//
// PM2 does not read .env automatically, so we forward the values that
// were exported into the shell (the `set -a; . ./.env` line above).

module.exports = {
  apps: [
    {
      name: "travelos-api",
      cwd: __dirname + "/..",
      script: "artifacts/api-server/dist/index.mjs",
      node_args: "--enable-source-maps",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "8080",
        DATABASE_URL: process.env.DATABASE_URL,
        SESSION_SECRET: process.env.SESSION_SECRET,
        REPLIT_DOMAINS: process.env.REPLIT_DOMAINS || "",
        PUBLIC_OBJECT_SEARCH_PATHS: process.env.PUBLIC_OBJECT_SEARCH_PATHS || "",
        PRIVATE_OBJECT_DIR: process.env.PRIVATE_OBJECT_DIR || "",
      },
    },
  ],
};
