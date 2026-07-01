---
name: Public site CMS-driven branding
description: The customer-facing public site must source all tenant identity/contact from CMS settings, never hardcode
---

The public customer website (`artifacts/travel-os/src/pages/public/*` and `src/components/layout/public-layout.tsx`) is multi-tenant: it serves whichever company owns the current domain. All branding and contact info must come from `useGetPublicCmsSettings({ domain: window.location.hostname })`, not literals.

**Why:** Hardcoding a single tenant's name/phone/email/address (e.g. "Madurai SMT Travels", "8110806339") breaks tenant isolation — every company's public site would show the same seed tenant's details. This was flagged as a critical (FAIL) architect finding.

**How to apply:**
- Hook returns WebsiteSettings fields: `companyDisplayName`, `tagline`, `logoUrl`, `phone`, `email`, `address`.
- Pattern: `const { data: cms } = useGetPublicCmsSettings({ domain: window.location.hostname });` then `const contactPhone = cms?.phone || "<seed fallback>";`
- Always keep a hardcoded fallback (seed tenant value) after `||` so the UI renders before data loads / when a field is unset.
- Derive logo initials from `companyDisplayName` when no `logoUrl` (helper in public-layout.tsx).
- Scope note: the ADMIN/staff portal (`portal-layout.tsx`) is a separate internal surface — its hardcoded seed branding is out of scope for public-site tenant work.
