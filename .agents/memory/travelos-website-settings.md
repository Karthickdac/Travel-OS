---
name: TravelOS website settings split
description: Which of the two settings tables holds public website content vs theme colors, and how the public homepage template system degrades safely.
---

# Two settings tables (do not confuse them)

TravelOS public-site config is split across TWO tables/endpoints:

- `website_settings` — public-readable. Admin: `GET/PUT /v1/cms/settings`. Public: `GET /v1/public/cms?domain=<host>`. Holds hero/content/stats/section toggles AND the homepage layout system (`homepageTemplate`, `sectionLayouts` JSON).
- `company_settings` — admin `GET/PUT /v1/company/settings`. Holds theme colors/fonts (the Theme Engine, themes.tsx).

**Why:** they have different visibility (one is public, one admin-only) and different PUT whitelists. Putting a field in the wrong table means the public site can't read it (or it leaks). When adding a public-facing content field, it belongs in `website_settings` + `mapSettings()` + the PUT whitelist in `artifacts/api-server/src/routes/cms.ts`.

# Homepage template system fallback contract

Public homepage (`home.tsx`) renders modular section components per saved variant, driven by `lib/homepage-templates.ts`.

**How to apply / invariants to preserve when editing templates:**
- `getTemplate(key)` falls back to `classic` for unknown template keys.
- `resolveSectionLayouts(template, json)` wraps JSON.parse in try/catch → falls back to the template's default variants on malformed `sectionLayouts`.
- Every section component must keep a default rendering branch so unknown variant strings degrade safely.
- There is currently NO server-side validation of `homepageTemplate`/`sectionLayouts` shape — robustness relies entirely on these client-side fallbacks. Non-UI clients can persist arbitrary values; the public site tolerates them but they are not normalized.
