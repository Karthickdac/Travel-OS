import { pgTable, text, uuid, boolean, timestamp } from "drizzle-orm/pg-core";
import { companiesTable } from "./companies";

export const websiteSettingsTable = pgTable("website_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id).unique(),

  // Hero
  heroTitle: text("hero_title").notNull().default("Madurai SMT Travels"),
  heroSubtitle: text("hero_subtitle").notNull().default("Your Journey, Our Passion"),
  heroDesc: text("hero_desc").default("Premium cab and tour services across Tamil Nadu and South India. Trusted by thousands of happy travellers."),
  heroCtaText: text("hero_cta_text").notNull().default("Book a Trip"),
  heroCtaPhone: text("hero_cta_phone").default("8110806339"),
  heroBgImage: text("hero_bg_image").default("https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1920&q=85&auto=format&fit=crop"),

  // Branding
  companyDisplayName: text("company_display_name").default("Madurai SMT Travels"),
  tagline: text("tagline").default("Your Journey, Our Passion"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").default("#f97316"),

  // Contact & Socials
  phone: text("phone").default("8110806339"),
  email: text("email"),
  address: text("address").default("Madurai, Tamil Nadu"),
  socialWhatsapp: text("social_whatsapp"),
  socialFacebook: text("social_facebook"),
  socialInstagram: text("social_instagram"),
  socialYoutube: text("social_youtube"),

  // Stats
  stat1Value: text("stat1_value").default("5000+"),
  stat1Label: text("stat1_label").default("Happy Customers"),
  stat2Value: text("stat2_value").default("12+"),
  stat2Label: text("stat2_label").default("Years Experience"),
  stat3Value: text("stat3_value").default("50+"),
  stat3Label: text("stat3_label").default("Vehicles"),
  stat4Value: text("stat4_value").default("200+"),
  stat4Label: text("stat4_label").default("Tour Packages"),

  // About section
  aboutTitle: text("about_title").default("Why Choose Us?"),
  aboutText: text("about_text").default("We are Madurai's most trusted travel partner — offering premium cab services, curated tour packages, and 24/7 support for an unforgettable journey."),

  // Announcement ticker
  announcementBar: text("announcement_bar").default("✈️ New packages to Kodaikanal | 🚗 AC Cab rental available 24/7 | 🌴 Special rates for group bookings"),

  // CTA section
  ctaTitle: text("cta_title").default("Ready to Explore South India?"),
  ctaSubtitle: text("cta_subtitle").default("Book your dream trip today. Best prices, best service."),

  // Feature flags
  showPackages: boolean("show_packages").notNull().default(true),
  showDestinations: boolean("show_destinations").notNull().default(true),
  showEnquiryForm: boolean("show_enquiry_form").notNull().default(true),

  // Homepage layout
  homepageTemplate: text("homepage_template").notNull().default("classic"),
  sectionLayouts: text("section_layouts").notNull().default("{}"),

  // SEO
  metaTitle: text("meta_title").default("Madurai SMT Travels — Cab & Tour Packages"),
  metaDescription: text("meta_description").default("Book cab and tour packages across South India with Madurai SMT Travels. Best prices, trusted service, 24/7 support."),
  metaKeywords: text("meta_keywords").default("madurai travels, madurai taxi, madurai cab booking, tamil nadu tour packages, madurai to kodaikanal cab, madurai tour operator, south india tour package, temple tour madurai, outstation cab madurai, airport taxi madurai"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
