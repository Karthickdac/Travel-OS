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

## Deterministic single-tenant fallback (required)

Every public company-scoped endpoint MUST fall back to ONE tenant when the domain is unresolved (dev host / no match), selected by `orderBy(asc(companiesTable.id)).limit(1)` — the SAME ordering in `cms.ts`, `tours.ts` packages, and `tours.ts` enquiry.
**Why:** an unordered `limit(1)` (or, worse, returning ALL rows like the old `/public/packages` `isActive`-only query) mixes tenants and makes preview inconsistent across CMS vs packages vs enquiry. A shared deterministic order makes the preview host always show the same tenant end-to-end.

## Previewing custom-domain tenants on the Replit `.replit.dev` host

The frontend resolves the tenant domain via `getSiteDomain()` (`lib/site-domain.ts`), NOT `window.location.hostname` directly. It reads a `?previewDomain=<domain>` query param, persists it to sessionStorage (survives wouter SPA nav), and falls back to hostname. Pass empty `?previewDomain=` to clear. Value is captured at module load, so switching preview tenants needs a full reload (acceptable for a preview-only tool).
**How to apply:** any new public page that scopes by domain must import `getSiteDomain()` instead of reading the hostname.

## Per-tenant accent colour on the public site

CMS `primaryColor` is applied to the public site by `PublicLayout` via a `useEffect` that converts the hex to an `H S% L%` triplet (`hexToHslTriplet`) and sets `--primary` on `document.documentElement`, restoring the previous value on unmount. `index.css` wraps `--primary` in `hsl(...)`, so you must set the triplet, not the raw hex.
