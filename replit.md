# TravelOS

Full enterprise multi-tenant Travel ERP and Website Builder SaaS. Three portals in one app: Master Admin, Company Admin, and Customer-Facing Website.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild lib declarations (run this before api-server typecheck when DB schema changes)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Radix UI (shadcn/ui), Wouter routing, TanStack Query, Recharts, Framer Motion
- API: Express 5 (esbuild bundle, port 8080)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → `@workspace/api-client-react`)
- Auth: SHA256+salt token (base64 userId:timestamp:travelos), stored in localStorage, sent via `Authorization: Bearer` header

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for all API shapes)
- `lib/db/src/schema/` — Drizzle schema files (companies, users, fleet, drivers, customers, bookings, vendors, crm, tours, finance)
- `lib/db/src/schema/index.ts` — re-exports all schemas
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit manually)
- `artifacts/api-server/src/routes/` — all API route handlers
- `artifacts/travel-os/src/` — React frontend (pages, components, lib)

## Architecture decisions

- **Three-portal routing**: `/master/*` = master_admin portal, `/admin/*` = company_admin/staff portal, `/` = public customer website. Each portal has its own layout component.
- **Auth token approach**: Simple SHA256+salt token (not JWT) — token is `base64(userId:timestamp:travelos)`. Passed as `Authorization: Bearer <token>` header. The API client uses `setAuthTokenGetter()` registered in AuthProvider's useEffect.
- **Generated hook naming**: Orval generates `useList*` for GET-all endpoints, not `useGet*`. E.g. `useListBookings`, `useListVehicles`, `useListLeads`. Singular lookups are `useGetBooking` etc.
- **Multi-tenant isolation**: Every DB table has `company_id` for tenant scoping. Master admin routes bypass this; company routes always filter by the authenticated user's company_id.
- **Lib rebuild rule**: After adding new exports to `lib/db`, always run `pnpm run typecheck:libs` before running `pnpm --filter @workspace/api-server run typecheck` — otherwise stale .d.ts files cause TS2305 errors.

## Product

- **Master Admin Portal** (`/master/*`): Platform overview, tenant company management, subscription plan configuration
- **Company Admin Portal** (`/admin/*`): Booking management, fleet & vehicles, driver management, staff/users, CRM (leads pipeline + quotations), customer database, tour packages & destinations, financial summary (invoices + expenses)
- **Customer Website** (`/`): Public-facing homepage, tour packages showcase, travel enquiry form

## Seed credentials

- Master Admin: `master@travelos.io` / `admin123` → portal: Master Admin
- Company Admin: `admin@rajtravel.com` / `company123` → portal: Company Admin
- Company Staff: `staff@rajtravel.com` / `company123` → portal: Company Staff

## Gotchas

- **NEVER use `console.log` in server code** — use `req.log` (in route handlers) or the `logger` singleton (non-request code)
- Run `pnpm run typecheck:libs` before api-server typecheck whenever `lib/db` schema changes
- The API base path is `/api/v1/` — all routes must be under this prefix
- Orval hook names: list endpoints → `useList*`, singular → `useGet*`, mutations → `useCreate*` / `useUpdate*` / `useDelete*`
- Vehicle status values: `available`, `on_trip`, `maintenance`, `inactive`
- Driver status values: `available`, `on_trip`, `off_duty`, `suspended`
- Booking status values: `enquiry`, `confirmed`, `in_progress`, `completed`, `cancelled`
- Lead status values: `new`, `contacted`, `qualified`, `won`, `lost`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
