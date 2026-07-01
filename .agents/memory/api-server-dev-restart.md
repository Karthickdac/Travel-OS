---
name: api-server dev requires restart after route/spec changes
description: Why new/edited API routes 404 or return stale behavior until the API Server workflow is restarted.
---

# API Server dev builds once at startup — no hot reload

The `artifacts/api-server` dev workflow runs `pnpm run build && pnpm run start`
(esbuild bundle, then `node dist/index.mjs`). It does **not** watch/rebuild on
file changes.

**Rule:** After editing anything the server bundle depends on — route handlers,
the OpenAPI spec + regenerated server code, or `lib/*` used by the server — you
must restart the `artifacts/api-server: API Server` workflow before the change
takes effect. Testing via curl/preview against the old process will show the
pre-change behavior (a brand-new route can even surface as an auth/`Unauthorized`
or `404` response because it isn't in the running bundle yet).

**Why:** Wasted debugging time chasing a "broken" new public endpoint that was
actually correct in source — the running process was just a stale bundle from a
prior session.

**How to apply:** `restart_workflow "artifacts/api-server: API Server"` right
after server-side edits, then re-run curl/preview checks.
