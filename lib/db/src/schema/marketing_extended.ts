import { pgTable, text, uuid, integer, decimal, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const referralsTable = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  referrerName: text("referrer_name").notNull(),
  referrerPhone: text("referrer_phone"),
  code: text("code").notNull(),
  refereeName: text("referee_name"),
  refereePhone: text("referee_phone"),
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("pending"), // pending, completed, rewarded
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const campaignsTable = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  name: text("name").notNull(),
  channel: text("channel").notNull().default("email"), // email, sms, whatsapp, push
  subject: text("subject"),
  message: text("message"),
  audience: text("audience").notNull().default("all"), // all, leads, customers
  status: text("status").notNull().default("draft"), // draft, scheduled, sent
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  sentCount: integer("sent_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const loyaltyTransactionsTable = pgTable("loyalty_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  customerId: uuid("customer_id"),
  customerName: text("customer_name").notNull(),
  type: text("type").notNull(), // earn, redeem
  points: integer("points").notNull(),
  reason: text("reason"),
  date: date("date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReferralSchema = createInsertSchema(referralsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;
export type Referral = typeof referralsTable.$inferSelect;
export type Campaign = typeof campaignsTable.$inferSelect;
export type LoyaltyTransaction = typeof loyaltyTransactionsTable.$inferSelect;
