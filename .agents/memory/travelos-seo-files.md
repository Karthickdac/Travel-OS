---
name: TravelOS per-tenant robots.txt / sitemap.xml
description: How root-level SEO files are served per tenant through the api-server, and the host-header trust boundary they must enforce.
---

Per-tenant `robots.txt` and `sitemap.xml` are served at the **domain root** by the Express api-server, not the travel-os SPA.

**Routing:** they live outside `/api`, so the router is mounted at app root (`app.use(seoFilesRouter)` before `app.use("/api", router)`) AND the two paths must be added to the api-server artifact's proxy `paths` array (`["/api", "/robots.txt", "/sitemap.xml"]`) via `verifyAndReplaceArtifactToml` — the shared proxy is most-specific-first and does NOT rewrite paths, so unregistered root paths fall through to the travel-os SPA on `/`.

**Host-header trust boundary (required):** the requested host comes from client-controllable `x-forwarded-host`/`host`, so never interpolate it raw into output.
- Validate the host (`^[a-zA-Z0-9.-]+(:\d+)?$`, ≤253 chars) before use.
- For a KNOWN tenant, build canonical URLs from the DB-stored `companies.domain`, not the request header (spoof-proof).
- For unknown-but-valid hosts (the `*.replit.app` deploy URL, or dev via `?domain=`), the validated host may be used as-is.
- Invalid host → 404. XML-escape any dynamic value placed in sitemap `<loc>`.

**Why:** an earlier version trusted `x-forwarded-host` unvalidated → host-header injection / SEO poisoning / wrong-tenant `lastmod`. Code review flagged it; the DB-canonical + validation approach is the fix.

**How to apply:** any new public/SEO endpoint that emits absolute URLs or resolves a tenant by domain must reuse this validate-then-canonicalize pattern. `sitemap.xml` `lastmod` comes from that tenant's `website_settings.updated_at`.
