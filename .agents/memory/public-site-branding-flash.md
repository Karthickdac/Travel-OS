---
name: Public tenant site branding flash
description: Why public tenant sites must never hardcode a specific tenant's brand as a loading fallback
---

# Public tenant site branding flash

The customer-facing site (`artifacts/travel-os`) is a client-rendered SPA whose per-tenant identity (company name, hero title, phone, email, address, meta title/description, JSON-LD) all comes from an async `useGetPublicCmsSettings({ domain })` fetch. There is always a first-paint window where React has mounted but CMS data has not resolved.

**Rule:** during that loading window render nothing brand-specific — use empty/neutral fallbacks, never a hardcoded specific tenant name. A `cms?.X || "Some Real Company"` fallback makes EVERY other tenant flash that company's brand on load. This is a real cross-tenant leak of identity, not cosmetic.

**Two distinct offenders to check whenever branding looks wrong:**
1. CMS fallbacks: `cms?.companyDisplayName || "..."`, `cms?.heroTitle || "..."`, etc. → fallback must be `""`.
2. Static i18n strings in `lang-context.tsx` (EN + TA blocks) that bake a brand into copy (why-us heading, hero/cta tagline, footer copyright). These show on ALL tenants permanently, not just during load. Make them brand-neutral or drive them from `brandName`.

**SEO title clobbering:** on the VPS, nginx forces the homepage through node so the server injects the correct `<title>`/meta into the initial HTML. The client `useSeo` hook (`lib/use-seo.ts`) only applies a field when it is truthy, so gate its inputs on `!!cms` (a `seoReady` flag) — otherwise React overwrites the correct server title with a placeholder built from an empty brand during the loading window. Pages that own their own title (reviews, package-detail) must likewise skip `useSeo` until `brandName` is present, or they emit a trailing `| ` title.

**Flash of DEFAULT content (distinct from brand flash):** even with empty-string fallbacks, the homepage still visibly paints generic defaults (default hero image, `t.hero.*` placeholder copy, default stats/ticker) and then swaps to real CMS content once the fetch resolves. Fix: `PublicLayout` early-returns a centered spinner while `cmsLoading && !cms`, so header + children only render once CMS is present. Gate on the loading flag (not just `!cms`) so a CMS error falls through to safe fallbacks instead of spinning forever. Place the early return AFTER all hooks. Tradeoff: this serializes child route-chunk fetch behind CMS; acceptable since CMS is cached/fast — if cold-load spinner is noticeable, prefetch CMS at app bootstrap.

**Why:** user reported every site briefly showing another tenant's name on load, then later that it still "flashes the default site then loads the actual site". Root causes: hardcoded fallbacks + static i18n strings + client SEO overriding server title (brand flash), and rendering default content before CMS resolves (default-content flash).
**How to apply:** any time public-site branding is wrong, stale, or "flashes"; and whenever adding a new public component, never introduce a hardcoded tenant name as a fallback, and don't paint CMS-driven content before CMS has loaded.
