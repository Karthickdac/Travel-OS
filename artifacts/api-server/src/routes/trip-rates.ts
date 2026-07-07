import { Router, type IRouter } from "express";
import { eq, and, asc } from "drizzle-orm";
import { db, tripRatesTable, tripEstimatorSettingsTable, companiesTable } from "@workspace/db";
import {
  ListTripRatesResponse,
  CreateTripRateBody,
  CreateTripRateResponse,
  UpdateTripRateParams,
  UpdateTripRateBody,
  UpdateTripRateResponse,
  DeleteTripRateParams,
  GetTripEstimatorSettingsResponse,
  UpdateTripEstimatorSettingsBody,
  UpdateTripEstimatorSettingsResponse,
  GetPublicTripRatesQueryParams,
  GetPublicTripRatesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const ADMIN_ROLES = new Set(["master_admin", "company_admin", "company_staff"]);

function getCompanyId(req: any): string | null {
  if (!req.user || !ADMIN_ROLES.has(req.user.role)) return null;
  return req.user.companyId ?? null;
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
    return stored === normalized || stored === `www.${normalized}` || `www.${stored}` === normalized;
  });
  return match?.id ?? null;
}

function mapRate(r: typeof tripRatesTable.$inferSelect) {
  return {
    id: r.id,
    vehicleType: r.vehicleType,
    vehicleExamples: r.vehicleExamples ?? null,
    seats: r.seats ?? null,
    imageUrl: r.imageUrl ?? null,
    ratePerKm: Number(r.ratePerKm),
    minKmPerDay: Number(r.minKmPerDay),
    dayRate: Number(r.dayRate),
    kmIncludedPerDay: Number(r.kmIncludedPerDay),
    extraKmRate: Number(r.extraKmRate),
    driverBataPerDay: Number(r.driverBataPerDay),
    nightHaltCharge: Number(r.nightHaltCharge),
    notes: r.notes ?? null,
    isActive: r.isActive,
    sortOrder: Number(r.sortOrder),
  };
}

function mapSettings(s: typeof tripEstimatorSettingsTable.$inferSelect | undefined) {
  if (!s) {
    return { enabled: true, gstPercent: 0, tollNote: null, termsNote: null };
  }
  return {
    enabled: s.enabled,
    gstPercent: Number(s.gstPercent),
    tollNote: s.tollNote ?? null,
    termsNote: s.termsNote ?? null,
  };
}

// IMPORTANT: /v1/trip-rates/settings routes are registered BEFORE
// /v1/trip-rates/:id so "settings" isn't captured as :id.

router.get("/v1/trip-rates/settings", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [settings] = await db.select().from(tripEstimatorSettingsTable).where(eq(tripEstimatorSettingsTable.companyId, companyId));
  res.json(GetTripEstimatorSettingsResponse.parse(mapSettings(settings)));
});

router.put("/v1/trip-rates/settings", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = UpdateTripEstimatorSettingsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const values: Record<string, unknown> = { companyId };
  if (parsed.data.enabled !== undefined) values.enabled = parsed.data.enabled;
  if (parsed.data.gstPercent !== undefined) values.gstPercent = String(parsed.data.gstPercent);
  if (parsed.data.tollNote !== undefined) values.tollNote = parsed.data.tollNote;
  if (parsed.data.termsNote !== undefined) values.termsNote = parsed.data.termsNote;
  const setData = { ...values };
  delete (setData as any).companyId;
  const [row] = await db
    .insert(tripEstimatorSettingsTable)
    .values(values as typeof tripEstimatorSettingsTable.$inferInsert)
    .onConflictDoUpdate({ target: tripEstimatorSettingsTable.companyId, set: setData })
    .returning();
  res.json(UpdateTripEstimatorSettingsResponse.parse(mapSettings(row)));
});

router.get("/v1/trip-rates", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rates = await db
    .select()
    .from(tripRatesTable)
    .where(eq(tripRatesTable.companyId, companyId))
    .orderBy(asc(tripRatesTable.sortOrder), asc(tripRatesTable.vehicleType));
  res.json(ListTripRatesResponse.parse(rates.map(mapRate)));
});

router.post("/v1/trip-rates", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = CreateTripRateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const d = parsed.data;
  const [rate] = await db
    .insert(tripRatesTable)
    .values({
      companyId,
      vehicleType: d.vehicleType,
      vehicleExamples: d.vehicleExamples,
      seats: d.seats,
      imageUrl: d.imageUrl,
      ratePerKm: d.ratePerKm !== undefined ? String(d.ratePerKm) : undefined,
      minKmPerDay: d.minKmPerDay,
      dayRate: d.dayRate !== undefined ? String(d.dayRate) : undefined,
      kmIncludedPerDay: d.kmIncludedPerDay,
      extraKmRate: d.extraKmRate !== undefined ? String(d.extraKmRate) : undefined,
      driverBataPerDay: d.driverBataPerDay !== undefined ? String(d.driverBataPerDay) : undefined,
      nightHaltCharge: d.nightHaltCharge !== undefined ? String(d.nightHaltCharge) : undefined,
      notes: d.notes,
      isActive: d.isActive,
      sortOrder: d.sortOrder,
    })
    .returning();
  res.status(201).json(CreateTripRateResponse.parse(mapRate(rate)));
});

