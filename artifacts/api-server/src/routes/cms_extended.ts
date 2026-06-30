import { Router } from "express";
import { db } from "@workspace/db";
import {
  cmsPagesTable, cmsMenusTable, cmsMenuItemsTable,
  blogsTable, mediaLibraryTable, homepageSectionsTable
} from "@workspace/db";
import { eq, and, desc, asc } from "drizzle-orm";

const router = Router();

// ── CMS PAGES ──────────────────────────────────────────────────────────────

router.get("/v1/cms/pages", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(cmsPagesTable)
    .where(and(eq(cmsPagesTable.companyId, companyId), eq(cmsPagesTable.isDeleted, false)))
    .orderBy(asc(cmsPagesTable.sortOrder), asc(cmsPagesTable.title));
  res.json(rows);
});

router.post("/v1/cms/pages", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { title, slug, content, metaTitle, metaDescription, ogImage, status, visibility, pageType } = req.body;
  const [row] = await db.insert(cmsPagesTable)
    .values({ companyId, title, slug: slug || title.toLowerCase().replace(/\s+/g, "-"), content: content || "", metaTitle, metaDescription, ogImage, status: status || "draft", visibility: visibility || "public", pageType: pageType || "custom" })
    .returning();
  res.status(201).json(row);
});

router.get("/v1/cms/pages/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [row] = await db.select().from(cmsPagesTable)
    .where(and(eq(cmsPagesTable.id, req.params.id), eq(cmsPagesTable.companyId, companyId)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.patch("/v1/cms/pages/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { title, slug, content, metaTitle, metaDescription, ogImage, status, visibility } = req.body;
  const updates: any = {};
  if (title !== undefined) updates.title = title;
  if (slug !== undefined) updates.slug = slug;
  if (content !== undefined) updates.content = content;
  if (metaTitle !== undefined) updates.metaTitle = metaTitle;
  if (metaDescription !== undefined) updates.metaDescription = metaDescription;
  if (ogImage !== undefined) updates.ogImage = ogImage;
  if (status !== undefined) { updates.status = status; if (status === "published") updates.publishedAt = new Date(); }
  if (visibility !== undefined) updates.visibility = visibility;
  const [row] = await db.update(cmsPagesTable).set(updates)
    .where(and(eq(cmsPagesTable.id, req.params.id), eq(cmsPagesTable.companyId, companyId)))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/v1/cms/pages/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.update(cmsPagesTable).set({ isDeleted: true })
    .where(and(eq(cmsPagesTable.id, req.params.id), eq(cmsPagesTable.companyId, companyId)));
  res.status(204).send();
});

// ── CMS MENUS ──────────────────────────────────────────────────────────────

router.get("/v1/cms/menus", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const menus = await db.select().from(cmsMenusTable)
    .where(eq(cmsMenusTable.companyId, companyId))
    .orderBy(asc(cmsMenusTable.name));
  const items = await db.select().from(cmsMenuItemsTable)
    .where(eq(cmsMenuItemsTable.companyId, companyId))
    .orderBy(asc(cmsMenuItemsTable.sortOrder));
  res.json(menus.map(m => ({ ...m, items: items.filter(i => i.menuId === m.id) })));
});

router.post("/v1/cms/menus", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [row] = await db.insert(cmsMenusTable).values({ companyId, name: req.body.name, menuType: req.body.menuType || "primary" }).returning();
  res.status(201).json({ ...row, items: [] });
});

router.patch("/v1/cms/menus/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [row] = await db.update(cmsMenusTable)
    .set({ name: req.body.name, menuType: req.body.menuType, isActive: req.body.isActive })
    .where(and(eq(cmsMenusTable.id, req.params.id), eq(cmsMenusTable.companyId, companyId)))
    .returning();
  res.json(row);
});

router.delete("/v1/cms/menus/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(cmsMenuItemsTable).where(eq(cmsMenuItemsTable.menuId, req.params.id));
  await db.delete(cmsMenusTable).where(and(eq(cmsMenusTable.id, req.params.id), eq(cmsMenusTable.companyId, companyId)));
  res.status(204).send();
});

router.post("/v1/cms/menus/:id/items", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { label, url, target, parentId, sortOrder } = req.body;
  const [row] = await db.insert(cmsMenuItemsTable)
    .values({ menuId: req.params.id, companyId, label, url, target: target || "_self", parentId, sortOrder: sortOrder || 0 })
    .returning();
  res.status(201).json(row);
});

router.patch("/v1/cms/menu-items/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const updates: any = {};
  if (req.body.label !== undefined) updates.label = req.body.label;
  if (req.body.url !== undefined) updates.url = req.body.url;
  if (req.body.target !== undefined) updates.target = req.body.target;
  if (req.body.sortOrder !== undefined) updates.sortOrder = req.body.sortOrder;
  if (req.body.isVisible !== undefined) updates.isVisible = req.body.isVisible;
  const [row] = await db.update(cmsMenuItemsTable).set(updates)
    .where(and(eq(cmsMenuItemsTable.id, req.params.id), eq(cmsMenuItemsTable.companyId, companyId)))
    .returning();
  res.json(row);
});

