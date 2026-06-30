import { pgTable, text, uuid, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const seoSettingsTable = pgTable("seo_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  metaTitleTemplate: text("meta_title_template"),
  metaDescriptionTemplate: text("meta_description_template"),
  robotsTxt: text("robots_txt"),
  googleAnalyticsId: text("google_analytics_id"),
  facebookPixelId: text("facebook_pixel_id"),
  googleTagManagerId: text("google_tag_manager_id"),
  localBusinessSchema: text("local_business_schema"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const seoRedirectsTable = pgTable("seo_redirects", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  fromPath: text("from_path").notNull(),
  toPath: text("to_path").notNull(),
  type: integer("type").notNull().default(301), // 301 or 302
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSeoSettingsSchema = createInsertSchema(seoSettingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSeoRedirectSchema = createInsertSchema(seoRedirectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSeoSettings = z.infer<typeof insertSeoSettingsSchema>;
export type InsertSeoRedirect = z.infer<typeof insertSeoRedirectSchema>;
export type SeoSettings = typeof seoSettingsTable.$inferSelect;
export type SeoRedirect = typeof seoRedirectsTable.$inferSelect;
