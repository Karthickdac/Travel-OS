---
name: Domain Routing Pattern
description: How custom domain → company lookup works for the public website endpoints
---

When a visitor hits a custom domain (e.g. www.maduraismt.com), the public API routes resolve the correct company like this:

1. Frontend passes `domain: window.location.hostname` as a query param to `GET /v1/public/cms` and `GET /v1/public/packages`.
2. Server normalizes both the incoming hostname and the stored `companies.domain` (strips `https://`, trailing slash, port) and does a JS-side match (handles www prefix either way).
3. Domains that should NOT trigger a lookup: `localhost`, `*.replit.dev`, `*.replit.app` — these fall back to the first company in the DB.
4. The admin saves their domain via `PUT /v1/company/domain` which writes to `companies.domain` as a bare hostname (e.g. `www.maduraismt.com`, no protocol).

**Why:** Multi-tenant SaaS — each travel company gets their own public website, served from their own domain, all running on the same TravelOS app.

**How to apply:** When adding new public endpoints that need company scoping, import `resolveCompanyIdByDomain` from `cms.ts` or duplicate the `normalizeHost` + lookup pattern from `tours.ts`. The skip-list for dev hostnames must stay in sync across both files.
