import { pgTable, text, uuid, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { vendorsTable } from "./vendors";
import { vehiclesTable } from "./fleet";

export const vendorVehiclesTable = pgTable("vendor_vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id),
  vehicleMake: text("vehicle_make").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  vehicleNumber: text("vehicle_number").notNull(),
  category: text("category").notNull().default("sedan"),
  seatingCapacity: integer("seating_capacity").notNull().default(4),
  ratePerKm: decimal("rate_per_km", { precision: 8, scale: 2 }),
  ratePerDay: decimal("rate_per_day", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const vendorSettlementsTable = pgTable("vendor_settlements", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id),
  month: text("month").notNull(), // YYYY-MM
  totalTrips: integer("total_trips").notNull().default(0),
  grossAmount: decimal("gross_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  netPayable: decimal("net_payable", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("pending"), // pending, paid, partial
  notes: text("notes"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVendorVehicleSchema = createInsertSchema(vendorVehiclesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVendorSettlementSchema = createInsertSchema(vendorSettlementsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVendorVehicle = z.infer<typeof insertVendorVehicleSchema>;
export type InsertVendorSettlement = z.infer<typeof insertVendorSettlementSchema>;
export type VendorVehicle = typeof vendorVehiclesTable.$inferSelect;
export type VendorSettlement = typeof vendorSettlementsTable.$inferSelect;
