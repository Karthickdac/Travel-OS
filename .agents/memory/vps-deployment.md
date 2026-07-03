---
name: VPS deployment for tenant sites
description: How the 5 tenant travel sites are hosted and deployed on the user's CloudPanel VPS
---

# VPS deployment (user's CloudPanel server)

The production tenant sites do NOT run on Replit. They run on the user's own VPS (CloudPanel + nginx). The user is non-technical — always give complete copy-paste commands.

## Layout
- App checkout on VPS: `/home/travelos/htdocs/www.kyro360.in` (systemd service `travelos-api`, WorkingDirectory set there).
- VPS Postgres: `postgresql://travelos:travelos@127.0.0.1:5432/travelos` — never the Replit `$DATABASE_URL`.
- **Never use pnpm on the VPS** (breaks). Build with `node ./build.mjs` (api-server) and direct `./node_modules/.bin/vite build` (travel-os, requires `PORT` and `BASE_PATH=/` env vars).
- Agent cannot git push to the VPS; the user runs `git checkout -- package.json && git pull` there.

## Standard deploy block (user runs)
```bash
cd /home/travelos/htdocs/www.kyro360.in
git checkout -- package.json && git pull
cd artifacts/api-server && node ./build.mjs && cd ../..
cd artifacts/travel-os && PORT=3000 BASE_PATH=/ ./node_modules/.bin/vite build && cd ../..
sudo systemctl restart travelos-api
```

## nginx / CloudPanel
- Each site is a CloudPanel vhost with `location / { try_files $uri @reverse_proxy; }` proxying to the node app (port 8080). An extra `location = / { try_files /nonexistent @reverse_proxy; }` block forces the homepage through node so server-side SEO injection applies.
- Static assets are served by nginx directly from the vite `dist/public` output.

## Tenants (July 2026)
- 4 live domains: www.maduraibesttravels.com, www.maduraisuccesstravels.com, www.maduraisupremetravels.com, www.maduraimasstravels.com (mapped via `companies.domain`).
- Kerala Voyages has NO domain (user chose to skip a public site for it for now).

**Why:** these facts are not discoverable from the codebase; wrong assumptions (pnpm, Replit DB URL, direct ports) have broken deploys before.
**How to apply:** any time the user asks to deploy/fix/verify the live tenant sites.
