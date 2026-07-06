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

## Applying tenant DATA changes to live sites
Schema/code changes deploy via the standard deploy block (git pull + build + restart). But per-tenant DATA (phone numbers, CMS text) lives in the VPS Postgres and must be set with SQL on the VPS DB (`postgresql://travelos:travelos@127.0.0.1:5432/travelos`), OR the user can edit it in the Company Admin → Website/CMS editor. Dev DB edits do NOT propagate to the VPS. Always give the user a `psql` heredoc scoped by `companies.domain` for data changes, and remind them a schema change (new column) requires `pnpm --filter @workspace/db run push` equivalent — on VPS there's no pnpm, so new columns need the deploy to include a migration or manual `ALTER TABLE`.

**Why:** these facts are not discoverable from the codebase; wrong assumptions (pnpm, Replit DB URL, direct ports) have broken deploys before.
**How to apply:** any time the user asks to deploy/fix/verify the live tenant sites.
