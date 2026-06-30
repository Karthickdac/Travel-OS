import { Router } from "express";
import { db } from "@workspace/db";
import { seoSettingsTable, seoRedirectsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

function companyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

// ---- SEO Settings (singleton per company) ----
router.get("/v1/cms/seo", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [row] = await db.select().from(seoSettingsTable).where(eq(seoSettingsTable.companyId, cid)).limit(1);
  res.json(row ?? null);
});

router.put("/v1/cms/seo", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const fields = {
    metaTitleTemplate: req.body.metaTitleTemplate,
    metaDescriptionTemplate: req.body.metaDescriptionTemplate,
    robotsTxt: req.body.robotsTxt,
    googleAnalyticsId: req.body.googleAnalyticsId,
    facebookPixelId: req.body.facebookPixelId,
    googleTagManagerId: req.body.googleTagManagerId,
    localBusinessSchema: req.body.localBusinessSchema,
  };
  const [existing] = await db.select().from(seoSettingsTable).where(eq(seoSettingsTable.companyId, cid)).limit(1);
  if (existing) {
    const [updated] = await db.update(seoSettingsTable).set(fields).where(eq(seoSettingsTable.id, existing.id)).returning();
    res.json(updated);
    return;
  }
  const [created] = await db.insert(seoSettingsTable).values({ companyId: cid, ...fields }).returning();
  res.status(201).json(created);
});

// ---- Redirects ----
router.get("/v1/cms/seo/redirects", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(seoRedirectsTable).where(eq(seoRedirectsTable.companyId, cid)).orderBy(desc(seoRedirectsTable.createdAt));
  res.json(rows);
});

router.post("/v1/cms/seo/redirects", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { fromPath, toPath, type } = req.body;
  const [created] = await db.insert(seoRedirectsTable).values({
    companyId: cid, fromPath, toPath, type: type || 301,
  }).returning();
  res.status(201).json(created);
});

router.delete("/v1/cms/seo/redirects/:id", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(seoRedirectsTable).where(and(eq(seoRedirectsTable.id, req.params.id), eq(seoRedirectsTable.companyId, cid)));
  res.status(204).end();
});

export default router;