router.delete("/v1/cms/menu-items/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(cmsMenuItemsTable).where(and(eq(cmsMenuItemsTable.id, req.params.id), eq(cmsMenuItemsTable.companyId, companyId)));
  res.status(204).send();
});

// ── BLOGS ──────────────────────────────────────────────────────────────────

router.get("/v1/cms/blogs", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(blogsTable)
    .where(and(eq(blogsTable.companyId, companyId), eq(blogsTable.isDeleted, false)))
    .orderBy(desc(blogsTable.createdAt));
  res.json(rows);
});

router.post("/v1/cms/blogs", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { title, slug, excerpt, content, featuredImage, author, category, tags, metaTitle, metaDescription, status, readTime } = req.body;
  const [row] = await db.insert(blogsTable)
    .values({ companyId, title, slug: slug || title.toLowerCase().replace(/\s+/g, "-"), excerpt, content: content || "", featuredImage, author: author || "Admin", category, tags, metaTitle, metaDescription, status: status || "draft", readTime: readTime || 5, publishedAt: status === "published" ? new Date() : undefined })
    .returning();
  res.status(201).json(row);
});

router.get("/v1/cms/blogs/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [row] = await db.select().from(blogsTable).where(and(eq(blogsTable.id, req.params.id), eq(blogsTable.companyId, companyId)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.patch("/v1/cms/blogs/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const updates: any = { ...req.body };
  if (req.body.status === "published" && !req.body.publishedAt) updates.publishedAt = new Date();
  const [row] = await db.update(blogsTable).set(updates)
    .where(and(eq(blogsTable.id, req.params.id), eq(blogsTable.companyId, companyId)))
    .returning();
  res.json(row);
});

router.delete("/v1/cms/blogs/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.update(blogsTable).set({ isDeleted: true }).where(and(eq(blogsTable.id, req.params.id), eq(blogsTable.companyId, companyId)));
  res.status(204).send();
});

// ── MEDIA LIBRARY ──────────────────────────────────────────────────────────

router.get("/v1/cms/media", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(mediaLibraryTable)
    .where(and(eq(mediaLibraryTable.companyId, companyId), eq(mediaLibraryTable.isDeleted, false)))
    .orderBy(desc(mediaLibraryTable.createdAt));
  res.json(rows);
});

router.post("/v1/cms/media", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { filename, url, mimeType, sizeBytes, altText, folder } = req.body;
  const [row] = await db.insert(mediaLibraryTable)
    .values({ companyId, filename, url, mimeType: mimeType || "image/jpeg", sizeBytes, altText, folder: folder || "general" })
    .returning();
  res.status(201).json(row);
});

router.patch("/v1/cms/media/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [row] = await db.update(mediaLibraryTable).set({ altText: req.body.altText, folder: req.body.folder })
    .where(and(eq(mediaLibraryTable.id, req.params.id), eq(mediaLibraryTable.companyId, companyId)))
    .returning();
  res.json(row);
});

router.delete("/v1/cms/media/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.update(mediaLibraryTable).set({ isDeleted: true }).where(and(eq(mediaLibraryTable.id, req.params.id), eq(mediaLibraryTable.companyId, companyId)));
  res.status(204).send();
});

// ── HOMEPAGE SECTIONS ──────────────────────────────────────────────────────

router.get("/v1/cms/homepage-sections", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(homepageSectionsTable)
    .where(eq(homepageSectionsTable.companyId, companyId))
    .orderBy(asc(homepageSectionsTable.sortOrder));
  res.json(rows);
});

router.post("/v1/cms/homepage-sections", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { sectionType, title, config, sortOrder, isVisible } = req.body;
  const [row] = await db.insert(homepageSectionsTable)
    .values({ companyId, sectionType, title, config: config || "{}", sortOrder: sortOrder || 0, isVisible: isVisible ?? true })
    .returning();
  res.status(201).json(row);
});

router.patch("/v1/cms/homepage-sections/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const updates: any = {};
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.config !== undefined) updates.config = req.body.config;
  if (req.body.sortOrder !== undefined) updates.sortOrder = req.body.sortOrder;
  if (req.body.isVisible !== undefined) updates.isVisible = req.body.isVisible;
  const [row] = await db.update(homepageSectionsTable).set(updates)
    .where(and(eq(homepageSectionsTable.id, req.params.id), eq(homepageSectionsTable.companyId, companyId)))
    .returning();
  res.json(row);
});

router.delete("/v1/cms/homepage-sections/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(homepageSectionsTable).where(and(eq(homepageSectionsTable.id, req.params.id), eq(homepageSectionsTable.companyId, companyId)));
  res.status(204).send();
});

// Batch reorder
router.patch("/v1/cms/homepage-sections/reorder", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { order } = req.body as { order: { id: string; sortOrder: number }[] };
  for (const item of order) {
    await db.update(homepageSectionsTable).set({ sortOrder: item.sortOrder })
      .where(and(eq(homepageSectionsTable.id, item.id), eq(homepageSectionsTable.companyId, companyId)));
  }
  res.json({ ok: true });
});

export default router;
