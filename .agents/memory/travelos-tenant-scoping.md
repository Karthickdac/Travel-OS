---
name: TravelOS tenant scoping gap
description: Most API routes do NOT filter by company_id despite replit.md claiming they do — a pre-existing IDOR gap.
---

# Multi-tenant scoping is NOT enforced in most routes

replit.md states "company routes always filter by the authenticated user's company_id", but in practice the route handlers (e.g. `crm.ts`, `bookings.ts`) look records up by `id` only and do **not** filter by `req.user.companyId`. The global auth middleware in `artifacts/api-server/src/routes/index.ts` attaches `req.user = { id, email, name, role, companyId }`, but individual handlers rarely use it.

**Why:** This is a systemic pre-existing gap, not introduced by any single feature. Any authenticated user who knows another tenant's record UUID could read/mutate it.

**How to apply:** When adding or touching any company-scoped write/mutation handler, enforce isolation: load `(req as any).user`, return 401 if absent, and for non-`master_admin` roles reject when `record.companyId !== user.companyId` (return 404 to avoid leaking existence). The lead→booking convert handler in `crm.ts` is the reference implementation. Don't assume existing handlers are safe — they mostly aren't.

# Conversion handlers (quotation/lead → booking)

- `bookingCounter`/`quotationCounter` are **in-memory** counters in `crm.ts` (reset to base on every server restart → booking numbers like BK2001 repeat after restart). There is no DB uniqueness on `booking_number`. Acceptable for the demo but not production-safe; fixing requires a DB sequence + unique constraint.
- The lead→booking convert wraps insert + lead status update in a `db.transaction` with `.for("update")` row lock on the lead to prevent duplicate conversions under concurrency. The older quotation→booking handler does NOT (non-atomic); mirror the lead handler's pattern if hardening it.
- Booking `type` enum (canonical, enforced by generated zod): `local_cab, airport_transfer, outstation, tour, corporate, wedding, hourly`. UI dropdowns must use these exact values or the response `.parse()` throws AFTER DB writes commit.
