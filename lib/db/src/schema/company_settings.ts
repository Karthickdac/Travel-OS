import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const companySettingsTable = pgTable("company_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  theme: text("theme").notNull().default("travel_agency"),
  primaryColor: text("primary_color").notNull().default("#f97316"),
  secondaryColor: text("secondary_color").notNull().default("#0d9488"),
  accentColor: text("accent_color").notNull().default("#3b82f6"),
  fontFamily: text("font_family").notNull().default("Inter"),
  borderRadius: text("border_radius").notNull().default("rounded"), // sharp, rounded, pill
  darkMode: text("dark_mode").notNull().default("system"), // system, light, dark
  customCss: text("custom_css"),
  customJs: text("custom_js"),
  cookieConsentText: text("cookie_consent_text"),
  whatsappToken: text("whatsapp_token"),
  smsGatewayKey: text("sms_gateway_key"),
  googleMapsKey: text("google_maps_key"),
  razorpayKeyId: text("razorpay_key_id"),
  stripePublishableKey: text("stripe_publishable_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCompanySettingsSchema = createInsertSchema(companySettingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof companySettingsTable.$inferSelect;
