---
name: Creating a fully-functional TravelOS tenant
description: How to spin up a new tenant company with working public site + admin login + populated portal
---

# Creating a new fully-functional tenant

A tenant is just DB rows (no code). Minimum for a *public* site: a `companies` row + a `website_settings` row. For a *fully functional* tenant also add an admin user and clone catalog/fleet/CRM data.

**Reference tenant:** "Madurai Supreme Travels" (a.k.a. SMT, `admin@maduraismt.com`) is the only fully-seeded demo — clone from it. Siblings "Best"/"Mass" only have `tour_packages`.

## Steps (all via `executeSql` in code_execution; built-in Postgres, no connector confirm)
1. Insert `companies` (status `active`, plan `Growth`, set `domain`, `phone`, city/country). `id` has no default here — generate a UUID.
2. Insert `website_settings` (company_id, hero_*, primary_color, phone + hero_cta_phone, stats, about, announcement_bar, meta_*, `homepage_template`). Templates: classic/bold/vibrant/luxe/minimal — pick an unused one; pick an unused primary_color.
3. Admin user: `INSERT INTO users(email,name,password_hash,role,company_id,is_active)` with role `company_admin`. Password hash = `sha256(password + "travelos_salt")` hex (see api-server `routes/auth.ts` hashPassword).
4. Clone catalog/fleet/CRM from Supreme via `INSERT ... SELECT` (these tables auto-gen `id` via `gen_random_uuid()` and allow company_id): `destinations`, `tour_packages`, `vehicle_categories`, `vehicles`, `customers`, `leads`, `expenses`. **Null out cross-table FKs** (`tour_packages.destination_id`, `vehicles.category_id`, `leads.assigned_to`, `expenses.vehicle_id/driver_id`) but keep the denormalized text fields (`destination_name`, `category`, `vehicle_number`, `driver_name`) — UI renders those. **Reset booking-derived counters** for a fresh tenant (`tour_packages.total_bookings=0`; customers total_bookings/total_spent/loyalty_points=0, last_booking_date NULL).
5. Optional: `tour_itinerary`/`tour_availability` remap `package_id` by joining old→new packages on `title` within the tenant. (Supreme currently has none.)
6. Skip bookings/invoices/quotations unless needed — heavy FK remap; empty states are valid for a new tenant.

**Verify:** POST `/api/v1/auth/login` through proxy `localhost:80`; screenshot `/?previewDomain=<domain>` and `/packages?previewDomain=<domain>` (tall viewport to see the grid).
