import { pgTable, text, uuid, decimal, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const refundsTable = pgTable("refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  invoiceId: uuid("invoice_id"),
  customerName: text("customer_name").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  reason: text("reason"),
  method: text("method").notNull().default("wallet"), // wallet, gateway, cash, bank
  status: text("status").notNull().default("pending"), // pending, approved, rejected, processed
  requestedAt: date("requested_at", { mode: "string" }).notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const cashBookTable = pgTable("cash_book", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  date: date("date", { mode: "string" }).notNull(),
  type: text("type").notNull(), // in, out
  category: text("category").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMode: text("payment_mode").notNull().default("cash"), // cash, bank, upi, card
  reference: text("reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ledgerEntriesTable = pgTable("ledger_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  accountType: text("account_type").notNull(), // customer, vendor
  accountName: text("account_name").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  description: text("description"),
  debit: decimal("debit", { precision: 12, scale: 2 }).notNull().default("0"),
  credit: decimal("credit", { precision: 12, scale: 2 }).notNull().default("0"),
  reference: text("reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRefundSchema = createInsertSchema(refundsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCashBookSchema = createInsertSchema(cashBookTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLedgerEntrySchema = createInsertSchema(ledgerEntriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRefund = z.infer<typeof insertRefundSchema>;
export type InsertCashBook = z.infer<typeof insertCashBookSchema>;
export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;
export type Refund = typeof refundsTable.$inferSelect;
export type CashBook = typeof cashBookTable.$inferSelect;
export type LedgerEntry = typeof ledgerEntriesTable.$inferSelect;
