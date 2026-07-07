import { Router, type IRouter } from "express";
import { eq, and, asc } from "drizzle-orm";
import { db, destinationsTable, tourPackagesTable, leadsTable, companiesTable, quotationsTable } from "@workspace/db";
import { createNotification } from "../lib/notify";
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
  GetPublicDestinationsResponse,
  SubmitEnquiryBody,
  SubmitEnquiryResponse,
  GetPublicQuotationParams,
  GetPublicQuotationResponse,
  RespondPublicQuotationParams,
  RespondPublicQuotationBody,
  RespondPublicQuotationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getCompanyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

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

router.get("/v1/tours/destinations", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const destinations = await db
    .select()
    .from(destinationsTable)
    .where(eq(destinationsTable.companyId, companyId));
  res.json(ListDestinationsResponse.parse(destinations.map(mapDestination)));
});

router.post("/v1/tours/destinations", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateDestinationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [destination] = await db
    .insert(destinationsTable)
    .values({
      companyId,
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
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const packages = await db
    .select()
    .from(tourPackagesTable)
    .where(eq(tourPackagesTable.companyId, companyId));
  res.json(ListTourPackagesResponse.parse(packages.map(mapPackage)));
});

router.post("/v1/tours/packages", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateTourPackageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [pkg] = await db
    .insert(tourPackagesTable)
    .values({
      companyId,
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
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = GetTourPackageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [pkg] = await db
    .select()
    .from(tourPackagesTable)
    .where(and(eq(tourPackagesTable.id, params.data.id), eq(tourPackagesTable.companyId, companyId)));
  if (!pkg) {
    res.status(404).json({ error: "Tour package not found" });
    return;
  }

  res.json(GetTourPackageResponse.parse(mapPackage(pkg)));
});

router.patch("/v1/tours/packages/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
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
    .where(and(eq(tourPackagesTable.id, params.data.id), eq(tourPackagesTable.companyId, companyId)))
    .returning();

  if (!pkg) {
    res.status(404).json({ error: "Tour package not found" });
    return;
  }

  res.json(UpdateTourPackageResponse.parse(mapPackage(pkg)));
});

router.delete("/v1/tours/packages/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = DeleteTourPackageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(tourPackagesTable)
    .where(and(eq(tourPackagesTable.id, params.data.id), eq(tourPackagesTable.companyId, companyId)));
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
  // Deterministic single-tenant fallback (e.g. preview host that matches no
  // custom domain) so the public catalog never mixes packages across tenants.
  if (!resolvedCompanyId) {
    const [firstCompany] = await db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .orderBy(asc(companiesTable.id))
      .limit(1);
    resolvedCompanyId = firstCompany?.id;
  }
  const whereClause = resolvedCompanyId
    ? and(eq(tourPackagesTable.isActive, true), eq(tourPackagesTable.companyId, resolvedCompanyId))
    : eq(tourPackagesTable.isActive, true);
  const packages = await db.select().from(tourPackagesTable).where(whereClause);
  res.json(GetPublicPackagesResponse.parse(packages.map(mapPackage)));
});

router.get("/v1/public/destinations", async (req, res): Promise<void> => {
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
  const whereClause = resolvedCompanyId
    ? eq(destinationsTable.companyId, resolvedCompanyId)
    : undefined;
  const rows = await db
    .select()
    .from(destinationsTable)
    .where(whereClause)
    .orderBy(asc(destinationsTable.name));
  res.json(GetPublicDestinationsResponse.parse(rows.map(mapDestination)));
});

