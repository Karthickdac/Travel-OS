import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, websiteSettingsTable, companiesTable } from "@workspace/db";

const router: IRouter = Router();

// Allowed homepage layout values — kept in sync with the frontend
// artifacts/travel-os/src/lib/homepage-templates.ts. Used to validate/normalize
// the PUT /cms/settings payload so non-UI clients cannot persist unrenderable values.
const VALID_TEMPLATES = new Set(["classic", "minimal", "bold", "luxe", "vibrant"]);
const SECTION_VARIANTS: Record<string, Set<string>> = {
  hero: new Set(["centered", "split", "minimal"]),
  destinations: new Set(["masonry", "compact", "featured"]),
  packages: new Set(["grid", "carousel", "list"]),
  whyUs: new Set(["split", "centered", "cards"]),
};

function mapSettings(s: typeof websiteSettingsTable.$inferSelect) {
  return {
    id: s.id,
    companyId: s.companyId,
    heroTitle: s.heroTitle,
    heroSubtitle: s.heroSubtitle,
    heroDesc: s.heroDesc,
    heroCtaText: s.heroCtaText,
    heroCtaPhone: s.heroCtaPhone,
    heroBgImage: s.heroBgImage,
    companyDisplayName: s.companyDisplayName,
    tagline: s.tagline,
    logoUrl: s.logoUrl,
    faviconUrl: s.faviconUrl,
    primaryColor: s.primaryColor,
    phone: s.phone,
    email: s.email,
    address: s.address,
    socialWhatsapp: s.socialWhatsapp,
    socialFacebook: s.socialFacebook,
    socialInstagram: s.socialInstagram,
    socialYoutube: s.socialYoutube,
    stat1Value: s.stat1Value,
    stat1Label: s.stat1Label,
    stat2Value: s.stat2Value,
    stat2Label: s.stat2Label,
    stat3Value: s.stat3Value,
    stat3Label: s.stat3Label,
    stat4Value: s.stat4Value,
    stat4Label: s.stat4Label,
    aboutTitle: s.aboutTitle,
    aboutText: s.aboutText,
    announcementBar: s.announcementBar,
    ctaTitle: s.ctaTitle,
    ctaSubtitle: s.ctaSubtitle,
    showPackages: s.showPackages,
    showDestinations: s.showDestinations,
    showEnquiryForm: s.showEnquiryForm,
    homepageTemplate: s.homepageTemplate,
    sectionLayouts: s.sectionLayouts,
    metaTitle: s.metaTitle,
    metaDescription: s.metaDescription,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

async function upsertDefaults(companyId: string) {
  const [existing] = await db.select().from(websiteSettingsTable).where(eq(websiteSettingsTable.companyId, companyId));
  if (existing) return existing;
  const company = await db.select().from(companiesTable).where(eq(companiesTable.id, companyId)).then(r => r[0]);
  const [created] = await db.insert(websiteSettingsTable).values({
    companyId,
    companyDisplayName: company?.name ?? "My Travel Company",
    heroTitle: company?.name ?? "My Travel Company",
    phone: company?.phone ?? undefined,
    email: company?.email ?? undefined,
    address: company?.city ?? undefined,
    logoUrl: company?.logo ?? undefined,
  }).returning();
  return created;
}

function normalizeHost(h: string): string {
  return h.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/:\d+$/, "").toLowerCase();
}

async function resolveCompanyIdByDomain(domain: string): Promise<string | null> {
  const normalized = normalizeHost(domain);
  if (!normalized || normalized === "localhost" || normalized.endsWith(".replit.dev") || normalized.endsWith(".replit.app")) {
    return null;
  }
  const companies = await db.select({ id: companiesTable.id, domain: companiesTable.domain }).from(companiesTable);
  const match = companies.find(c => {
    if (!c.domain) return false;
    const stored = normalizeHost(c.domain);
    return stored === normalized
      || stored === `www.${normalized}`
      || `www.${stored}` === normalized;
  });
  return match?.id ?? null;
}

router.get("/v1/cms/settings", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const settings = await upsertDefaults(companyId);
  res.json(mapSettings(settings));
});

