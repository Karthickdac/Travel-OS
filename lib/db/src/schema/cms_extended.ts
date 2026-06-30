import { pgTable, text, uuid, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const cmsPagesTable = pgTable("cms_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content").notNull().default(""),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  ogImage: text("og_image"),
  status: text("status").notNull().default("draft"), // draft, published, scheduled
  visibility: text("visibility").notNull().default("public"), // public, hidden, private
  pageType: text("page_type").notNull().default("custom"), // custom, home, about, contact, blog, gallery, faq, careers, privacy, terms
  sortOrder: integer("sort_order").notNull().default(0),
  isDeleted: boolean("is_deleted").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const cmsMenusTable = pgTable("cms_menus", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  name: text("name").notNull(),
  menuType: text("menu_type").notNull().default("primary"), // primary, footer, mobile
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const cmsMenuItemsTable = pgTable("cms_menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuId: uuid("menu_id").notNull().references(() => cmsMenusTable.id),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  label: text("label").notNull(),
  url: text("url").notNull(),
  target: text("target").notNull().default("_self"), // _self, _blank
  parentId: uuid("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const blogsTable = pgTable("blogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull().default(""),
  featuredImage: text("featured_image"),
  author: text("author").notNull().default("Admin"),
  category: text("category"),
  tags: text("tags"), // comma-separated
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  status: text("status").notNull().default("draft"), // draft, published
  readTime: integer("read_time").default(5),
  isDeleted: boolean("is_deleted").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const mediaLibraryTable = pgTable("media_library", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type").notNull().default("image/jpeg"),
  sizeBytes: integer("size_bytes"),
  altText: text("alt_text"),
  folder: text("folder").default("general"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const homepageSectionsTable = pgTable("homepage_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  sectionType: text("section_type").notNull(), // hero, search_box, featured_cars, popular_destinations, popular_tours, why_choose_us, testimonials, statistics, gallery, video, offers, latest_blogs, partners, faq, newsletter, contact, google_reviews, instagram_feed, footer, announcement_bar
  title: text("title"),
  config: text("config").notNull().default("{}"), // JSON config blob
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCmsPageSchema = createInsertSchema(cmsPagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCmsMenuSchema = createInsertSchema(cmsMenusTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCmsMenuItemSchema = createInsertSchema(cmsMenuItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBlogSchema = createInsertSchema(blogsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMediaSchema = createInsertSchema(mediaLibraryTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHomepageSectionSchema = createInsertSchema(homepageSectionsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type CmsPage = typeof cmsPagesTable.$inferSelect;
export type CmsMenu = typeof cmsMenusTable.$inferSelect;
export type CmsMenuItem = typeof cmsMenuItemsTable.$inferSelect;
export type Blog = typeof blogsTable.$inferSelect;
export type MediaItem = typeof mediaLibraryTable.$inferSelect;
export type HomepageSection = typeof homepageSectionsTable.$inferSelect;
