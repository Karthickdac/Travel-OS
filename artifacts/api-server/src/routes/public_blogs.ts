import { Router, type IRouter } from "express";
import { eq, and, asc, desc } from "drizzle-orm";
import { db, blogsTable, companiesTable, type Blog } from "@workspace/db";
import { ListPublicBlogsResponse, GetPublicBlogResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function normalizeHost(input: string): string {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].split(":")[0];
}

async function resolveCompanyIdByDomain(domain: string): Promise<string | null> {
  const normalized = normalizeHost(domain);
  if (!normalized) return null;
  const companies = await db.select({ id: companiesTable.id, domain: companiesTable.domain }).from(companiesTable);
  const match = companies.find((c) => {
    if (!c.domain) return false;
    const stored = normalizeHost(c.domain);
    return stored === normalized || normalized.endsWith(`.${stored}`) || stored.endsWith(`.${normalized}`);
  });
  return match?.id ?? null;
}

async function resolvePublicCompanyId(req: { query: Record<string, unknown> }): Promise<string | undefined> {
  const companyId = req.query.companyId as string | undefined;
  const domain = req.query.domain as string | undefined;
  let resolved = companyId;
  if (!resolved && domain) {
    resolved = (await resolveCompanyIdByDomain(domain)) ?? undefined;
  }
  if (!resolved) {
    const [firstCompany] = await db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .orderBy(asc(companiesTable.id))
      .limit(1);
    resolved = firstCompany?.id;
  }
  return resolved;
}

function mapSummary(b: Blog) {
  return {
    id: b.id,
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt,
    featuredImage: b.featuredImage,
    author: b.author,
    category: b.category,
    tags: b.tags,
    readTime: b.readTime,
    publishedAt: b.publishedAt ? new Date(b.publishedAt).toISOString() : null,
  };
}

router.get("/v1/public/blogs", async (req, res): Promise<void> => {
  const companyId = await resolvePublicCompanyId(req);
  if (!companyId) { res.json([]); return; }
  const rows = await db
    .select()
    .from(blogsTable)
    .where(and(eq(blogsTable.companyId, companyId), eq(blogsTable.status, "published"), eq(blogsTable.isDeleted, false)))
    .orderBy(desc(blogsTable.publishedAt), desc(blogsTable.createdAt));
  res.json(ListPublicBlogsResponse.parse(rows.map(mapSummary)));
});

router.get("/v1/public/blogs/:slug", async (req, res): Promise<void> => {
  const companyId = await resolvePublicCompanyId(req);
  if (!companyId) { res.status(404).json({ error: "Not found" }); return; }
  const [row] = await db
    .select()
    .from(blogsTable)
    .where(
      and(
        eq(blogsTable.slug, req.params.slug),
        eq(blogsTable.companyId, companyId),
        eq(blogsTable.status, "published"),
        eq(blogsTable.isDeleted, false),
      ),
    );
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(
    GetPublicBlogResponse.parse({
      ...mapSummary(row),
      content: row.content,
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
    }),
  );
});

export default router;
