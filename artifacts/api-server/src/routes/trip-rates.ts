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
  SearchPlacesQueryParams,
  SearchPlacesResponse,
  GetRouteDistanceQueryParams,
  GetRouteDistanceResponse,
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
    nonAcRatePerKm: Number(r.nonAcRatePerKm),
    nonAcDayRate: Number(r.nonAcDayRate),
    nonAcExtraKmRate: Number(r.nonAcExtraKmRate),
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
      nonAcRatePerKm: d.nonAcRatePerKm !== undefined ? String(d.nonAcRatePerKm) : undefined,
      nonAcDayRate: d.nonAcDayRate !== undefined ? String(d.nonAcDayRate) : undefined,
      nonAcExtraKmRate: d.nonAcExtraKmRate !== undefined ? String(d.nonAcExtraKmRate) : undefined,
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
  if (d.nonAcRatePerKm !== undefined) updateData.nonAcRatePerKm = String(d.nonAcRatePerKm);
  if (d.nonAcDayRate !== undefined) updateData.nonAcDayRate = String(d.nonAcDayRate);
  if (d.nonAcExtraKmRate !== undefined) updateData.nonAcExtraKmRate = String(d.nonAcExtraKmRate);
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

// ---------- public place search + route distance (for the estimator map) ----------

type CacheEntry<T> = { value: T; expires: number };
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

// Bounded TTL cache: expired entries are dropped on access, and when the map is
// full the oldest-inserted entries are evicted (Map preserves insertion order).
function cacheGet<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expires <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function cacheSet<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (v.expires <= now) cache.delete(k);
    }
    while (cache.size >= CACHE_MAX_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
  }
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

const placeCache = new Map<string, CacheEntry<{ label: string; lat: number; lng: number }[]>>();
const routeCache = new Map<string, CacheEntry<{ distanceKm: number; durationMinutes: number | null; geometry: [number, number][] | null }>>();

const RATE_LIMIT_MAX_IPS = 5000;
const searchHits = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string, max: number): boolean {
  const now = Date.now();
  const entry = searchHits.get(ip);
  if (!entry || entry.resetAt < now) {
    if (searchHits.size >= RATE_LIMIT_MAX_IPS) {
      for (const [k, v] of searchHits) {
        if (v.resetAt < now) searchHits.delete(k);
      }
      while (searchHits.size >= RATE_LIMIT_MAX_IPS) {
        const oldest = searchHits.keys().next().value;
        if (oldest === undefined) break;
        searchHits.delete(oldest);
      }
    }
    searchHits.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

router.get("/v1/public/place-search", async (req, res): Promise<void> => {
  const params = SearchPlacesQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const q = params.data.q.trim();
  if (q.length < 2) { res.json(SearchPlacesResponse.parse({ places: [] })); return; }
  if (rateLimited(req.ip ?? "unknown", 30)) { res.status(429).json({ error: "Too many requests" }); return; }

  const cacheKey = q.toLowerCase();
  const cached = cacheGet(placeCache, cacheKey);
  if (cached) {
    res.json(SearchPlacesResponse.parse({ places: cached }));
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=15&lang=en&lat=22&lon=79&location_bias_scale=0.6`;
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) { res.json(SearchPlacesResponse.parse({ places: [] })); return; }
    const data = (await resp.json()) as {
      features?: Array<{ properties?: Record<string, unknown>; geometry?: { coordinates?: number[] } }>;
    };
    const seen = new Set<string>();
    const places: { label: string; lat: number; lng: number }[] = [];
    for (const f of data.features ?? []) {
      const p = f.properties ?? {};
      const coords = f.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;
      const name = typeof p.name === "string" ? p.name : "";
      if (!name) continue;
      const label = [
        name,
        typeof p.state === "string" ? p.state : "",
        typeof p.country === "string" ? p.country : "",
      ].filter(Boolean).join(", ");
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      places.push({ label, lat: coords[1], lng: coords[0] });
      if (places.length >= 8) break;
    }
    cacheSet(placeCache, cacheKey, places);
    res.json(SearchPlacesResponse.parse({ places }));
  } catch (err) {
    req.log.warn({ err }, "place search failed");
    res.json(SearchPlacesResponse.parse({ places: [] }));
  } finally {
    clearTimeout(timer);
  }
});

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get("/v1/public/route-distance", async (req, res): Promise<void> => {
  const params = GetRouteDistanceQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { fromLat, fromLng, toLat, toLng } = params.data;
  if (
    Math.abs(fromLat) > 90 || Math.abs(toLat) > 90 ||
    Math.abs(fromLng) > 180 || Math.abs(toLng) > 180
  ) {
    res.status(400).json({ error: "Invalid coordinates" });
    return;
  }
  if (rateLimited(req.ip ?? "unknown", 30)) { res.status(429).json({ error: "Too many requests" }); return; }

  const cacheKey = [fromLat, fromLng, toLat, toLng].map((n) => n.toFixed(4)).join(",");
  const cached = cacheGet(routeCache, cacheKey);
  if (cached) {
    res.json(GetRouteDistanceResponse.parse(cached));
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=simplified&geometries=geojson`;
    const resp = await fetch(url, { signal: controller.signal });
    if (resp.ok) {
      const data = (await resp.json()) as {
        routes?: Array<{ distance?: number; duration?: number; geometry?: { coordinates?: [number, number][] } }>;
      };
      const route = data.routes?.[0];
      if (route?.distance !== undefined) {
        const value = {
          distanceKm: Math.round(route.distance / 100) / 10,
          durationMinutes: route.duration !== undefined ? Math.round(route.duration / 60) : null,
          geometry: route.geometry?.coordinates
            ? route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
            : null,
        };
        cacheSet(routeCache, cacheKey, value);
        res.json(GetRouteDistanceResponse.parse(value));
        return;
      }
    }
    // OSRM unavailable — estimate from straight-line distance with a road factor.
    const fallback = {
      distanceKm: Math.round(haversineKm(fromLat, fromLng, toLat, toLng) * 1.3 * 10) / 10,
      durationMinutes: null,
      geometry: null,
    };
    res.json(GetRouteDistanceResponse.parse(fallback));
  } catch (err) {
    req.log.warn({ err }, "route distance lookup failed, using haversine fallback");
    const fallback = {
      distanceKm: Math.round(haversineKm(fromLat, fromLng, toLat, toLng) * 1.3 * 10) / 10,
      durationMinutes: null,
      geometry: null,
    };
    res.json(GetRouteDistanceResponse.parse(fallback));
  } finally {
    clearTimeout(timer);
  }
});

export default router;
