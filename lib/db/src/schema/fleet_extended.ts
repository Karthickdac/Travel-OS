import { pgTable, text, uuid, integer, decimal, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { vehiclesTable } from "./fleet";

export const fuelLogsTable = pgTable("fuel_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  vehicleId: uuid("vehicle_id").notNull().references(() => vehiclesTable.id),
  date: date("date", { mode: "string" }).notNull(),
  litres: decimal("litres", { precision: 8, scale: 2 }).notNull(),
  odometer: integer("odometer").notNull().default(0),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  station: text("station"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const accidentRecordsTable = pgTable("accident_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  vehicleId: uuid("vehicle_id").notNull().references(() => vehiclesTable.id),
  date: date("date", { mode: "string" }).notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull().default("minor"), // minor, major, total
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull().default("0"),
  photoUrl: text("photo_url"),
  status: text("status").notNull().default("open"), // open, under_repair, resolved
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const vehicleAvailabilityTable = pgTable("vehicle_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  vehicleId: uuid("vehicle_id").notNull().references(() => vehiclesTable.id),
  fromDate: date("from_date", { mode: "string" }).notNull(),
  toDate: date("to_date", { mode: "string" }).notNull(),
  reason: text("reason").notNull().default("off_road"), // off_road, maintenance, booked, reserved
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFuelLogSchema = createInsertSchema(fuelLogsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAccidentRecordSchema = createInsertSchema(accidentRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVehicleAvailabilitySchema = createInsertSchema(vehicleAvailabilityTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFuelLog = z.infer<typeof insertFuelLogSchema>;
export type InsertAccidentRecord = z.infer<typeof insertAccidentRecordSchema>;
export type InsertVehicleAvailability = z.infer<typeof insertVehicleAvailabilitySchema>;
export type FuelLog = typeof fuelLogsTable.$inferSelect;
export type AccidentRecord = typeof accidentRecordsTable.$inferSelect;
export type VehicleAvailability = typeof vehicleAvailabilityTable.$inferSelect;
