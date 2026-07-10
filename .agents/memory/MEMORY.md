# Memory Index

- [Notifications & quotations](notifications-quotations.md) — company-scoped notifications via createNotification; quotation public links/WhatsApp; status enum uses "approved" never "accepted".

- [Website grouping](website-grouping.md) — multi-site users via user_companies; active site = users.company_id; router-level master_admin guard on /v1/master/*.

- [API Server dev restart](api-server-dev-restart.md) — api-server dev builds once at startup; restart the workflow after route/spec/lib changes or you'll test a stale bundle.
- [VPS deployment](vps-deployment.md) — 5 tenant sites run on user's CloudPanel VPS, not Replit; deploy = user git pull + node build + systemctl restart, never pnpm.
- [Tenant scoping](tenant-scoping.md) — isolation is enforced per-handler (no central guard); every admin route must filter by req.user.companyId or it leaks across tenants.
- [Public site branding flash](public-site-branding-flash.md) — never hardcode a specific tenant brand as a CMS loading fallback (use ""); check static i18n strings too; gate useSeo on !!cms so client doesn't clobber server title.
- [SEO injection testing](seo-injection-testing.md) — server-side SEO meta is prod-only (needs travel-os dist); dev proxy hides it, so verify via built dist + api-server port directly.
