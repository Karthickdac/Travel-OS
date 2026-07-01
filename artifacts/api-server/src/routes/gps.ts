import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import {
  db,
  gpsDevicesTable,
  gpsPingsTable,
  tripTrackingTable,
  bookingsTable,
  vehiclesTable,
} from "@workspace/db";

const router: IRouter = Router();

// ---------- geo helpers ----------

const R_KM = 6371;
function toRad(d: number): number {
  return (d * Math.PI) / 180;
}
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

type LatLng = [number, number]; // [lat, lng]

function routeLengthKm(points: LatLng[]): number {
  let km = 0;
  for (let i = 1; i < points.length; i++) {
    km += haversineKm(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
  }
  return km;
}

async function fetchJson(url: string, timeoutMs = 5000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "TravelOS/1.0" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Geocode a free-text place name to [lat, lng] using the Photon (OpenStreetMap) API.
async function geocodePlace(query: string): Promise<LatLng | null> {
  const q = query.trim();
  if (!q) return null;
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1&lat=22&lon=79`;
  const data = await fetchJson(url);
  const feat = data?.features?.[0];
  const coords = feat?.geometry?.coordinates; // [lng, lat]
  if (Array.isArray(coords) && coords.length === 2) return [coords[1], coords[0]];
  return null;
}

// Densify a straight line between two points into ~step-spaced intermediate points.
function straightRoute(from: LatLng, to: LatLng, points = 60): LatLng[] {
  const out: LatLng[] = [];
  for (let i = 0; i <= points; i++) {
    const f = i / points;
    out.push([from[0] + (to[0] - from[0]) * f, from[1] + (to[1] - from[1]) * f]);
  }
  return out;
}

// Fetch a real road route from OSRM; fall back to a densified straight line.
async function fetchRoute(from: LatLng, to: LatLng): Promise<{ geometry: LatLng[]; distanceKm: number }> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const data = await fetchJson(url);
  const route = data?.routes?.[0];
  const coords = route?.geometry?.coordinates as [number, number][] | undefined; // [lng, lat]
  if (Array.isArray(coords) && coords.length >= 2) {
    const geometry: LatLng[] = coords.map(([lng, lat]) => [lat, lng]);
    const distanceKm = typeof route.distance === "number" ? route.distance / 1000 : routeLengthKm(geometry);
    return { geometry, distanceKm };
  }
  const geometry = straightRoute(from, to);
  return { geometry, distanceKm: routeLengthKm(geometry) };
}

function companyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

// GPS management + live tracking is a fleet/admin feature, mirroring FASTag access.
const FLEET_ROLES = new Set(["master_admin", "company_admin", "company_staff"]);
function isFleetUser(req: any): boolean {
  return !!req.user && FLEET_ROLES.has(req.user.role);
}

// Bookings often carry only the registration text, not the vehicle uuid.
// Resolve to a real vehicle id so we can link the assigned GPS device.
async function resolveVehicleId(cid: string, vehicleId: string | null, vehicleNumber: string | null): Promise<string | null> {
  if (vehicleId) return vehicleId;
  if (vehicleNumber) {
    const [v] = await db
      .select()
      .from(vehiclesTable)
      .where(and(eq(vehiclesTable.companyId, cid), eq(vehiclesTable.registrationNumber, vehicleNumber), eq(vehiclesTable.isDeleted, false)));
    return v?.id ?? null;
  }
  return null;
}

type LiveMarker = {
  deviceId: string;
  deviceLabel: string | null;
  vehicleId: string | null;
  vehicleReg: string | null;
  vehicleModel: string | null;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  lastPingAt: Date | null;
  trip: { bookingId: string; bookingNumber: string | null; trackedKm: number; routeDistanceKm: number; pickup: string | null; drop: string | null } | null;
};

// All GPS routes are fleet/admin-only EXCEPT the device-facing ingest endpoint,
// which authenticates via deviceId + ingestKey rather than a user session.
router.use((req, res, next) => {
  if (req.path === "/v1/gps/ingest") { next(); return; }
  if (!companyId(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!isFleetUser(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  next();
});

// ---------- device CRUD ----------

router.get("/v1/gps/devices", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db
    .select({
      device: gpsDevicesTable,
      vehicleReg: vehiclesTable.registrationNumber,
      vehicleModel: vehiclesTable.model,
    })
    .from(gpsDevicesTable)
    .leftJoin(vehiclesTable, eq(gpsDevicesTable.vehicleId, vehiclesTable.id))
    .where(and(eq(gpsDevicesTable.companyId, cid), eq(gpsDevicesTable.isDeleted, false)))
    .orderBy(desc(gpsDevicesTable.createdAt));
  res.json(rows.map((r) => ({ ...r.device, vehicleReg: r.vehicleReg, vehicleModel: r.vehicleModel })));
});

router.post("/v1/gps/devices", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const b = req.body as Record<string, unknown>;
  const deviceId = String(b.deviceId ?? "").trim();
  if (!deviceId) { res.status(400).json({ error: "deviceId is required" }); return; }
  const [created] = await db
    .insert(gpsDevicesTable)
    .values({
      companyId: cid,
      deviceId,
      label: b.label ? String(b.label) : null,
      simNumber: b.simNumber ? String(b.simNumber) : null,
      ingestKey: randomBytes(16).toString("hex"),
      vehicleId: b.vehicleId ? String(b.vehicleId) : null,
      status: "active",
    })
    .returning();
  res.status(201).json(created);
});

router.put("/v1/gps/devices/:id", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const b = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (b.label !== undefined) update.label = b.label ? String(b.label) : null;
  if (b.simNumber !== undefined) update.simNumber = b.simNumber ? String(b.simNumber) : null;
  if (b.vehicleId !== undefined) update.vehicleId = b.vehicleId ? String(b.vehicleId) : null;
  if (b.status !== undefined && ["active", "inactive"].includes(String(b.status))) update.status = String(b.status);
  const [updated] = await db
    .update(gpsDevicesTable)
    .set(update)
    .where(and(eq(gpsDevicesTable.id, req.params.id), eq(gpsDevicesTable.companyId, cid)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Device not found" }); return; }
  res.json(updated);
});

router.delete("/v1/gps/devices/:id", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [updated] = await db
    .update(gpsDevicesTable)
    .set({ isDeleted: true, status: "inactive" })
    .where(and(eq(gpsDevicesTable.id, req.params.id), eq(gpsDevicesTable.companyId, cid)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Device not found" }); return; }
  res.status(204).end();
});

// ---------- ingestion (device-facing, deviceId + ingestKey auth) ----------

router.post("/v1/gps/ingest", async (req, res): Promise<void> => {
  const b = req.body as Record<string, unknown>;
  const deviceId = String(b.deviceId ?? "").trim();
  const key = String(b.key ?? "").trim();
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  if (!deviceId || !key) { res.status(400).json({ error: "deviceId and key are required" }); return; }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) { res.status(400).json({ error: "valid lat and lng are required" }); return; }

  const [device] = await db
    .select()
    .from(gpsDevicesTable)
    .where(and(eq(gpsDevicesTable.deviceId, deviceId), eq(gpsDevicesTable.ingestKey, key), eq(gpsDevicesTable.isDeleted, false)));
  if (!device) { res.status(401).json({ error: "Invalid device credentials" }); return; }

  const speed = Number.isFinite(Number(b.speed)) ? Number(b.speed) : null;
  const heading = Number.isFinite(Number(b.heading)) ? Number(b.heading) : null;
  const recordedAt = b.recordedAt ? new Date(String(b.recordedAt)) : new Date();
  const bookingId = b.bookingId ? String(b.bookingId) : null;

  await recordPing(device.companyId!, device.id, device.vehicleId, bookingId, lat, lng, speed, heading, recordedAt);
  res.status(201).json({ ok: true });
});

// Insert a ping, update the device's last position, and accumulate trip distance.
async function recordPing(
  cid: string,
  deviceUuid: string,
  vehicleId: string | null,
  bookingId: string | null,
  lat: number,
  lng: number,
  speed: number | null,
  heading: number | null,
  recordedAt: Date,
): Promise<void> {
  const [device] = await db.select().from(gpsDevicesTable).where(eq(gpsDevicesTable.id, deviceUuid));
  const prevLat = device?.lastLat ?? null;
  const prevLng = device?.lastLng ?? null;

  await db.insert(gpsPingsTable).values({
    companyId: cid,
    deviceId: deviceUuid,
    vehicleId,
    bookingId,
    lat,
    lng,
    speed,
    heading,
    recordedAt,
  });

  await db
    .update(gpsDevicesTable)
    .set({ lastLat: lat, lastLng: lng, lastSpeed: speed, lastHeading: heading, lastPingAt: recordedAt })
    .where(eq(gpsDevicesTable.id, deviceUuid));

  if (bookingId && prevLat != null && prevLng != null) {
    const [trip] = await db
      .select()
      .from(tripTrackingTable)
      .where(and(eq(tripTrackingTable.companyId, cid), eq(tripTrackingTable.bookingId, bookingId), eq(tripTrackingTable.status, "live")));
    if (trip) {
      const seg = haversineKm(prevLat, prevLng, lat, lng);
      await db
        .update(tripTrackingTable)
        .set({ trackedKm: trip.trackedKm + seg })
        .where(eq(tripTrackingTable.id, trip.id));
    }
  }
}

// ---------- live snapshot for the map ----------

router.get("/v1/gps/live", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db
    .select({
      device: gpsDevicesTable,
      vehicleReg: vehiclesTable.registrationNumber,
      vehicleModel: vehiclesTable.model,
    })
    .from(gpsDevicesTable)
    .leftJoin(vehiclesTable, eq(gpsDevicesTable.vehicleId, vehiclesTable.id))
    .where(and(eq(gpsDevicesTable.companyId, cid), eq(gpsDevicesTable.isDeleted, false), eq(gpsDevicesTable.status, "active")));

  const liveTrips = await db
    .select({ trip: tripTrackingTable, booking: bookingsTable })
    .from(tripTrackingTable)
    .leftJoin(bookingsTable, eq(tripTrackingTable.bookingId, bookingsTable.id))
    .where(and(eq(tripTrackingTable.companyId, cid), eq(tripTrackingTable.status, "live")));

  const tripByVehicle = new Map<string, { bookingId: string; bookingNumber: string | null; trackedKm: number; routeDistanceKm: number; pickup: string | null; drop: string | null }>();
  for (const { trip, booking } of liveTrips) {
    if (trip.vehicleId) {
      tripByVehicle.set(trip.vehicleId, {
        bookingId: trip.bookingId,
        bookingNumber: booking?.bookingNumber ?? null,
        trackedKm: trip.trackedKm,
        routeDistanceKm: trip.routeDistanceKm,
        pickup: booking?.pickupLocation ?? null,
        drop: booking?.dropLocation ?? null,
      });
    }
  }

  const covered = new Set<string>();
  const markers: LiveMarker[] = rows
    .filter((r) => r.device.lastLat != null && r.device.lastLng != null)
    .map((r) => {
      if (r.device.vehicleId) covered.add(r.device.vehicleId);
      return {
        deviceId: r.device.id,
        deviceLabel: r.device.label,
        vehicleId: r.device.vehicleId,
        vehicleReg: r.vehicleReg,
        vehicleModel: r.vehicleModel,
        lat: r.device.lastLat!,
        lng: r.device.lastLng!,
        speed: r.device.lastSpeed,
        heading: r.device.lastHeading,
        lastPingAt: r.device.lastPingAt,
        trip: r.device.vehicleId ? tripByVehicle.get(r.device.vehicleId) ?? null : null,
      };
    });

  // Live trips whose vehicle has no reporting device: place a marker from route progress
  // so the simulator (and any un-instrumented vehicle) still appears on the live map.
  for (const { trip, booking } of liveTrips) {
    if (trip.vehicleId && covered.has(trip.vehicleId)) continue;
    let geometry: [number, number][] = [];
    try { geometry = JSON.parse(trip.routeGeometry) as [number, number][]; } catch { geometry = []; }
    if (!geometry.length) continue;
    const pos = geometry[Math.min(trip.progress, geometry.length - 1)];
    if (!pos) continue;
    markers.push({
      deviceId: `trip-${trip.id}`,
      deviceLabel: null,
      vehicleId: trip.vehicleId,
      vehicleReg: booking?.vehicleNumber ?? null,
      vehicleModel: null,
      lat: pos[0],
      lng: pos[1],
      speed: null,
      heading: null,
      lastPingAt: trip.updatedAt,
      trip: {
        bookingId: trip.bookingId,
        bookingNumber: booking?.bookingNumber ?? null,
        trackedKm: trip.trackedKm,
        routeDistanceKm: trip.routeDistanceKm,
        pickup: booking?.pickupLocation ?? null,
        drop: booking?.dropLocation ?? null,
      },
    });
  }

  res.json(markers);
});

// ---------- trips (bookings) + distance ----------

router.get("/v1/gps/trips", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db
    .select({ booking: bookingsTable, trip: tripTrackingTable })
    .from(bookingsTable)
    .leftJoin(tripTrackingTable, eq(tripTrackingTable.bookingId, bookingsTable.id))
    .where(and(eq(bookingsTable.companyId, cid), eq(bookingsTable.isDeleted, false)))
    .orderBy(desc(bookingsTable.pickupDate));
  res.json(
    rows.map((r) => ({
      bookingId: r.booking.id,
      bookingNumber: r.booking.bookingNumber,
      status: r.booking.status,
      pickupLocation: r.booking.pickupLocation,
      dropLocation: r.booking.dropLocation,
      pickupDate: r.booking.pickupDate,
      vehicleId: r.booking.vehicleId,
      vehicleNumber: r.booking.vehicleNumber,
      driverName: r.booking.driverName,
      customerName: r.booking.customerName,
      tracking: r.trip
        ? { status: r.trip.status, trackedKm: r.trip.trackedKm, routeDistanceKm: r.trip.routeDistanceKm, progress: r.trip.progress }
        : null,
    })),
  );
});

router.get("/v1/gps/trips/:bookingId/route", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [trip] = await db
    .select()
    .from(tripTrackingTable)
    .where(and(eq(tripTrackingTable.bookingId, req.params.bookingId), eq(tripTrackingTable.companyId, cid)));
  if (!trip) { res.status(404).json({ error: "No tracking for this trip" }); return; }
  const pings = await db
    .select()
    .from(gpsPingsTable)
    .where(and(eq(gpsPingsTable.bookingId, req.params.bookingId), eq(gpsPingsTable.companyId, cid)))
    .orderBy(gpsPingsTable.recordedAt);
  let geometry: LatLng[] = [];
  try { geometry = JSON.parse(trip.routeGeometry); } catch { geometry = []; }
  res.json({
    status: trip.status,
    routeGeometry: geometry,
    routeDistanceKm: trip.routeDistanceKm,
    trackedKm: trip.trackedKm,
    progress: trip.progress,
    trail: pings.map((p) => ({ lat: p.lat, lng: p.lng, speed: p.speed, recordedAt: p.recordedAt })),
    current: pings.length ? { lat: pings[pings.length - 1].lat, lng: pings[pings.length - 1].lng } : null,
  });
});

router.post("/v1/gps/trips/:bookingId/start", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.id, req.params.bookingId), eq(bookingsTable.companyId, cid)));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }

  const from = await geocodePlace(booking.pickupLocation);
  const to = await geocodePlace(booking.dropLocation);
  if (!from || !to) {
    res.status(422).json({ error: "Could not locate pickup or drop location. Please use recognisable place names." });
    return;
  }
  const { geometry, distanceKm } = await fetchRoute(from, to);

  // Resolve the vehicle (bookings may carry only the registration text, not the id).
  const vehicleId = await resolveVehicleId(cid, booking.vehicleId, booking.vehicleNumber);

  // Link the GPS device assigned to that vehicle, if any.
  let deviceId: string | null = null;
  if (vehicleId) {
    const [device] = await db
      .select()
      .from(gpsDevicesTable)
      .where(and(eq(gpsDevicesTable.vehicleId, vehicleId), eq(gpsDevicesTable.isDeleted, false)));
    deviceId = device?.id ?? null;
  }

  const [existing] = await db.select().from(tripTrackingTable).where(eq(tripTrackingTable.bookingId, booking.id));
  const values = {
    companyId: cid,
    bookingId: booking.id,
    deviceId,
    vehicleId,
    status: "live" as const,
    routeGeometry: JSON.stringify(geometry),
    routeDistanceKm: distanceKm,
    trackedKm: 0,
    progress: 0,
    startLat: from[0],
    startLng: from[1],
    endLat: to[0],
    endLng: to[1],
    startedAt: new Date(),
    completedAt: null,
  };
  let trip;
  if (existing) {
    [trip] = await db.update(tripTrackingTable).set(values).where(eq(tripTrackingTable.id, existing.id)).returning();
    await db.delete(gpsPingsTable).where(eq(gpsPingsTable.bookingId, booking.id));
  } else {
    [trip] = await db.insert(tripTrackingTable).values(values).returning();
  }

  // Seed the device at the route start so it appears on the live map immediately.
  if (deviceId) {
    await recordPing(cid, deviceId, vehicleId, booking.id, from[0], from[1], 0, null, new Date());
  }
  res.status(201).json(trip);
});

router.post("/v1/gps/trips/:bookingId/stop", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [trip] = await db
    .select()
    .from(tripTrackingTable)
    .where(and(eq(tripTrackingTable.bookingId, req.params.bookingId), eq(tripTrackingTable.companyId, cid)));
  if (!trip) { res.status(404).json({ error: "No tracking for this trip" }); return; }
  const [updated] = await db
    .update(tripTrackingTable)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(tripTrackingTable.id, trip.id))
    .returning();
  res.json(updated);
});

// ---------- simulation tick ----------
// Advances every live trip along its planned route by a few steps, recording pings.
// This drives the real-time map when no physical hardware is pushing data.

router.post("/v1/gps/tick", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const trips = await db
    .select()
    .from(tripTrackingTable)
    .where(and(eq(tripTrackingTable.companyId, cid), eq(tripTrackingTable.status, "live")));

  const STEP = 2; // route points advanced per tick
  let moved = 0;
  for (const trip of trips) {
    let geometry: LatLng[] = [];
    try { geometry = JSON.parse(trip.routeGeometry); } catch { geometry = []; }
    if (geometry.length < 2) continue;

    const nextIdx = Math.min(trip.progress + STEP, geometry.length - 1);
    const point = geometry[nextIdx];
    const prev = geometry[trip.progress] ?? geometry[0];
    const heading = bearing(prev, point);
    const speed = 30 + Math.round(Math.random() * 30);

    if (trip.deviceId) {
      await recordPing(cid, trip.deviceId, trip.vehicleId, trip.bookingId, point[0], point[1], speed, heading, new Date());
    } else {
      // No physical device linked — accumulate distance directly on the trip.
      const seg = haversineKm(prev[0], prev[1], point[0], point[1]);
      await db.update(tripTrackingTable).set({ trackedKm: trip.trackedKm + seg }).where(eq(tripTrackingTable.id, trip.id));
    }

    const completed = nextIdx >= geometry.length - 1;
    await db
      .update(tripTrackingTable)
      .set({
        progress: nextIdx,
        status: completed ? "completed" : "live",
        completedAt: completed ? new Date() : null,
      })
      .where(eq(tripTrackingTable.id, trip.id));
    moved++;
  }
  res.json({ ok: true, advanced: moved });
});

function bearing(from: LatLng, to: LatLng): number {
  const y = Math.sin(toRad(to[1] - from[1])) * Math.cos(toRad(to[0]));
  const x =
    Math.cos(toRad(from[0])) * Math.sin(toRad(to[0])) -
    Math.sin(toRad(from[0])) * Math.cos(toRad(to[0])) * Math.cos(toRad(to[1] - from[1]));
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export default router;
