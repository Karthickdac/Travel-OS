---
name: Verifying server-side SEO injection in dev
description: How to test the api-server's per-tenant SEO HTML injection, which is inactive in Replit dev
---

# Verifying seo_html injection

The api-server's SEO HTML middleware (title/canonical/OG/JSON-LD per tenant page) only activates when a built SPA exists at `artifacts/travel-os/dist/public`. In Replit dev there is no dist, and the shared proxy routes page HTML (e.g. `/blog/...`) to the Vite dev server anyway — so curling `localhost:80/<page>` always shows the placeholder `<title>TravelOS</title>` regardless of correctness.

**How to verify:**
1. `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/travel-os run build` (both env vars required; output goes to `dist/public`)
2. Restart the api-server workflow so it picks up the dist
3. Curl the api-server port directly with the `?domain=<tenant-domain>` override (works because dev is a trusted proxy env): `curl localhost:8080/<page>?domain=www.maduraibesttravels.com`
4. Delete `artifacts/travel-os/dist` and restart the api-server again to return dev to normal

**Why:** without this, injection changes look broken in dev when they are actually fine (bit us during blog SEO work, July 2026).
**How to apply:** any time server-side SEO/meta output needs verification before a VPS deploy.
