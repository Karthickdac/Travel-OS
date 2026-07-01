import { pgTable, text, uuid, boolean, doublePrecision, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { vehiclesTable } from "./fleet";
import { bookingsTable } from "./bookings";

// A physical GPS tracker unit. Real hardware pushes location via POST /v1/gps/ingest
// authenticated with deviceId + ingestKey. Vendor-agnostic (any device that can POST HTTP).
export const gpsDevicesTable = pgTable("gps_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id),
  deviceId: text("device_id").notNull(), // IMEI / serial — unique per company
  provider: text("provider").notNull().default("generic"), // generic | tbtrack — GPS vendor/protocol
  label: text("label"),
  simNumber: text("sim_number"),
  ingestKey: text("ingest_key").notNull(), // secret used by the device to authenticate pings
  vehicleId: uuid("vehicle_id").references(() => vehiclesTable.id),
  status: text("status").notNull().default("inactive"), // active | inactive
  lastLat: doublePrecision("last_lat"),
  lastLng: doublePrecision("last_lng"),
  lastSpeed: doublePrecision("last_speed"),
  lastHeading: doublePrecision("last_heading"),
  lastPingAt: timestamp("last_ping_at", { withTimezone: true }),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// Individual location breadcrumbs — the actual travelled trail for a device / trip.
export const gpsPingsTable = pgTable("gps_pings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id),
  deviceId: uuid("device_id").references(() => gpsDevicesTable.id),
  vehicleId: uuid("vehicle_id").references(() => vehiclesTable.id),
  bookingId: uuid("booking_id").references(() => bookingsTable.id),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  speed: doublePrecision("speed"),
  heading: doublePrecision("heading"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Per-trip (booking) tracking session: planned route + live progress + distance.
export const tripTrackingTable = pgTable("trip_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id),
  bookingId: uuid("booking_id").references(() => bookingsTable.id).notNull(),
  deviceId: uuid("device_id").references(() => gpsDevicesTable.id),
  vehicleId: uuid("vehicle_id").references(() => vehiclesTable.id),
  status: text("status").notNull().default("idle"), // idle | live | completed
  routeGeometry: text("route_geometry").notNull().default("[]"), // JSON array of [lat, lng]
  routeDistanceKm: doublePrecision("route_distance_km").notNull().default(0),
  trackedKm: doublePrecision("tracked_km").notNull().default(0),
  progress: integer("progress").notNull().default(0), // index into routeGeometry
  startLat: doublePrecision("start_lat"),
  startLng: doublePrecision("start_lng"),
  endLat: doublePrecision("end_lat"),
  endLng: doublePrecision("end_lng"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGpsDeviceSchema = createInsertSchema(gpsDevicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGpsDevice = z.infer<typeof insertGpsDeviceSchema>;
export type GpsDevice = typeof gpsDevicesTable.$inferSelect;
export type GpsPing = typeof gpsPingsTable.$inferSelect;
export type TripTracking = typeof tripTrackingTable.$inferSelect;
