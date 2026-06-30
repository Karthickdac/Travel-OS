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
  serviceDate: date("service_date", { mode: "string" }),
  description: text("description"),
  taxRate: integer("tax_rate").notNull().default(18),
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
