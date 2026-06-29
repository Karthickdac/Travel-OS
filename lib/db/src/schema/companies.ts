import { pgTable, text, uuid, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionPlansTable = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull().default(30),
  maxUsers: integer("max_users").notNull().default(5),
  maxVehicles: integer("max_vehicles").notNull().default(10),
  maxBookingsPerMonth: integer("max_bookings_per_month"),
  features: text("features").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const companiesTable = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  status: text("status").notNull().default("trial"),
  plan: text("plan").notNull().default("starter"),
  planId: uuid("plan_id").references(() => subscriptionPlansTable.id),
  domain: text("domain"),
  logo: text("logo"),
  city: text("city"),
  country: text("country"),
  gstNumber: text("gst_number"),
  totalBookings: integer("total_bookings").notNull().default(0),
  totalUsers: integer("total_users").notNull().default(0),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCompanySchema = createInsertSchema(companiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPlanSchema = createInsertSchema(subscriptionPlansTable).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companiesTable.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlansTable.$inferSelect;
