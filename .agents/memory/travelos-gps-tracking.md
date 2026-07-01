---
name: TravelOS GPS tracking
description: Durable design facts and data quirks for the GPS device + real-time vehicle tracking feature (admin/fleet, company-scoped).
---

# GPS tracking / live map

## Bookings carry registration TEXT, not a vehicle uuid
- `bookings.vehicleId` (uuid) is **null** across the seed dataset; only `bookings.vehicleNumber` (registration text, e.g. `RJ14-CA-1234`) is populated.
- **Why it matters:** GPS devices link to a vehicle by `vehicleId`. Linking a trip's device by `booking.vehicleId` silently fails (no device linked → no pings → nothing on the live map, even though KM still accumulates).
- **How to apply:** when connecting a booking to fleet resources, resolve the vehicle by matching `vehiclesTable.registrationNumber === booking.vehicleNumber` within the company as a fallback (a `resolveVehicleId` helper does this in `routes/gps.ts`). Do NOT assume `booking.vehicleId` is set.

## Live map must not depend solely on a reporting device
- `/gps/live` returns device-position markers AND virtual markers computed from a live trip's route-geometry `progress` index, for trips whose vehicle has no reporting device. This makes the simulator (and any un-instrumented vehicle) still appear on the map.

## Role guard on fleet endpoints uses `req.user.role`
- Fleet/admin routes gate with `FLEET_ROLES = {master_admin, company_admin, company_staff}` checked against `req.user.role` (same pattern as `routes/fastag.ts`). Presence-of-company (`companyId(req)`) alone is NOT sufficient for admin-only scope — a plain authenticated customer would otherwise pass.
- Device-facing ingest (`POST /gps/ingest`) is exempt from the user-role guard: it authenticates by `(deviceId, ingestKey)` matched atomically in the WHERE clause (not app-side key compare), because global auth middleware only attaches `req.user` when a Bearer token is present and never blocks.

## Tenant scoping in shared helpers
- `recordPing()` accumulates trip distance; its trip lookup MUST include `tripTrackingTable.companyId = cid` (not just bookingId+status), or a device-authenticated ingest with a guessed bookingId could touch another tenant's trip.
