import { Router } from "express";
import { db } from "@workspace/db";
import { driverAttendanceTable, driverSalaryTable, driversTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// GET /v1/drivers/:id/attendance
router.get("/v1/drivers/:id/attendance", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { month } = req.query as { month?: string };
  const q = db.select().from(driverAttendanceTable)
    .where(and(
      eq(driverAttendanceTable.companyId, companyId),
      eq(driverAttendanceTable.driverId, req.params.id)
    ))
    .orderBy(desc(driverAttendanceTable.date));
  const rows = await q;
  const filtered = month ? rows.filter(r => r.date.startsWith(month)) : rows;
  res.json(filtered);
});

// POST /v1/drivers/:id/attendance
router.post("/v1/drivers/:id/attendance", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { date, status, checkIn, checkOut, notes } = req.body;
  // Upsert by driver + date
  const existing = await db.select().from(driverAttendanceTable)
    .where(and(
      eq(driverAttendanceTable.companyId, companyId),
      eq(driverAttendanceTable.driverId, req.params.id),
      eq(driverAttendanceTable.date, date)
    )).limit(1);
  if (existing.length > 0) {
    const [updated] = await db.update(driverAttendanceTable)
      .set({ status, checkIn, checkOut, notes })
      .where(eq(driverAttendanceTable.id, existing[0].id))
      .returning();
    res.json(updated);
  }
  const [created] = await db.insert(driverAttendanceTable)
    .values({ companyId, driverId: req.params.id, date, status, checkIn, checkOut, notes })
    .returning();
  res.status(201).json(created);
});

// GET /v1/drivers/attendance (all drivers, all attendance)
router.get("/v1/drivers/attendance", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { month } = req.query as { month?: string };
  const rows = await db.select().from(driverAttendanceTable)
    .where(eq(driverAttendanceTable.companyId, companyId))
    .orderBy(desc(driverAttendanceTable.date));
  const filtered = month ? rows.filter(r => r.date.startsWith(month)) : rows;
  res.json(filtered);
});

// GET /v1/drivers/:id/salary
router.get("/v1/drivers/:id/salary", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(driverSalaryTable)
    .where(and(
      eq(driverSalaryTable.companyId, companyId),
      eq(driverSalaryTable.driverId, req.params.id)
    ))
    .orderBy(desc(driverSalaryTable.month));
  res.json(rows);
});

// POST /v1/drivers/:id/salary
router.post("/v1/drivers/:id/salary", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { month, baseSalary, tripIncentive, allowances, deductions, bonus, tripsCount, presentDays, notes } = req.body;
  const net = (parseFloat(baseSalary || 0) + parseFloat(tripIncentive || 0) + parseFloat(allowances || 0) + parseFloat(bonus || 0) - parseFloat(deductions || 0));
  const existing = await db.select().from(driverSalaryTable)
    .where(and(
      eq(driverSalaryTable.companyId, companyId),
      eq(driverSalaryTable.driverId, req.params.id),
      eq(driverSalaryTable.month, month)
    )).limit(1);
  if (existing.length > 0) {
    const [updated] = await db.update(driverSalaryTable)
      .set({ baseSalary, tripIncentive, allowances, deductions, bonus, netSalary: String(net), tripsCount, presentDays, notes })
      .where(eq(driverSalaryTable.id, existing[0].id))
      .returning();
    res.json(updated);
  }
  const [created] = await db.insert(driverSalaryTable)
    .values({ companyId, driverId: req.params.id, month, baseSalary, tripIncentive: tripIncentive || "0", allowances: allowances || "0", deductions: deductions || "0", bonus: bonus || "0", netSalary: String(net), tripsCount: tripsCount || 0, presentDays: presentDays || 0, notes })
    .returning();
  res.status(201).json(created);
});

// PATCH /v1/drivers/salary/:id/pay
router.patch("/v1/drivers/salary/:id/pay", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [updated] = await db.update(driverSalaryTable)
    .set({ status: "paid", paidAt: new Date() })
    .where(and(eq(driverSalaryTable.id, req.params.id), eq(driverSalaryTable.companyId, companyId)))
    .returning();
  if (!updated) res.status(404).json({ error: "Not found" }); return;
  res.json(updated);
});

// GET /v1/drivers/salary (all)
router.get("/v1/drivers/salary", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select({
    salary: driverSalaryTable,
    driverName: driversTable.name,
    driverPhone: driversTable.phone,
  }).from(driverSalaryTable)
    .leftJoin(driversTable, eq(driverSalaryTable.driverId, driversTable.id))
    .where(eq(driverSalaryTable.companyId, companyId))
    .orderBy(desc(driverSalaryTable.month));
  res.json(rows);
});

export default router;
