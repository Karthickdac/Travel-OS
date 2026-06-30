import { pgTable, text, uuid, integer, boolean, decimal, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { driversTable } from "./drivers";

export const driverAttendanceTable = pgTable("driver_attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  driverId: uuid("driver_id").notNull().references(() => driversTable.id),
  date: date("date", { mode: "string" }).notNull(),
  status: text("status").notNull().default("present"), // present, absent, half_day, leave
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const driverSalaryTable = pgTable("driver_salary", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  driverId: uuid("driver_id").notNull().references(() => driversTable.id),
  month: text("month").notNull(), // YYYY-MM
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull().default("0"),
  tripIncentive: decimal("trip_incentive", { precision: 10, scale: 2 }).notNull().default("0"),
  allowances: decimal("allowances", { precision: 10, scale: 2 }).notNull().default("0"),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).notNull().default("0"),
  bonus: decimal("bonus", { precision: 10, scale: 2 }).notNull().default("0"),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull().default("0"),
  tripsCount: integer("trips_count").notNull().default(0),
  presentDays: integer("present_days").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending, paid
  paidAt: timestamp("paid_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const driverLeaveTable = pgTable("driver_leave", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  driverId: uuid("driver_id").notNull().references(() => driversTable.id),
  fromDate: date("from_date", { mode: "string" }).notNull(),
  toDate: date("to_date", { mode: "string" }).notNull(),
  type: text("type").notNull().default("casual"), // casual, sick, emergency, unpaid
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const driverBonusPenaltyTable = pgTable("driver_bonus_penalty", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  driverId: uuid("driver_id").notNull().references(() => driversTable.id),
  type: text("type").notNull(), // bonus, penalty
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDriverAttendanceSchema = createInsertSchema(driverAttendanceTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDriverSalarySchema = createInsertSchema(driverSalaryTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDriverLeaveSchema = createInsertSchema(driverLeaveTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDriverBonusPenaltySchema = createInsertSchema(driverBonusPenaltyTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDriverAttendance = z.infer<typeof insertDriverAttendanceSchema>;
export type InsertDriverSalary = z.infer<typeof insertDriverSalarySchema>;
export type InsertDriverLeave = z.infer<typeof insertDriverLeaveSchema>;
export type InsertDriverBonusPenalty = z.infer<typeof insertDriverBonusPenaltySchema>;
export type DriverAttendance = typeof driverAttendanceTable.$inferSelect;
export type DriverSalary = typeof driverSalaryTable.$inferSelect;
export type DriverLeave = typeof driverLeaveTable.$inferSelect;
export type DriverBonusPenalty = typeof driverBonusPenaltyTable.$inferSelect;
