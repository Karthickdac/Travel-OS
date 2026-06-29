import { pgTable, text, uuid, integer, boolean, decimal, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { vehiclesTable } from "./fleet";

export const driversTable = pgTable("drivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  status: text("status").notNull().default("available"),
  licenseNumber: text("license_number").notNull(),
  licenseExpiry: date("license_expiry", { mode: "string" }),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  totalTrips: integer("total_trips").notNull().default(0),
  photoUrl: text("photo_url"),
  vehicleId: uuid("vehicle_id").references(() => vehiclesTable.id),
  joiningDate: date("joining_date", { mode: "string" }),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDriverSchema = createInsertSchema(driversTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof driversTable.$inferSelect;