router.put("/v1/cms/settings", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await upsertDefaults(companyId);
  const body = req.body as Record<string, unknown>;
  const updateData: Partial<typeof websiteSettingsTable.$inferInsert> = {};
  const fields = [
    "heroTitle","heroSubtitle","heroDesc","heroCtaText","heroCtaPhone","heroBgImage",
    "companyDisplayName","tagline","logoUrl","faviconUrl","primaryColor",
    "phone","email","address","socialWhatsapp","socialFacebook","socialInstagram","socialYoutube",
    "stat1Value","stat1Label","stat2Value","stat2Label","stat3Value","stat3Label","stat4Value","stat4Label",
    "aboutTitle","aboutText","announcementBar","ctaTitle","ctaSubtitle",
    "showPackages","showDestinations","showEnquiryForm","metaTitle","metaDescription",
    "homepageTemplate","sectionLayouts",
  ] as const;
  for (const f of fields) {
    if (body[f] !== undefined) (updateData as any)[f] = body[f];
  }

  // Validate/normalize the homepage layout fields so non-UI clients cannot
  // persist values the public site can't render.
  if (updateData.homepageTemplate !== undefined) {
    if (!VALID_TEMPLATES.has(String(updateData.homepageTemplate))) {
      res.status(400).json({ error: `Invalid homepageTemplate. Allowed: ${[...VALID_TEMPLATES].join(", ")}` });
      return;
    }
  }
  if (updateData.sectionLayouts !== undefined) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(String(updateData.sectionLayouts));
    } catch {
      res.status(400).json({ error: "sectionLayouts must be a valid JSON object" });
      return;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      res.status(400).json({ error: "sectionLayouts must be a JSON object" });
      return;
    }
    // Strip unknown sections and invalid variant values (normalize to canonical).
    const normalized: Record<string, string> = {};
    for (const [section, variant] of Object.entries(parsed as Record<string, unknown>)) {
      const allowed = SECTION_VARIANTS[section];
      if (allowed && typeof variant === "string" && allowed.has(variant)) {
        normalized[section] = variant;
      }
    }
    updateData.sectionLayouts = JSON.stringify(normalized);
  }

  const [updated] = await db.update(websiteSettingsTable).set(updateData).where(eq(websiteSettingsTable.companyId, companyId)).returning();
  res.json(mapSettings(updated));
});

router.put("/v1/company/domain", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { domain } = req.body as { domain?: string };
  if (domain === undefined) { res.status(400).json({ error: "domain is required" }); return; }
  await db.update(companiesTable).set({ domain: domain || null }).where(eq(companiesTable.id, companyId));
  res.json({ domain: domain || null });
});

router.get("/v1/public/cms", async (req, res): Promise<void> => {
  const companyId = req.query.companyId as string | undefined;
  const domain = req.query.domain as string | undefined;

  let resolvedCompanyId = companyId;
  if (!resolvedCompanyId && domain) {
    resolvedCompanyId = (await resolveCompanyIdByDomain(domain)) ?? undefined;
  }

  let settings: typeof websiteSettingsTable.$inferSelect | undefined;
  if (resolvedCompanyId) {
    [settings] = await db.select().from(websiteSettingsTable).where(eq(websiteSettingsTable.companyId, resolvedCompanyId));
  } else {
    [settings] = await db.select().from(websiteSettingsTable).orderBy(asc(websiteSettingsTable.companyId)).limit(1);
  }
  if (!settings) {
    const [company] = await db.select().from(companiesTable).orderBy(asc(companiesTable.id)).limit(1);
    if (!company) { res.status(404).json({ error: "No settings found" }); return; }
    settings = await upsertDefaults(company.id);
  }
  res.json(mapSettings(settings));
});

export default router;