router.post("/v1/public/enquiry", async (req, res): Promise<void> => {
  const parsed = SubmitEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let resolvedCompanyId = parsed.data.companyId;
  if (!resolvedCompanyId) {
    const [firstCompany] = await db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .orderBy(asc(companiesTable.id))
      .limit(1);
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

  await createNotification(lead.companyId, {
    type: "lead.created",
    title: "New Lead",
    message: `${lead.name} enquired about ${lead.destination || "a trip"} (${lead.phone})`,
    entityType: "lead",
    entityId: lead.id,
  });

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

// Public city autocomplete proxy. Uses the OpenStreetMap-based Photon geocoder
// (no API key required) so the public enquiry form can suggest any city.
// Fails soft (returns an empty list) so the client can fall back to its static list.
const PLACE_VALUES = new Set([
  "city",
  "town",
  "village",
  "municipality",
  "suburb",
  "locality",
  "hamlet",
]);

// Small in-memory cache (1h) so repeated lookups avoid hitting the upstream geocoder.
const geocodeCache = new Map<string, { suggestions: string[]; expires: number }>();
const GEOCODE_TTL_MS = 60 * 60 * 1000;

// Naive per-IP rate limit: max 30 requests / 10s window.
const geocodeHits = new Map<string, { count: number; resetAt: number }>();
const GEOCODE_WINDOW_MS = 10 * 1000;
const GEOCODE_MAX = 30;

function geocodeRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = geocodeHits.get(ip);
  if (!entry || now > entry.resetAt) {
    geocodeHits.set(ip, { count: 1, resetAt: now + GEOCODE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > GEOCODE_MAX;
}

router.get("/v1/public/geocode", async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 2) {
    res.json({ suggestions: [] });
    return;
  }

  if (geocodeRateLimited(req.ip ?? "unknown")) {
    res.status(429).json({ suggestions: [] });
    return;
  }

  const cacheKey = q.toLowerCase();
  const cached = geocodeCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    res.json({ suggestions: cached.suggestions });
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    // lat/lon + bias scale prioritise Indian results while still allowing global cities.
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=15&lang=en&lat=22&lon=79&location_bias_scale=0.6`;
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) {
      res.json({ suggestions: [] });
      return;
    }
    const data = (await resp.json()) as {
      features?: Array<{ properties?: Record<string, unknown> }>;
    };

    const seen = new Set<string>();
    const suggestions: string[] = [];
    for (const f of data.features ?? []) {
      const p = f.properties ?? {};
      if (p.osm_key !== "place") continue;
      if (typeof p.osm_value === "string" && !PLACE_VALUES.has(p.osm_value)) continue;
      const name = typeof p.name === "string" ? p.name : "";
      if (!name) continue;
      const label = [
        name,
        typeof p.state === "string" ? p.state : "",
        typeof p.country === "string" ? p.country : "",
      ]
        .filter(Boolean)
        .join(", ");
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push(label);
      if (suggestions.length >= 8) break;
    }
    geocodeCache.set(cacheKey, { suggestions, expires: Date.now() + GEOCODE_TTL_MS });
    res.json({ suggestions });
  } catch (err) {
    req.log.warn({ err }, "geocode lookup failed");
    res.json({ suggestions: [] });
  } finally {
    clearTimeout(timer);
  }
});

// Public quotation view/respond (NO auth)
function mapPublicQuotation(
  q: typeof quotationsTable.$inferSelect,
  company: { name: string; phone: string | null; logo: string | null } | null,
) {
  return {
    quotationNumber: q.quotationNumber,
    customerName: q.customerName,
    companyName: company?.name ?? "",
    companyPhone: company?.phone ?? null,
    companyLogo: company?.logo ?? null,
    status: q.status,
    totalAmount: Number(q.totalAmount),
    taxAmount: Number(q.taxAmount),
    validUntil: q.validUntil,
    items: (q.items as Array<{ description: string; quantity: number; unitPrice: number; total: number }>) || [],
    notes: q.notes ?? null,
  };
}

router.get("/v1/public/quotations/:token", async (req, res): Promise<void> => {
  const params = GetPublicQuotationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [quotation] = await db
    .select()
    .from(quotationsTable)
    .where(eq(quotationsTable.publicToken, params.data.token));
  if (!quotation || quotation.isDeleted) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  let company: { name: string; phone: string | null; logo: string | null } | null = null;
  if (quotation.companyId) {
    const [c] = await db
      .select({ name: companiesTable.name, phone: companiesTable.phone, logo: companiesTable.logo })
      .from(companiesTable)
      .where(eq(companiesTable.id, quotation.companyId));
    company = c ?? null;
  }

  res.json(GetPublicQuotationResponse.parse(mapPublicQuotation(quotation, company)));
});

router.post("/v1/public/quotations/:token/respond", async (req, res): Promise<void> => {
  const params = RespondPublicQuotationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = RespondPublicQuotationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [quotation] = await db
    .select()
    .from(quotationsTable)
    .where(eq(quotationsTable.publicToken, params.data.token));
  if (!quotation || quotation.isDeleted) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  if (quotation.status === "converted" || quotation.respondedAt) {
    res.status(400).json({ error: "Quotation has already been responded to" });
    return;
  }

  if (quotation.status !== "sent") {
    res.status(400).json({ error: "Quotation is not open for response" });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  if (quotation.validUntil < today) {
    res.status(400).json({ error: "Quotation has expired" });
    return;
  }

  const [updated] = await db
    .update(quotationsTable)
    .set({ status: parsed.data.action, respondedAt: new Date() })
    .where(eq(quotationsTable.id, quotation.id))
    .returning();

  let company: { name: string; phone: string | null; logo: string | null } | null = null;
  if (updated.companyId) {
    const [c] = await db
      .select({ name: companiesTable.name, phone: companiesTable.phone, logo: companiesTable.logo })
      .from(companiesTable)
      .where(eq(companiesTable.id, updated.companyId));
    company = c ?? null;
  }

  await createNotification(updated.companyId, {
    type: parsed.data.action === "approved" ? "quotation.approved" : "quotation.rejected",
    title: parsed.data.action === "approved" ? "Quotation Approved" : "Quotation Rejected",
    message: `Quotation ${updated.quotationNumber} was ${parsed.data.action} by ${updated.customerName}`,
    entityType: "quotation",
    entityId: updated.id,
  });

  res.json(RespondPublicQuotationResponse.parse(mapPublicQuotation(updated, company)));
});

export default router;
