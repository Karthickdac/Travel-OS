import { Router } from "express";
import { db } from "@workspace/db";
import { vendorVehiclesTable, vendorSettlementsTable, vendorsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// ── VENDOR VEHICLES ────────────────────────────────────────────────────────

router.get("/v1/vendors/:id/vehicles", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(vendorVehiclesTable)
    .where(and(eq(vendorVehiclesTable.companyId, companyId), eq(vendorVehiclesTable.vendorId, req.params.id), eq(vendorVehiclesTable.isDeleted, false)));
  res.json(rows);
});

router.post("/v1/vendors/:id/vehicles", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { vehicleMake, vehicleModel, vehicleNumber, category, seatingCapacity, ratePerKm, ratePerDay } = req.body;
  const [row] = await db.insert(vendorVehiclesTable)
    .values({ companyId, vendorId: req.params.id, vehicleMake, vehicleModel, vehicleNumber, category: category || "sedan", seatingCapacity: seatingCapacity || 4, ratePerKm: ratePerKm ? String(ratePerKm) : undefined, ratePerDay: ratePerDay ? String(ratePerDay) : undefined })
    .returning();
  res.status(201).json(row);
});

router.patch("/v1/vendors/vehicles/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const updates: any = {};
  const fields = ["vehicleMake","vehicleModel","vehicleNumber","category","seatingCapacity","ratePerKm","ratePerDay","isActive"];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      if (["ratePerKm","ratePerDay"].includes(f)) updates[f] = req.body[f] !== null ? String(req.body[f]) : null;
      else updates[f] = req.body[f];
    }
  }
  const [row] = await db.update(vendorVehiclesTable).set(updates)
    .where(and(eq(vendorVehiclesTable.id, req.params.id), eq(vendorVehiclesTable.companyId, companyId)))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/v1/vendors/vehicles/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.update(vendorVehiclesTable).set({ isDeleted: true })
    .where(and(eq(vendorVehiclesTable.id, req.params.id), eq(vendorVehiclesTable.companyId, companyId)));
  res.status(204).send();
});

// ── VENDOR SETTLEMENTS ─────────────────────────────────────────────────────

router.get("/v1/vendors/:id/settlements", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(vendorSettlementsTable)
    .where(and(eq(vendorSettlementsTable.companyId, companyId), eq(vendorSettlementsTable.vendorId, req.params.id)))
    .orderBy(desc(vendorSettlementsTable.month));
  res.json(rows);
});

router.post("/v1/vendors/:id/settlements", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { month, totalTrips, grossAmount, commissionAmount, netPayable, notes } = req.body;
  const [row] = await db.insert(vendorSettlementsTable)
    .values({ companyId, vendorId: req.params.id, month, totalTrips: totalTrips || 0, grossAmount: String(grossAmount || 0), commissionAmount: String(commissionAmount || 0), netPayable: String(netPayable || 0), notes })
    .returning();
  res.status(201).json(row);
});

router.patch("/v1/vendors/settlements/:id/pay", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [row] = await db.update(vendorSettlementsTable)
    .set({ status: "paid", paidAt: new Date(), notes: req.body.notes })
    .where(and(eq(vendorSettlementsTable.id, req.params.id), eq(vendorSettlementsTable.companyId, companyId)))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  // Update vendor pending settlement
  await db.update(vendorsTable).set({ pendingSettlement: "0" })
    .where(and(eq(vendorsTable.id, row.vendorId), eq(vendorsTable.companyId, companyId)));
  res.json(row);
});

// All settlements for company
router.get("/v1/vendors/settlements", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select({
    settlement: vendorSettlementsTable,
    vendorName: vendorsTable.name,
  }).from(vendorSettlementsTable)
    .leftJoin(vendorsTable, eq(vendorSettlementsTable.vendorId, vendorsTable.id))
    .where(eq(vendorSettlementsTable.companyId, companyId))
    .orderBy(desc(vendorSettlementsTable.month));
  res.json(rows);
});

export default router;
