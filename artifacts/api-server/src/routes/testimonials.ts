import { Router, type IRouter } from "express";
import { eq, and, asc, desc } from "drizzle-orm";
import { db, testimonialsTable, companiesTable, type Testimonial } from "@workspace/db";
import {
  ListTestimonialsResponse,
  CreateTestimonialBody,
  CreateTestimonialResponse,
  UpdateTestimonialBody,
  UpdateTestimonialResponse,
  GetPublicTestimonialsResponse,
} from "@workspace/api-zod";

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

function mapTestimonial(t: Testimonial) {
  return {
    id: t.id,
    authorName: t.authorName,
    location: t.location,
    tripName: t.tripName,
    rating: t.rating,
    content: t.content,
    isActive: t.isActive,
    sortOrder: t.sortOrder,
  };
}

function companyIdOf(req: any): string | null {
  return req.user?.companyId ?? null;
}

router.get("/v1/testimonials", async (req, res): Promise<void> => {
  const companyId = companyIdOf(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db
    .select()
    .from(testimonialsTable)
    .where(eq(testimonialsTable.companyId, companyId))
    .orderBy(asc(testimonialsTable.sortOrder), desc(testimonialsTable.createdAt));
  res.json(ListTestimonialsResponse.parse(rows.map(mapTestimonial)));
});

router.post("/v1/testimonials", async (req, res): Promise<void> => {
  const companyId = companyIdOf(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = CreateTestimonialBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [created] = await db
    .insert(testimonialsTable)
    .values({ ...parsed.data, companyId })
    .returning();
  res.status(201).json(CreateTestimonialResponse.parse(mapTestimonial(created)));
});

router.put("/v1/testimonials/:id", async (req, res): Promise<void> => {
  const companyId = companyIdOf(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = UpdateTestimonialBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [updated] = await db
    .update(testimonialsTable)
    .set(parsed.data)
    .where(and(eq(testimonialsTable.id, req.params.id), eq(testimonialsTable.companyId, companyId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Testimonial not found" }); return; }
  res.json(UpdateTestimonialResponse.parse(mapTestimonial(updated)));
});

router.delete("/v1/testimonials/:id", async (req, res): Promise<void> => {
  const companyId = companyIdOf(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [deleted] = await db
    .delete(testimonialsTable)
    .where(and(eq(testimonialsTable.id, req.params.id), eq(testimonialsTable.companyId, companyId)))
    .returning();
  if (!deleted) { res.status(404).json({ error: "Testimonial not found" }); return; }
  res.status(204).send();
});

router.get("/v1/public/testimonials", async (req, res): Promise<void> => {
  const companyId = req.query.companyId as string | undefined;
  const domain = req.query.domain as string | undefined;
  let resolvedCompanyId = companyId;
  if (!resolvedCompanyId && domain) {
    resolvedCompanyId = (await resolveCompanyIdByDomain(domain)) ?? undefined;
  }
  if (!resolvedCompanyId) {
    const [firstCompany] = await db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .orderBy(asc(companiesTable.id))
      .limit(1);
    resolvedCompanyId = firstCompany?.id;
  }
  if (!resolvedCompanyId) { res.json([]); return; }
  const rows = await db
    .select()
    .from(testimonialsTable)
    .where(and(eq(testimonialsTable.companyId, resolvedCompanyId), eq(testimonialsTable.isActive, true)))
    .orderBy(asc(testimonialsTable.sortOrder), desc(testimonialsTable.createdAt));
  res.json(GetPublicTestimonialsResponse.parse(rows.map(mapTestimonial)));
});

export default router;
