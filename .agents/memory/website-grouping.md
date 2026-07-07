---
name: Website grouping / company switching
description: How multi-site users work — user_companies join table, active company = users.company_id, switch endpoint.
---

# Website grouping (multi-site users)

- A user's allowed sites = their own `users.company_id` + all `user_companies` rows. Master admin manages the set via `PUT /v1/master/users/:id/companies`.
- Switching sites (`POST /v1/auth/switch-company`) simply updates `users.company_id`. **Why:** auth middleware reloads the user from DB per request, so all existing tenant scoping keys off the active company automatically — no per-route changes needed.
- **How to apply:** never add a separate "active company" concept (header, session, etc.); keep using `users.company_id` as the single source of the active tenant.
- All `/v1/master/*` routes are guarded by a router-level `master_admin` check in master.ts (`router.use("/v1/master", ...)`). New master routes get the guard for free; don't remove it.
- Frontend: `CompanySwitcher` in admin-layout.tsx renders only when the user has 2+ companies; on switch it calls `queryClient.invalidateQueries()` with no filters so every screen refetches.
