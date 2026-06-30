import { Router } from "express";
import { db } from "@workspace/db";
import { tourItineraryTable, tourAvailabilityTable } from "@workspace/db";
import { eq, and, desc, asc } from "drizzle-orm";

const router = Router();

// ── ITINERARY ──────────────────────────────────────────────────────────────

router.get("/v1/tours/packages/:id/itinerary", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(tourItineraryTable)
    .where(and(eq(tourItineraryTable.companyId, companyId), eq(tourItineraryTable.packageId, req.params.id)))
    .orderBy(asc(tourItineraryTable.dayNumber));
  res.json(rows);
});

router.post("/v1/tours/packages/:id/itinerary", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { dayNumber, title, description, accommodation, meals, activities, transport } = req.body;
  const [row] = await db.insert(tourItineraryTable)
    .values({ companyId, packageId: req.params.id, dayNumber, title, description, accommodation, meals, activities, transport, sortOrder: dayNumber })
    .returning();
  res.status(201).json(row);
});

router.patch("/v1/tours/itinerary/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const updates: any = {};
  for (const f of ["dayNumber","title","description","accommodation","meals","activities","transport"]) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  const [row] = await db.update(tourItineraryTable).set(updates)
    .where(and(eq(tourItineraryTable.id, req.params.id), eq(tourItineraryTable.companyId, companyId)))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/v1/tours/itinerary/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(tourItineraryTable)
    .where(and(eq(tourItineraryTable.id, req.params.id), eq(tourItineraryTable.companyId, companyId)));
  res.status(204).send();
});

// ── AVAILABILITY ───────────────────────────────────────────────────────────

router.get("/v1/tours/packages/:id/availability", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(tourAvailabilityTable)
    .where(and(eq(tourAvailabilityTable.companyId, companyId), eq(tourAvailabilityTable.packageId, req.params.id)))
    .orderBy(asc(tourAvailabilityTable.date));
  res.json(rows);
});

router.post("/v1/tours/packages/:id/availability", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { date, availableSlots, priceOverride, isBlackout, notes } = req.body;
  const existing = await db.select().from(tourAvailabilityTable)
    .where(and(eq(tourAvailabilityTable.companyId, companyId), eq(tourAvailabilityTable.packageId, req.params.id), eq(tourAvailabilityTable.date, date)))
    .limit(1);
  if (existing.length > 0) {
    const [updated] = await db.update(tourAvailabilityTable)
      .set({ availableSlots: availableSlots || 0, priceOverride: priceOverride ? String(priceOverride) : null, isBlackout: isBlackout ?? false, notes })
      .where(eq(tourAvailabilityTable.id, existing[0].id))
      .returning();
    res.json(updated);
  }
  const [row] = await db.insert(tourAvailabilityTable)
    .values({ companyId, packageId: req.params.id, date, availableSlots: availableSlots || 0, priceOverride: priceOverride ? String(priceOverride) : undefined, isBlackout: isBlackout ?? false, notes })
    .returning();
  res.status(201).json(row);
});

router.delete("/v1/tours/availability/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(tourAvailabilityTable)
    .where(and(eq(tourAvailabilityTable.id, req.params.id), eq(tourAvailabilityTable.companyId, companyId)));
  res.status(204).send();
});

export default router;
