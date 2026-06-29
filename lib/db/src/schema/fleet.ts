import { pgTable, text, uuid, integer, decimal, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const vehicleCategoriesTable = pgTable("vehicle_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id),
  name: text("name").notNull(),
  description: text("description"),
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }),
  perKmRate: decimal("per_km_rate", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const vehiclesTable = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id),
  registrationNumber: text("registration_number").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  color: text("color"),
  categoryId: uuid("category_id").references(() => vehicleCategoriesTable.id),
  category: text("category"),
  status: text("status").notNull().default("available"),
  fuelType: text("fuel_type"),
  seatingCapacity: integer("seating_capacity"),
  imageUrl: text("image_url"),
  lastService: date("last_service", { mode: "string" }),
  insuranceExpiry: date("insurance_expiry", { mode: "string" }),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVehicleSchema = createInsertSchema(vehiclesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVehicleCategorySchema = createInsertSchema(vehicleCategoriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehiclesTable.$inferSelect;
export type InsertVehicleCategory = z.infer<typeof insertVehicleCategorySchema>;
export type VehicleCategory = typeof vehicleCategoriesTable.$inferSelect;
