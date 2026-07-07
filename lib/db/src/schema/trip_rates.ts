import { pgTable, text, uuid, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { companiesTable } from "./companies";

export const tripRatesTable = pgTable("trip_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id),
  vehicleType: text("vehicle_type").notNull(),
  vehicleExamples: text("vehicle_examples"),
  seats: integer("seats"),
  imageUrl: text("image_url"),
  ratePerKm: decimal("rate_per_km", { precision: 10, scale: 2 }).notNull().default("0"),
  nonAcRatePerKm: decimal("non_ac_rate_per_km", { precision: 10, scale: 2 }).notNull().default("0"),
  nonAcDayRate: decimal("non_ac_day_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  nonAcExtraKmRate: decimal("non_ac_extra_km_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  minKmPerDay: integer("min_km_per_day").notNull().default(250),
  dayRate: decimal("day_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  kmIncludedPerDay: integer("km_included_per_day").notNull().default(100),
  extraKmRate: decimal("extra_km_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  driverBataPerDay: decimal("driver_bata_per_day", { precision: 10, scale: 2 }).notNull().default("0"),
  nightHaltCharge: decimal("night_halt_charge", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const tripEstimatorSettingsTable = pgTable("trip_estimator_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id).unique(),
  enabled: boolean("enabled").notNull().default(true),
  allowOneWay: boolean("allow_one_way").notNull().default(true),
  allowRoundTrip: boolean("allow_round_trip").notNull().default(true),
  gstPercent: decimal("gst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  tollNote: text("toll_note"),
  termsNote: text("terms_note"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