router.put("/v1/trip-rates/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const params = UpdateTripRateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateTripRateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [existing] = await db
    .select()
    .from(tripRatesTable)
    .where(and(eq(tripRatesTable.id, params.data.id), eq(tripRatesTable.companyId, companyId)));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const d = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (d.vehicleType !== undefined) updateData.vehicleType = d.vehicleType;
  if (d.vehicleExamples !== undefined) updateData.vehicleExamples = d.vehicleExamples;
  if (d.seats !== undefined) updateData.seats = d.seats;
  if (d.imageUrl !== undefined) updateData.imageUrl = d.imageUrl;
  if (d.ratePerKm !== undefined) updateData.ratePerKm = String(d.ratePerKm);
  if (d.minKmPerDay !== undefined) updateData.minKmPerDay = d.minKmPerDay;
  if (d.dayRate !== undefined) updateData.dayRate = String(d.dayRate);
  if (d.kmIncludedPerDay !== undefined) updateData.kmIncludedPerDay = d.kmIncludedPerDay;
  if (d.extraKmRate !== undefined) updateData.extraKmRate = String(d.extraKmRate);
  if (d.driverBataPerDay !== undefined) updateData.driverBataPerDay = String(d.driverBataPerDay);
  if (d.nightHaltCharge !== undefined) updateData.nightHaltCharge = String(d.nightHaltCharge);
  if (d.notes !== undefined) updateData.notes = d.notes;
  if (d.isActive !== undefined) updateData.isActive = d.isActive;
  if (d.sortOrder !== undefined) updateData.sortOrder = d.sortOrder;
  const [updated] = await db
    .update(tripRatesTable)
    .set(updateData)
    .where(and(eq(tripRatesTable.id, params.data.id), eq(tripRatesTable.companyId, companyId)))
    .returning();
  res.json(UpdateTripRateResponse.parse(mapRate(updated)));
});

router.delete("/v1/trip-rates/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const params = DeleteTripRateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [existing] = await db
    .select()
    .from(tripRatesTable)
    .where(and(eq(tripRatesTable.id, params.data.id), eq(tripRatesTable.companyId, companyId)));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  await db.delete(tripRatesTable).where(and(eq(tripRatesTable.id, params.data.id), eq(tripRatesTable.companyId, companyId)));
  res.status(204).send();
});

router.get("/v1/public/trip-rates", async (req, res): Promise<void> => {
  const params = GetPublicTripRatesQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { companyId, domain } = params.data;

  let resolvedCompanyId = companyId;
  let domainProvided = false;
  if (!resolvedCompanyId && domain) {
    const resolved = await resolveCompanyIdByDomain(domain);
    if (resolved) {
      resolvedCompanyId = resolved;
    } else if (normalizeHost(domain) && normalizeHost(domain) !== "localhost" && !normalizeHost(domain).endsWith(".replit.dev") && !normalizeHost(domain).endsWith(".replit.app")) {
      // A real custom domain was provided but doesn't match any tenant —
      // never fall back to another tenant's data.
      res.status(404).json({ error: "Site not found" });
      return;
    }
    domainProvided = true;
  }

  let company: typeof companiesTable.$inferSelect | undefined;
  if (resolvedCompanyId) {
    [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, resolvedCompanyId));
    if (!company) { res.status(404).json({ error: "Site not found" }); return; }
  } else if (!companyId && (domainProvided || !domain)) {
    // Dev/preview host (localhost / replit) or no identifier — default to first company.
    [company] = await db.select().from(companiesTable).orderBy(asc(companiesTable.id)).limit(1);
  }
  if (!company) { res.status(404).json({ error: "No company found" }); return; }

  const [settings] = await db.select().from(tripEstimatorSettingsTable).where(eq(tripEstimatorSettingsTable.companyId, company.id));
  const rates = await db
    .select()
    .from(tripRatesTable)
    .where(and(eq(tripRatesTable.companyId, company.id), eq(tripRatesTable.isActive, true)))
    .orderBy(asc(tripRatesTable.sortOrder), asc(tripRatesTable.vehicleType));

  res.json(GetPublicTripRatesResponse.parse({
    companyName: company.name,
    settings: mapSettings(settings),
    rates: rates.map(mapRate),
  }));
});

export default router;
