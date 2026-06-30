import { Router } from "express";
import { db } from "@workspace/db";
import { couponsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

router.get("/v1/marketing/coupons", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(couponsTable)
    .where(and(eq(couponsTable.companyId, companyId), eq(couponsTable.isDeleted, false)))
    .orderBy(desc(couponsTable.createdAt));
  res.json(rows);
});

router.post("/v1/marketing/coupons", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { code, description, type, value, minBookingAmount, maxDiscount, usageLimit, expiresAt, isActive } = req.body;
  const [row] = await db.insert(couponsTable)
    .values({ companyId, code: code.toUpperCase(), description, type: type || "percent", value: String(value), minBookingAmount: minBookingAmount ? String(minBookingAmount) : undefined, maxDiscount: maxDiscount ? String(maxDiscount) : undefined, usageLimit, expiresAt: expiresAt ? new Date(expiresAt) : undefined, isActive: isActive ?? true })
    .returning();
  res.status(201).json(row);
});

router.patch("/v1/marketing/coupons/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const updates: any = {};
  const fields = ["code", "description", "type", "value", "minBookingAmount", "maxDiscount", "usageLimit", "isActive", "expiresAt"];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      if (f === "code") updates.code = req.body.code.toUpperCase();
      else if (f === "expiresAt") updates.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
      else if (["value","minBookingAmount","maxDiscount"].includes(f)) updates[f] = req.body[f] !== null ? String(req.body[f]) : null;
      else updates[f] = req.body[f];
    }
  }
  const [row] = await db.update(couponsTable).set(updates)
    .where(and(eq(couponsTable.id, req.params.id), eq(couponsTable.companyId, companyId)))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/v1/marketing/coupons/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.update(couponsTable).set({ isDeleted: true })
    .where(and(eq(couponsTable.id, req.params.id), eq(couponsTable.companyId, companyId)));
  res.status(204).send();
});

// Validate coupon (public)
router.post("/v1/public/coupons/validate", async (req, res): Promise<void> => {
  const { code, bookingAmount, companyId } = req.body;
  if (!code || !companyId) res.status(400).json({ error: "code and companyId required" });
  const [coupon] = await db.select().from(couponsTable)
    .where(and(eq(couponsTable.companyId, companyId), eq(couponsTable.isDeleted, false)))
    .limit(100);
  const found = (await db.select().from(couponsTable)
    .where(and(eq(couponsTable.companyId, companyId), eq(couponsTable.isDeleted, false)))).find(c => c.code === code.toUpperCase() && c.isActive);
  if (!found) { res.status(404).json({ error: "Invalid or expired coupon" }); return; }
  if (found.expiresAt && new Date(found.expiresAt) < new Date()) res.status(400).json({ error: "Coupon has expired" });
  if (found.usageLimit && found.usedCount >= found.usageLimit) res.status(400).json({ error: "Coupon usage limit reached" });
  const amount = parseFloat(bookingAmount || 0);
  const minAmt = parseFloat(found.minBookingAmount || "0");
  if (amount < minAmt) res.status(400).json({ error: `Minimum booking amount is ₹${minAmt}` });
  let discount = 0;
  if (found.type === "percent") {
    discount = (amount * parseFloat(found.value)) / 100;
    if (found.maxDiscount) discount = Math.min(discount, parseFloat(found.maxDiscount));
  } else {
    discount = parseFloat(found.value);
  }
  res.json({ valid: true, coupon: found, discount: Math.round(discount * 100) / 100 });
});

export default router;
