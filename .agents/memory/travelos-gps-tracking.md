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

## TB Track (TrackoBit) device integration
- **tbtrack.in is a white-label of the TrackoBit platform** (login redirects to `tbtrack.trackobit.com`). TrackoBit's REST API is private (client-agreement only, not publicly documented), so you CANNOT reliably poll it. Do not build a poller against guessed TrackoBit endpoints.
- **Integration model = push, not pull.** A per-company webhook `GET|POST /v1/gps/tbtrack/ingest?company=<id>&token=<hmac>` receives positions from the TB Track platform's data-forwarding (or the device / a forwarding app). Token is derived like the FASTag webhook (`HMAC-SHA256(SESSION_SECRET,"gps-tbtrack:"+companyId)`, fail-closed, timing-safe compare) — reuse that tenant-isolation pattern for any device/platform-facing ingest.
- Ingest is exempt from the fleet role guard (matched by `req.path` in the `router.use`, same as `/v1/gps/ingest`) because it authenticates by token, not user session.
- Parser is deliberately tolerant of field spellings (imei/id/deviceId, lat/latitude, lng/lon/longitude, speed, heading/course/angle, timestamp as unix-s/unix-ms/ISO) so most tracker/Traccar-OsmAnd feeds work unchanged. Unknown IMEIs auto-register as `provider='tbtrack'` devices scoped to the token's company.
- **Known minor gap:** `gps_devices` has NO unique constraint on `(company_id, device_id)` despite the "unique per company" comment; a burst of first pings for a new IMEI can create duplicate device rows (non-corrupting — just two near-identical markers). If this ever matters, add a partial unique index (excluding `is_deleted`) + `onConflictDoNothing` + re-select.
