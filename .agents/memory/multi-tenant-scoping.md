---
name: Multi-tenant scoping in API routes
description: Which API endpoints enforce company_id isolation and which historically did not.
---

Every DB table has `company_id` for tenant scoping. Company-scoped API endpoints (bookings, fleet, finance invoices, etc.) MUST filter reads and writes by the authenticated user's company: `req.user?.companyId`. Get/patch/delete by id must use `and(eq(id, ...), eq(companyId, cid))` and return 404 on mismatch (not a bare id lookup), otherwise a known id lets another tenant read/modify the row (IDOR).

**Why:** The finance invoice endpoints (list/get/patch) were originally written to query by id only, with an unscoped list returning ALL companies' invoices. This is a cross-tenant data leak. It became worse when the invoice response started embedding the company record (name/phone/GST/email). Fixed by scoping all invoice endpoints to `req.user.companyId` and returning 401 when there is no companyId.

**How to apply:** When adding or reviewing any company-scoped route, confirm list filters by companyId, single-row get/update/delete filter by `and(id, companyId)`, and create sets `companyId` from `req.user` (never trust a client-sent companyId). Master-admin-only endpoints under `/master/*` intentionally bypass this. Enforcement is inconsistent across older routes — do not assume a sibling route is correct; verify.
