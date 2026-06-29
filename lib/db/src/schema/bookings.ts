import { pgTable, text, uuid, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { driversTable } from "./drivers";
import { vehiclesTable } from "./fleet";
import { customersTable } from "./customers";

export const bookingsTable = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id),
  bookingNumber: text("booking_number").notNull(),
  type: text("type").notNull().default("local_cab"),
  status: text("status").notNull().default("enquiry"),
  pickupDate: timestamp("pickup_date", { withTimezone: true }).notNull(),
  pickupLocation: text("pickup_location").notNull(),
  dropLocation: text("drop_location").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerId: uuid("customer_id").references(() => customersTable.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  advancePaid: decimal("advance_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  driverId: uuid("driver_id").references(() => driversTable.id),
  driverName: text("driver_name"),
  vehicleId: uuid("vehicle_id").references(() => vehiclesTable.id),
  vehicleNumber: text("vehicle_number"),
  vehicleCategory: text("vehicle_category"),
  vehicleCategoryId: uuid("vehicle_category_id"),
  notes: text("notes"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
