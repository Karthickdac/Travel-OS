import { Router } from "express";
import { db } from "@workspace/db";
import { referralsTable, campaignsTable, loyaltyTransactionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

function companyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

// ---- Referrals ----
router.get("/v1/marketing/referrals", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(referralsTable).where(eq(referralsTable.companyId, cid)).orderBy(desc(referralsTable.createdAt));
  res.json(rows);
});

router.post("/v1/marketing/referrals", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { referrerName, referrerPhone, code, refereeName, refereePhone, rewardAmount } = req.body;
  const [created] = await db.insert(referralsTable).values({
    companyId: cid, referrerName, referrerPhone, code, refereeName, refereePhone, rewardAmount: rewardAmount || "0",
  }).returning();
  res.status(201).json(created);
});

router.patch("/v1/marketing/referrals/:id", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { status, rewardAmount } = req.body;
  const patch: any = {};
  if (status !== undefined) patch.status = status;
  if (rewardAmount !== undefined) patch.rewardAmount = rewardAmount;
  const [updated] = await db.update(referralsTable).set(patch)
    .where(and(eq(referralsTable.id, req.params.id), eq(referralsTable.companyId, cid))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

// ---- Campaigns ----
router.get("/v1/marketing/campaigns", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(campaignsTable).where(eq(campaignsTable.companyId, cid)).orderBy(desc(campaignsTable.createdAt));
  res.json(rows);
});

router.post("/v1/marketing/campaigns", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { name, channel, subject, message, audience, status, scheduledAt } = req.body;
  const [created] = await db.insert(campaignsTable).values({
    companyId: cid, name, channel: channel || "email", subject, message, audience: audience || "all",
    status: status || "draft", scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
  }).returning();
  res.status(201).json(created);
});

router.patch("/v1/marketing/campaigns/:id", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { name, channel, subject, message, audience, status } = req.body;
  const patch: any = {};
  for (const [k, v] of Object.entries({ name, channel, subject, message, audience, status })) {
    if (v !== undefined) patch[k] = v;
  }
  if (status === "sent") { patch.sentAt = new Date(); }
  const [updated] = await db.update(campaignsTable).set(patch)
    .where(and(eq(campaignsTable.id, req.params.id), eq(campaignsTable.companyId, cid))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/v1/marketing/campaigns/:id", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(campaignsTable).where(and(eq(campaignsTable.id, req.params.id), eq(campaignsTable.companyId, cid)));
  res.status(204).end();
});

// ---- Loyalty ----
router.get("/v1/marketing/loyalty", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(loyaltyTransactionsTable).where(eq(loyaltyTransactionsTable.companyId, cid)).orderBy(desc(loyaltyTransactionsTable.date));
  res.json(rows);
});

router.post("/v1/marketing/loyalty", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { customerId, customerName, type, points, reason, date } = req.body;
  const [created] = await db.insert(loyaltyTransactionsTable).values({
    companyId: cid, customerId: customerId || null, customerName, type, points,
    reason, date: date || new Date().toISOString().slice(0, 10),
  }).returning();
  res.status(201).json(created);
});

export default router;
