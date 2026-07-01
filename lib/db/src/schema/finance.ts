import { pgTable, text, uuid, boolean, decimal, timestamp, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { bookingsTable } from "./bookings";
import { vehiclesTable } from "./fleet";
import { driversTable } from "./drivers";

export const invoicesTable = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id),
  invoiceNumber: text("invoice_number").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  bookingId: uuid("booking_id").references(() => bookingsTable.id),
  vehicleNumber: text("vehicle_number"),
  driverName: text("driver_name"),
  tripFrom: text("trip_from"),
  tripTo: text("trip_to"),
  kmsTraveled: integer("kms_traveled"),
  startingKm: integer("starting_km"),
  closingKm: integer("closing_km"),
  serviceDate: date("service_date", { mode: "string" }),
  description: text("description"),
  hireHours: decimal("hire_hours", { precision: 10, scale: 2 }).notNull().default("0"),
  hireHourRate: decimal("hire_hour_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  hireKms: integer("hire_kms").notNull().default(0),
  hireKmRate: decimal("hire_km_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  rentDays: decimal("rent_days", { precision: 10, scale: 2 }).notNull().default("0"),
  rentDayRate: decimal("rent_day_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  fuelKms: integer("fuel_kms").notNull().default(0),
  fuelKmRate: decimal("fuel_km_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  battaQty: decimal("batta_qty", { precision: 10, scale: 2 }).notNull().default("0"),
  battaRate: decimal("batta_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  hillsCharge: decimal("hills_charge", { precision: 10, scale: 2 }).notNull().default("0"),
  permitCharge: decimal("permit_charge", { precision: 10, scale: 2 }).notNull().default("0"),
  tollParking: decimal("toll_parking", { precision: 10, scale: 2 }).notNull().default("0"),
  taxRate: integer("tax_rate").notNull().default(18),
  sgstRate: decimal("sgst_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  cgstRate: decimal("cgst_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  sgstAmount: decimal("sgst_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  cgstAmount: decimal("cgst_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  status: text("status").notNull().default("draft"),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paymentMode: text("payment_mode"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const expensesTable = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id),
  category: text("category").notNull().default("misc"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  description: text("description").notNull(),
  vendorName: text("vendor_name"),
  vehicleId: uuid("vehicle_id").references(() => vehiclesTable.id),
  vehicleNumber: text("vehicle_number"),
  driverId: uuid("driver_id").references(() => driversTable.id),
  driverName: text("driver_name"),
  notes: text("notes"),
  receiptUrl: text("receipt_url"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertExpenseSchema = createInsertSchema(expensesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expensesTable.$inferSelect;
