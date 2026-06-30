import { pgTable, text, uuid, boolean, decimal, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { vehiclesTable } from "./fleet";

export const fastagsTable = pgTable("fastags", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id),
  vehicleId: uuid("vehicle_id").references(() => vehiclesTable.id),
  vehicleNumber: text("vehicle_number").notNull(),
  tagId: text("tag_id").notNull(),
  bank: text("bank").notNull().default("other"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  lowBalanceThreshold: decimal("low_balance_threshold", { precision: 10, scale: 2 }).notNull().default("200"),
  status: text("status").notNull().default("active"),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  notes: text("notes"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const fastagRechargesTable = pgTable("fastag_recharges", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companiesTable.id),
  fastagId: uuid("fastag_id").references(() => fastagsTable.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  transactionRef: text("transaction_ref"),
  rechargeMode: text("recharge_mode").notNull().default("upi"),
  balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }),
  rechargedBy: text("recharged_by"),
  notes: text("notes"),
  rechargedAt: timestamp("recharged_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFastagSchema = createInsertSchema(fastagsTable, {
  vehicleNumber: z.string().min(1),
  tagId: z.string().min(1),
}).omit({ id: true, isDeleted: true, createdAt: true, updatedAt: true });

export const insertFastagRechargeSchema = createInsertSchema(fastagRechargesTable, {
  amount: z.coerce.number().positive(),
}).omit({ id: true, createdAt: true });
