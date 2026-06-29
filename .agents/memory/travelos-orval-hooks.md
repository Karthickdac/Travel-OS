---
name: TravelOS Orval hook naming
description: Orval-generated React Query hook naming conventions for this project
---

Orval generates hooks based on the OpenAPI operationId. In this project:

- **Collection (GET list) endpoints** → `useList<Entity>` e.g. `useListBookings`, `useListVehicles`, `useListLeads`, `useListCustomers`, `useListDrivers`, `useListInvoices`, `useListExpenses`, `useListDestinations`, `useListTourPackages`, `useListCompanies`, `useListPlans`, `useListUsers`, `useListVendors`, `useListQuotations`
- **Singular lookup** → `useGet<Entity>` e.g. `useGetBooking`, `useGetVehicle`
- **Mutations** → `useCreate*`, `useUpdate*`, `useDelete*`, `useAssign*`, `useCancel*`
- **Special** → `useGetMasterDashboard`, `useGetCompanyDashboard`, `useGetRevenueTrend`, `useGetRecentBookings`, `useGetFleetStats`, `useGetFinanceSummary`, `useGetPublicPackages`

**Why:** The operationId in openapi.yaml drives the name. `listBookings` → `useListBookings`. Do NOT guess `useGetBookings` — it doesn't exist.

**How to apply:** Before writing a new page that imports hooks, grep the generated file: `grep "^export.*use" lib/api-client-react/src/generated/api.ts` to get exact names.
