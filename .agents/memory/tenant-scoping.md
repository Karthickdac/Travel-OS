---
name: TravelOS tenant scoping enforcement
description: How multi-tenant isolation is enforced (per-handler, not middleware) in the api-server, and the leak class to watch for
---

# Tenant scoping in the TravelOS API server

Multi-tenant isolation is enforced **per handler**, not by any central guard.
The global middleware in `routes/index.ts` only *attaches* `req.user`
(`{id,email,name,role,companyId}`); it does NOT filter data. Each route handler
must itself read `req.user.companyId` (via a local `getCompanyId(req)` helper),
401 if missing, and add `eq(table.companyId, companyId)` to every query — and
set `companyId` on every insert.

**Why:** the company-admin business routes were originally written without any
company filter, so every tenant saw/edited/deleted every other tenant's data and
all dashboards showed identical global aggregates. There is no shared middleware
that catches this — a new or edited admin route that forgets the filter silently
leaks across tenants.

**How to apply:** whenever adding or editing any `/v1/*` company-admin route
(bookings, customers, drivers, fleet, crm, finance, tours, vendors, users,
dashboard, etc.), scope reads by `and(eq(table.id,...), eq(table.companyId,
companyId))` for id-based reads/mutations, `eq(table.companyId, companyId)` for
lists/aggregates, and set `companyId` on inserts. Master-admin cross-tenant
access lives in `routes/master.ts` and a preserved role check in the crm
lead-convert handler (`role === "master_admin"` bypasses the company match).
Public/portal/webhook routes (public cms, portal, gps/fastag) scope differently
(by domain or per-company HMAC token) — do not force `getCompanyId` there.
