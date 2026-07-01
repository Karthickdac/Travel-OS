# TravelOS — Self-Host Deployment Guide (VPS / Cloud Panel)

This guide deploys TravelOS to your own VPS (CloudPanel, Plesk, aaPanel, cPanel,
or a plain Ubuntu box) with `www.kyro360.in` as the platform/management domain.

**What runs where**
- **API server** (Express) — Node process on `127.0.0.1:8080`. Also serves the
  per-tenant `robots.txt` and `sitemap.xml`.
- **Frontend** (React build) — static files served by nginx, with an SPA
  fallback. Talks to the API same-origin at `/api/v1`.
- **PostgreSQL** — your database.
- **nginx** — serves the static frontend and reverse-proxies `/api`,
  `/robots.txt`, `/sitemap.xml` to the API.

> **Multi-tenant reminder:** TravelOS picks the tenant from the request
> hostname. `www.kyro360.in` becomes your **platform domain** — it serves
> `/master`, `/admin`, `/login`, and a default public site. Each brand site
> (e.g. `www.maduraisuccesstravels.com`) is a separate domain that points at
> the **same** server and is matched by its `companies.domain` value in the DB.

---

## 0. Prerequisites on the VPS

- **Node.js 24.x** and **pnpm** (`corepack enable && corepack prepare pnpm@latest --activate`)
- **PostgreSQL 14+**
- **nginx** (most panels install this for you)
- **git** (or upload the project files another way)

Verify: `node -v` (should print v24.x), `pnpm -v`, `psql --version`.

---

## 1. Get the code onto the server

```bash
sudo mkdir -p /var/www/travelos
sudo chown -R "$USER" /var/www/travelos
git clone <YOUR_REPO_URL> /var/www/travelos      # or upload the folder
cd /var/www/travelos
```

If you don't use git, download the project as a zip from Replit
(⋮ menu → Download as zip) and extract it into `/var/www/travelos`.

---

## 2. Install dependencies

```bash
cd /var/www/travelos
pnpm install --frozen-lockfile
```

---

## 3. Configure environment

```bash
cp deploy/.env.example .env
openssl rand -base64 48        # copy the output into SESSION_SECRET
nano .env                      # fill DATABASE_URL, SESSION_SECRET, REPLIT_DOMAINS
```

See `deploy/.env.example` for every variable and what it does.

---

## 4. Create the database

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE travelos LOGIN PASSWORD 'CHANGE_ME';
CREATE DATABASE travelos OWNER travelos;
SQL
```

Set the matching `DATABASE_URL` in `.env`:
`postgresql://travelos:CHANGE_ME@127.0.0.1:5432/travelos`

**Create the schema** (Drizzle pushes all tables — no migration files needed):

```bash
set -a; . ./.env; set +a
pnpm --filter @workspace/db run push
```

### 4b. (Optional) Bring your existing data over

A fresh database is empty — no tenants, users, packages, or the SEO keywords
and layout you've configured. To copy your current Replit data:

1. In Replit, open the Shell and print the dev DB URL: `echo $DATABASE_URL`.
2. On your VPS, dump from Replit and restore locally:

```bash
pg_dump --no-owner --no-privileges "<REPLIT_DATABASE_URL>" > travelos_dump.sql
psql "$DATABASE_URL" < travelos_dump.sql
```

If you did step 4's `push` already, restore into the empty schema instead by
dumping **data only**: add `--data-only` to `pg_dump`.

---

## 5. Build both apps

```bash
set -a; . ./.env; set +a

# API server → artifacts/api-server/dist/index.mjs
pnpm --filter @workspace/api-server run build

# Frontend → artifacts/travel-os/dist/public  (BASE_PATH and PORT are
# required at build time by the Vite config; PORT value is irrelevant here)
PORT=8080 BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/travel-os run build
```

---

## 6. Run the API server (pick ONE)

**systemd (recommended):**

```bash
sudo cp deploy/travelos-api.service /etc/systemd/system/travelos-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now travelos-api
sudo systemctl status travelos-api          # should be "active (running)"
```

**or PM2:**

```bash
npm i -g pm2
set -a; . ./.env; set +a
pm2 start deploy/ecosystem.config.cjs
pm2 save && pm2 startup
```

Health check: `curl http://127.0.0.1:8080/api/healthz` → should return OK.

---

## 7. Configure nginx

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/travelos
sudo ln -s /etc/nginx/sites-available/travelos /etc/nginx/sites-enabled/travelos
sudo nginx -t && sudo systemctl reload nginx
```

Edit the file first: set `root` to your path and list all your domains in
`server_name`. **On a cloud panel** (CloudPanel/Plesk/aaPanel), instead create
a site whose document root is `artifacts/travel-os/dist/public`, then paste the
`location` blocks from `deploy/nginx.conf.example` into the site's
"custom nginx config" area.

---

## 8. DNS + HTTPS

1. Point an **A record** for `kyro360.in` and `www.kyro360.in` at your VPS IP.
2. Point each tenant brand domain (e.g. `www.maduraisuccesstravels.com`) at the
   **same** VPS IP, and make sure that domain is in nginx `server_name` and
   matches the `companies.domain` column for that tenant.
3. Issue TLS certs — use your panel's Let's Encrypt button, or:
   `sudo certbot --nginx` (adds HTTPS + http→https redirect automatically).

---

## 9. Verify

```bash
curl -I https://www.kyro360.in/                              # 200, HTML
curl    https://www.kyro360.in/api/healthz                   # OK
curl    https://www.maduraisuccesstravels.com/robots.txt     # per-tenant robots
curl    https://www.maduraisuccesstravels.com/sitemap.xml    # per-tenant sitemap
```

Then log in at `https://www.kyro360.in/login` with your master admin account.

---

## Updating after code changes

```bash
cd /var/www/travelos
git pull
pnpm install --frozen-lockfile
set -a; . ./.env; set +a
pnpm --filter @workspace/db run push                         # if schema changed
pnpm --filter @workspace/api-server run build
PORT=8080 BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/travel-os run build
sudo systemctl restart travelos-api                          # or: pm2 restart travelos-api
```

---

## ⚠️ Known limitation — admin image uploads (object storage)

Admin image uploads (CMS images, logos) currently use **Replit Object
Storage**, which only works on Replit. Everything else — the public sites,
booking/CRM/fleet/finance modules, SEO, per-tenant layouts — works fully on
your VPS without it.

Off Replit you have three choices:
1. **Do nothing** — leave `PUBLIC_OBJECT_SEARCH_PATHS` / `PRIVATE_OBJECT_DIR`
   unset. Uploads will error, but nothing else is affected. Use image URLs
   (e.g. from a CDN) in the CMS instead.
2. **Point at a GCS bucket** — set the two env vars to your bucket paths and
   provide Google credentials (requires editing the storage client to use a
   service-account key instead of the Replit sidecar).
3. **Switch to local disk or S3-compatible storage (e.g. MinIO, Cloudflare R2,
   Backblaze B2)** — a small code change to the storage adapter.

I can implement option 2 or 3 for you as a follow-up if you want admin uploads
to work on the VPS — just ask.
