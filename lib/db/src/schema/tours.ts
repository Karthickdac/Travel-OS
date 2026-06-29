import { pgTable, text, uuid, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const destinationsTable = pgTable("destinations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id),
  name: text("name").notNull(),
  state: text("state"),
  country: text("country").notNull().default("India"),
  description: text("description"),
  imageUrl: text("image_url"),
  tags: text("tags").array().notNull().default([]),
  totalPackages: integer("total_packages").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const tourPackagesTable = pgTable("tour_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull().default(1),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  destinationId: uuid("destination_id").references(() => destinationsTable.id),
  destinationName: text("destination_name"),
  imageUrl: text("image_url"),
  inclusions: text("inclusions").array().notNull().default([]),
  exclusions: text("exclusions").array().notNull().default([]),
  highlights: text("highlights").array().notNull().default([]),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  totalBookings: integer("total_bookings").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  packageType: text("package_type").notNull().default("adventure"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDestinationSchema = createInsertSchema(destinationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTourPackageSchema = createInsertSchema(tourPackagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type Destination = typeof destinationsTable.$inferSelect;
export type InsertTourPackage = z.infer<typeof insertTourPackageSchema>;
export type TourPackage = typeof tourPackagesTable.$inferSelect;
