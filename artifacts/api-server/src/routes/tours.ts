import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, destinationsTable, tourPackagesTable, leadsTable, companiesTable } from "@workspace/db";
import {
  ListDestinationsResponse,
  CreateDestinationBody,
  CreateDestinationResponse,
  ListTourPackagesQueryParams,
  ListTourPackagesResponse,
  CreateTourPackageBody,
  CreateTourPackageResponse,
  GetTourPackageParams,
  GetTourPackageResponse,
  UpdateTourPackageParams,
  UpdateTourPackageBody,
  UpdateTourPackageResponse,
  DeleteTourPackageParams,
  GetPublicPackagesResponse,
  SubmitEnquiryBody,
  SubmitEnquiryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

let leadCounter = 500;

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
    return stored === normalized || stored === `www.${normalized}` || `www.${stored}` === normalized;
  });
  return match?.id ?? null;
}

function mapDestination(d: typeof destinationsTable.$inferSelect) {
  return {
    id: d.id,
    name: d.name,
    state: d.state ?? null,
    country: d.country,
    description: d.description ?? null,
    imageUrl: d.imageUrl ?? null,
    tags: d.tags ?? [],
    totalPackages: d.totalPackages,
  };
}

function mapPackage(p: typeof tourPackagesTable.$inferSelect) {
  return {
    id: p.id,
    title: p.title,
    description: p.description ?? null,
    duration: p.duration,
    price: Number(p.price),
    originalPrice: p.originalPrice !== null ? Number(p.originalPrice) : null,
    destinationId: p.destinationId ?? "",
    destinationName: p.destinationName ?? null,
    imageUrl: p.imageUrl ?? null,
    inclusions: p.inclusions ?? [],
    exclusions: p.exclusions ?? [],
    highlights: p.highlights ?? [],
    rating: p.rating !== null ? Number(p.rating) : null,
    totalBookings: p.totalBookings,
    isActive: p.isActive,
    packageType: p.packageType,
  };
}

router.get("/v1/tours/destinations", async (_req, res): Promise<void> => {
  const destinations = await db.select().from(destinationsTable);
  res.json(ListDestinationsResponse.parse(destinations.map(mapDestination)));
});

router.post("/v1/tours/destinations", async (req, res): Promise<void> => {
  const parsed = CreateDestinationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [destination] = await db
    .insert(destinationsTable)
    .values({
      name: parsed.data.name,
      state: parsed.data.state,
      country: parsed.data.country,
      description: parsed.data.description,
      tags: parsed.data.tags ?? [],
    })
    .returning();

  res.status(201).json(CreateDestinationResponse.parse(mapDestination(destination)));
});

router.get("/v1/tours/packages", async (req, res): Promise<void> => {
  const packages = await db.select().from(tourPackagesTable);
  res.json(ListTourPackagesResponse.parse(packages.map(mapPackage)));
});

router.post("/v1/tours/packages", async (req, res): Promise<void> => {
  const parsed = CreateTourPackageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [pkg] = await db
    .insert(tourPackagesTable)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      duration: parsed.data.duration,
      price: String(parsed.data.price),
      originalPrice: parsed.data.originalPrice !== undefined ? String(parsed.data.originalPrice) : null,
      destinationId: parsed.data.destinationId,
      packageType: parsed.data.packageType,
      inclusions: parsed.data.inclusions ?? [],
      exclusions: parsed.data.exclusions ?? [],
      highlights: parsed.data.highlights ?? [],
    })
    .returning();

  res.status(201).json(CreateTourPackageResponse.parse(mapPackage(pkg)));
});

router.get("/v1/tours/packages/:id", async (req, res): Promise<void> => {
  const params = GetTourPackageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [pkg] = await db.select().from(tourPackagesTable).where(eq(tourPackagesTable.id, params.data.id));
  if (!pkg) {
    res.status(404).json({ error: "Tour package not found" });
    return;
  }

  res.json(GetTourPackageResponse.parse(mapPackage(pkg)));
});

router.patch("/v1/tours/packages/:id", async (req, res): Promise<void> => {
  const params = UpdateTourPackageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTourPackageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.price !== undefined) updateData.price = String(parsed.data.price);
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;

  const [pkg] = await db
    .update(tourPackagesTable)
    .set(updateData)
    .where(eq(tourPackagesTable.id, params.data.id))
    .returning();

  if (!pkg) {
    res.status(404).json({ error: "Tour package not found" });
    return;
  }

  res.json(UpdateTourPackageResponse.parse(mapPackage(pkg)));
});

router.delete("/v1/tours/packages/:id", async (req, res): Promise<void> => {
  const params = DeleteTourPackageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(tourPackagesTable).where(eq(tourPackagesTable.id, params.data.id));
  res.sendStatus(204);
});

// Public endpoints
router.get("/v1/public/packages", async (req, res): Promise<void> => {
  const companyId = req.query.companyId as string | undefined;
  const domain = req.query.domain as string | undefined;
  let resolvedCompanyId = companyId;
  if (!resolvedCompanyId && domain) {
    resolvedCompanyId = (await resolveCompanyIdByDomain(domain)) ?? undefined;
  }
  const whereClause = resolvedCompanyId
    ? and(eq(tourPackagesTable.isActive, true), eq(tourPackagesTable.companyId, resolvedCompanyId))
    : eq(tourPackagesTable.isActive, true);
  const packages = await db.select().from(tourPackagesTable).where(whereClause);
  res.json(GetPublicPackagesResponse.parse(packages.map(mapPackage)));
});

router.post("/v1/public/enquiry", async (req, res): Promise<void> => {
  const parsed = SubmitEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let resolvedCompanyId = parsed.data.companyId;
  if (!resolvedCompanyId) {
    const [firstCompany] = await db.select({ id: companiesTable.id }).from(companiesTable).limit(1);
    resolvedCompanyId = firstCompany?.id;
  }

  leadCounter++;
  const [lead] = await db
    .insert(leadsTable)
    .values({
      companyId: resolvedCompanyId ?? null,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      source: "website",
      destination: parsed.data.destination,
      travelDate: parsed.data.travelDate,
      pax: parsed.data.pax,
      budget: parsed.data.budget !== undefined ? String(parsed.data.budget) : null,
      notes: parsed.data.message,
      status: "new",
    })
    .returning();

  const mapped = {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email ?? null,
    source: lead.source,
    status: lead.status,
    assignedTo: null,
    travelDate: lead.travelDate ?? null,
    destination: lead.destination ?? null,
    pax: lead.pax ?? null,
    budget: lead.budget !== null ? Number(lead.budget) : null,
    notes: lead.notes ?? null,
    followUpDate: null,
    createdAt: lead.createdAt.toISOString(),
  };

  res.status(201).json(SubmitEnquiryResponse.parse(mapped));
});

export default router;
