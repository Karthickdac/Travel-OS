import { pgTable, text, uuid, integer, boolean, decimal, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { tourPackagesTable } from "./tours";

export const tourItineraryTable = pgTable("tour_itinerary", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  packageId: uuid("package_id").notNull().references(() => tourPackagesTable.id),
  dayNumber: integer("day_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  accommodation: text("accommodation"),
  meals: text("meals"), // breakfast, lunch, dinner (comma-separated)
  activities: text("activities"), // JSON array of activity strings
  transport: text("transport"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const tourAvailabilityTable = pgTable("tour_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  packageId: uuid("package_id").notNull().references(() => tourPackagesTable.id),
  date: date("date", { mode: "string" }).notNull(),
  availableSlots: integer("available_slots").notNull().default(0),
  bookedSlots: integer("booked_slots").notNull().default(0),
  priceOverride: decimal("price_override", { precision: 10, scale: 2 }), // null = use package price
  isBlackout: boolean("is_blackout").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTourItinerarySchema = createInsertSchema(tourItineraryTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTourAvailabilitySchema = createInsertSchema(tourAvailabilityTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTourItinerary = z.infer<typeof insertTourItinerarySchema>;
export type InsertTourAvailability = z.infer<typeof insertTourAvailabilitySchema>;
export type TourItinerary = typeof tourItineraryTable.$inferSelect;
export type TourAvailability = typeof tourAvailabilityTable.$inferSelect;
