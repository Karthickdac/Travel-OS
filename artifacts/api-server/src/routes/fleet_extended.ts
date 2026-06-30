import { Router } from "express";
import { db } from "@workspace/db";
import { fuelLogsTable, accidentRecordsTable, vehicleAvailabilityTable, vehiclesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

function companyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

// ---- Fuel Logs ----
router.get("/v1/fleet/fuel", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select({
    log: fuelLogsTable,
    vehicleRegNo: vehiclesTable.registrationNumber,
    vehicleModel: vehiclesTable.model,
  }).from(fuelLogsTable)
    .leftJoin(vehiclesTable, eq(fuelLogsTable.vehicleId, vehiclesTable.id))
    .where(eq(fuelLogsTable.companyId, cid)).orderBy(desc(fuelLogsTable.date));
  res.json(rows);
});

router.post("/v1/fleet/fuel", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { vehicleId, date, litres, odometer, cost, station } = req.body;
  const [created] = await db.insert(fuelLogsTable).values({
    companyId: cid, vehicleId, date, litres, odometer: odometer || 0, cost, station,
  }).returning();
  res.status(201).json(created);
});

router.delete("/v1/fleet/fuel/:id", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(fuelLogsTable).where(and(eq(fuelLogsTable.id, req.params.id), eq(fuelLogsTable.companyId, cid)));
  res.status(204).end();
});

// ---- Accident Records ----
router.get("/v1/fleet/accidents", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select({
    record: accidentRecordsTable,
    vehicleRegNo: vehiclesTable.registrationNumber,
    vehicleModel: vehiclesTable.model,
  }).from(accidentRecordsTable)
    .leftJoin(vehiclesTable, eq(accidentRecordsTable.vehicleId, vehiclesTable.id))
    .where(eq(accidentRecordsTable.companyId, cid)).orderBy(desc(accidentRecordsTable.date));
  res.json(rows);
});

router.post("/v1/fleet/accidents", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { vehicleId, date, description, severity, cost, photoUrl, status } = req.body;
  const [created] = await db.insert(accidentRecordsTable).values({
    companyId: cid, vehicleId, date, description, severity: severity || "minor",
    cost: cost || "0", photoUrl, status: status || "open",
  }).returning();
  res.status(201).json(created);
});

router.patch("/v1/fleet/accidents/:id", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { status, cost } = req.body;
  const patch: any = {};
  if (status !== undefined) patch.status = status;
  if (cost !== undefined) patch.cost = cost;
  const [updated] = await db.update(accidentRecordsTable).set(patch)
    .where(and(eq(accidentRecordsTable.id, req.params.id), eq(accidentRecordsTable.companyId, cid))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

// ---- Vehicle Availability ----
router.get("/v1/fleet/availability", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select({
    block: vehicleAvailabilityTable,
    vehicleRegNo: vehiclesTable.registrationNumber,
    vehicleModel: vehiclesTable.model,
  }).from(vehicleAvailabilityTable)
    .leftJoin(vehiclesTable, eq(vehicleAvailabilityTable.vehicleId, vehiclesTable.id))
    .where(eq(vehicleAvailabilityTable.companyId, cid)).orderBy(desc(vehicleAvailabilityTable.fromDate));
  res.json(rows);
});

router.post("/v1/fleet/availability", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { vehicleId, fromDate, toDate, reason, notes } = req.body;
  const [created] = await db.insert(vehicleAvailabilityTable).values({
    companyId: cid, vehicleId, fromDate, toDate, reason: reason || "off_road", notes,
  }).returning();
  res.status(201).json(created);
});

router.delete("/v1/fleet/availability/:id", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(vehicleAvailabilityTable).where(and(eq(vehicleAvailabilityTable.id, req.params.id), eq(vehicleAvailabilityTable.companyId, cid)));
  res.status(204).end();
});

export default router;
